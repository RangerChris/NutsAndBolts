import { seededRandom, randomInt } from './rng';
import type { GameState, Bolt, Move } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { getLevelParams } from './progression';
import { pickTopGroup, normalizeState, checkStateInvariants, computeSolutionPath, revealTopColorRun } from './engine';
import { emitBalancerEvent } from './balancer';
import type { Nut } from './types';

type CreateLevelOpts = { difficulty: GameState['difficulty']; level?: number; seed?: string | number; hiddenNuts?: boolean | null };
type CreateLevelRuntimeOpts = CreateLevelOpts & { skipSolvabilityCheck?: boolean };

const MAX_RETRIES = 5;

function hasSingletonColorCount(bolts: Bolt[]): boolean {
  const counts = new Map<string, number>();
  for (const bolt of bolts) {
    for (const nut of bolt.nuts) {
      counts.set(nut.color, (counts.get(nut.color) ?? 0) + 1);
    }
  }
  return Array.from(counts.values()).some((c) => c === 1);
}

function retrySeed(seed: string): { baseSeed: string; retryCount: number; retrySeed: string } {
  const retryMatch = /-retry-(\d+)$/.exec(seed);
  const retryCount = retryMatch ? Number(retryMatch[1]) : 0;
  const baseSeed = seed.replace(/-retry-\d+$/, '');
  return {
    baseSeed,
    retryCount,
    retrySeed: `${baseSeed}-retry-${retryCount + 1}`,
  };
}

function makeMove(fromBoltId: string, toBoltId: string, color: string, count: number): Move {
  return { fromBoltId, toBoltId, color, count, timestamp: Date.now() };
}

function tryWithRetry(opts: CreateLevelRuntimeOpts, seed: string): { state: GameState; seed: string } | null {
  const next = retrySeed(seed);
  if (next.retryCount < MAX_RETRIES) {
    return createLevel({ ...opts, seed: next.retrySeed });
  }
  return null;
}

function ensureMixedBolt(bolts: Bolt[], filteredMoves: Move[]): void {
  const hasAnyMixedBolt = bolts.some((b) => b.nuts.length > 1 && !b.nuts.every((n) => n.color === b.nuts[0].color));
  if (hasAnyMixedBolt) return;

  for (let i = 0; i < bolts.length; i++) {
    const src = bolts[i];
    if (src.nuts.length === 0) continue;
    const srcTopColor = src.nuts[src.nuts.length - 1].color;
    for (let j = 0; j < bolts.length; j++) {
      if (i === j) continue;
      const tgt = bolts[j];
      const tgtHasRoom = tgt.nuts.length < tgt.capacity;
      const tgtIsEmpty = tgt.nuts.length === 0;
      const tgtTopDiffers = !tgtIsEmpty && tgt.nuts[tgt.nuts.length - 1].color !== srcTopColor;
      if (!tgtHasRoom || !(tgtIsEmpty || tgtTopDiffers)) continue;

      const moved = src.nuts.splice(src.nuts.length - 1, 1);
      if (moved.length === 0) continue;
      tgt.nuts.push(moved[0]);
      filteredMoves.push(makeMove(src.id, tgt.id, moved[0].color, 1));
      return;
    }
  }

  const nonEmpty = bolts.filter((b) => b.nuts.length > 0);
  if (nonEmpty.length < 2) return;
  const a = nonEmpty[0];
  const b = nonEmpty[1];
  const ta = a.nuts.pop() as Nut;
  const tb = b.nuts.pop() as Nut;
  a.nuts.push(tb);
  b.nuts.push(ta);
  filteredMoves.push(makeMove(a.id, b.id, ta.color, 1));
  filteredMoves.push(makeMove(b.id, a.id, tb.color, 1));
}

export function createSolvedBoard(numBolts: number, stackHeight: number): Bolt[] {
  const bolts: Bolt[] = [];
  for (let i = 0; i < numBolts; i++) {
    const color = `c${i}`;
    const nuts: Nut[] = [];
    for (let j = 0; j < stackHeight; j++) {
      nuts.push({ id: `b${i}-n${j}`, color, revealed: j === stackHeight - 1 });
    }
    bolts.push({ id: `b${i}`, capacity: stackHeight, nuts });
  }
  return bolts;
}

type ShuffleStep = {
  src: Bolt;
  targets: Bolt[];
  color: string;
  count: number;
};

