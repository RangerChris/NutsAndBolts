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

type CreateLevelResult = { state: GameState; seed: string; solution: Move[] };

function tryWithRetry(opts: CreateLevelRuntimeOpts, seed: string): CreateLevelResult | null {
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
  // No swap fallback: the loop above always finds the empty extra bolt as a legal, reversible
  // target when any non-empty bolt exists, so falling through here means the board is empty.
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
  // Only pick sources that admit an immediately-undoable move: either the whole bolt is one color
  // (moving any amount off empties it or leaves the same color on top) or the top run has size >= 2
  // (a partial move leaves the top color in place, keeping the move reversible). Moving a lone
  // differently-colored top nut off a mixed bolt would expose a new color and break reversibility.
  const safe = bolts.filter((b) => {
    if (b.nuts.length === 0) return false;
    const { count } = pickTopGroup(b);
    return count === b.nuts.length || count > 1;
  });
  if (safe.length === 0) return null;
  const src = safe[Math.floor(rng() * safe.length)];
  const { color, count } = pickTopGroup(src);
  if (!color || count === 0) return null;
  // Partial move keeps the source's top color (reversible); a full move is only allowed when it
  // empties the source (count === src.nuts.length).
  const maxMove = count < src.nuts.length ? count - 1 : count;
  const moveCount = Math.max(1, Math.min(maxMove, Math.floor(rng() * maxMove) + 1));
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

export function createLevel(opts: CreateLevelRuntimeOpts): CreateLevelResult {
  const cfg = DIFFICULTY_CONFIG[opts.difficulty];
  const levelNum = opts.level || 1;
  const { numBolts, stackHeight } = getLevelParams(opts.difficulty, levelNum);
  const seed = opts.seed != null ? String(opts.seed) : `${opts.difficulty}-${levelNum}`;
  const rng = seededRandom(seed);
  const shuffleMoves = randomInt(rng, cfg.shuffleRange[0], cfg.shuffleRange[1]);

  const bolts = createSolvedBoard(numBolts, stackHeight);
  const EXTRA_BOLT_ID = 'extra-0';
  // The empty extra bolt doubles as the shuffle scratch space. Keeping it in the returned board
  // (instead of dropping a scratch bolt) preserves every nut and makes the reverse-shuffle a
  // valid solution. It may start non-empty; the game makes no assumption that it starts empty.
  bolts.push({ id: EXTRA_BOLT_ID, capacity: stackHeight, nuts: [] });
  const moveHistory: Move[] = [];

  let lastMove: { from?: string; to?: string } | null = null;
  for (let i = 0; i < shuffleMoves; i++) {
    const step = pickShuffleSource(bolts, rng, lastMove);
    if (!step) continue;
    applyShuffleStep(bolts, step, rng, moveHistory);
    const last = moveHistory[moveHistory.length - 1];
    lastMove = { from: last.fromBoltId, to: last.toBoltId };
  }

  const filteredMoves: Move[] = [];
  const hiddenNutsEnabled = typeof opts.hiddenNuts === 'boolean' ? opts.hiddenNuts : rng() < 0.25;

  for (const b of bolts) {
    for (const n of b.nuts) n.revealed = false;
    if (b.nuts.length > 0) b.nuts[b.nuts.length - 1].revealed = true;
  }

  const state: GameState = {
    bolts,
    extraBoltUsed: true,
    level: opts.level || 1,
    difficulty: opts.difficulty,
    seed,
    hiddenNuts: hiddenNutsEnabled,
    moveHistory: filteredMoves,
  };

  ensureMixedBolt(bolts, filteredMoves);

  // Hidden-nut mode should reveal the full contiguous top color run on each bolt.
  if (hiddenNutsEnabled) {
    for (const bolt of bolts) revealTopColorRun(bolt);
  }

  state.moveHistory = filteredMoves;
  const normalized = normalizeState(state);

  if ((opts.difficulty === 'hard' || opts.difficulty === 'extreme') && hasSingletonColorCount(normalized.bolts)) {
    const retried = tryWithRetry(opts, seed);
    if (retried) return retried;
  }

  // The reverse of [shuffle moves ... ensureMixedBolt moves] is a guaranteed-valid solution on
  // the final board (every shuffle move is immediately-undoable, and ensureMixedBolt only does
  // legal reversible moves). Used as the optimalMoves fallback when the BFS solver exhausts its
  // budget (hard/extreme), and exposed for hint support / tests.
  const reversedSolution: Move[] = [...moveHistory, ...filteredMoves]
    .map((m) => ({ ...m, fromBoltId: m.toBoltId, toBoltId: m.fromBoltId }))
    .reverse();

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
    // Fall back to the verified reverse-shuffle length instead of null so the level is never
    // reported as unsolvable just because the solver ran out of budget.
    normalized.optimalMoves = solution ? solution.length : reversedSolution.length;
  }

  return { state: normalized, seed, solution: reversedSolution };
}