function pickShuffleSource(bolts: Bolt[], rng: () => number, lastMove: { from?: string; to?: string } | null): ShuffleStep | null {
  const nonEmpty = bolts.filter((b) => b.nuts.length > 0);
  if (nonEmpty.length === 0) return null;
  const src = nonEmpty[Math.floor(rng() * nonEmpty.length)];
  const { color, count } = pickTopGroup(src);
  if (!color || count === 0) return null;
  const moveCount = Math.max(1, Math.min(count, Math.floor(rng() * count) + 1));
  const targets = bolts.filter((b) => b.id !== src.id && b.nuts.length + moveCount <= b.capacity);
  if (targets.length === 0) return null;
  const mixedCandidates = targets.filter((b) => b.nuts.length > 0 && b.nuts[b.nuts.length - 1].color !== color);
  const basePool = mixedCandidates.length > 0 ? mixedCandidates : targets;
  const filtered = basePool.filter((t) => !(lastMove && lastMove.from === t.id && lastMove.to === src.id));
  const pickFrom = filtered.length > 0 ? filtered : mixedCandidates.length > 0 ? mixedCandidates : targets;
  return { src, targets: pickFrom, color, count: moveCount };
}

function applyShuffleStep(bolts: Bolt[], step: ShuffleStep, rng: () => number, moveHistory: Move[]): void {
  const tgt = step.targets[Math.floor(rng() * step.targets.length)];
  const moved = step.src.nuts.splice(step.src.nuts.length - step.count, step.count) as Nut[];
  for (const m of moved) m.revealed = true;
  tgt.nuts.push(...moved);
  moveHistory.push(makeMove(step.src.id, tgt.id, step.color, moved.length));
}

export function createLevel(opts: CreateLevelRuntimeOpts): { state: GameState; seed: string } {
  const cfg = DIFFICULTY_CONFIG[opts.difficulty];
  const levelNum = opts.level || 1;
  const { numBolts, stackHeight } = getLevelParams(opts.difficulty, levelNum);
  const seed = opts.seed != null ? String(opts.seed) : `${opts.difficulty}-${levelNum}`;
  const rng = seededRandom(seed);
  const shuffleMoves = randomInt(rng, cfg.shuffleRange[0], cfg.shuffleRange[1]);

  const bolts = createSolvedBoard(numBolts, stackHeight);
  const EXTRA_BOLT_ID = 'extra-0';
  const TEMP_EXTRA_ID = '__temp_extra';
  bolts.push({ id: TEMP_EXTRA_ID, capacity: stackHeight, nuts: [] });
  const moveHistory: Move[] = [];

  let lastMove: { from?: string; to?: string } | null = null;
  for (let i = 0; i < shuffleMoves; i++) {
    const step = pickShuffleSource(bolts, rng, lastMove);
    if (!step) continue;
    applyShuffleStep(bolts, step, rng, moveHistory);
    const last = moveHistory[moveHistory.length - 1];
    lastMove = { from: last.fromBoltId, to: last.toBoltId };
  }

  const boltsToReturn = bolts.filter((b) => b.id !== TEMP_EXTRA_ID);
  boltsToReturn.push({ id: EXTRA_BOLT_ID, capacity: stackHeight, nuts: [] });
  const filteredMoves: Move[] = [];
  const hiddenNutsEnabled = typeof opts.hiddenNuts === 'boolean' ? opts.hiddenNuts : rng() < 0.25;

  for (const b of boltsToReturn) {
    for (const n of b.nuts) n.revealed = false;
    if (b.nuts.length > 0) b.nuts[b.nuts.length - 1].revealed = true;
  }

  const state: GameState = {
    bolts: boltsToReturn,
    extraBoltUsed: true,
    level: opts.level || 1,
    difficulty: opts.difficulty,
    seed,
    hiddenNuts: hiddenNutsEnabled,
    moveHistory: filteredMoves,
  };

  ensureMixedBolt(boltsToReturn, filteredMoves);

  // Hidden-nut mode should reveal the full contiguous top color run on each bolt.
  if (hiddenNutsEnabled) {
    for (const bolt of boltsToReturn) revealTopColorRun(bolt);
  }

  state.moveHistory = filteredMoves;
  const normalized = normalizeState(state);

  if ((opts.difficulty === 'hard' || opts.difficulty === 'extreme') && hasSingletonColorCount(normalized.bolts)) {
    const retried = tryWithRetry(opts, seed);
    if (retried) return retried;
  }

  const invariants = checkStateInvariants(normalized);

  try {
    emitBalancerEvent('generator', {
      seed,
      difficulty: opts.difficulty,
      level: opts.level || 1,
      params: { numBolts, stackHeight, shuffleMoves },
      generated: {
        bolts: normalized.bolts.length,
        shufflePerformed: normalized.moveHistory.length,
      },
      invariants,
    });
  } catch {}

  if (opts.skipSolvabilityCheck) {
    normalized.optimalMoves = null;
  } else {
    let solution: ReturnType<typeof computeSolutionPath> = null;
    try {
      solution = computeSolutionPath(normalized, {
        maxDepth: Math.max(80, shuffleMoves * 3),
        maxStates: 250000,
      });
    } catch {
      solution = null;
    }
    normalized.optimalMoves = solution ? solution.length : null;
    if (!solution) {
      const retried = tryWithRetry(opts, seed);
      if (retried) return retried;
    }
  }

  return { state: normalized, seed };
}
