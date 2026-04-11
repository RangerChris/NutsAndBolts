import { seededRandom, randomInt } from './rng';
import type { GameState, Bolt, Move } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { getLevelParams } from './progression';
import { pickTopGroup, normalizeState, checkStateInvariants, computeSolutionPath } from './engine';
import { emitBalancerEvent } from './balancer';
import type { Nut } from './types';

type CreateLevelOpts = { difficulty: GameState['difficulty']; level?: number; seed?: string | number; hiddenNuts?: boolean | null };

function hasSingletonColorCount(bolts: Bolt[]): boolean {
  const counts = new Map<string, number>();
  for (const bolt of bolts) {
    for (const nut of bolt.nuts) {
      counts.set(nut.color, (counts.get(nut.color) ?? 0) + 1);
    }
  }
  for (const count of counts.values()) {
    if (count === 1) return true;
  }
  return false;
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

export function createLevel(opts: CreateLevelOpts): { state: GameState; seed: string } {
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
  const hasMixedBolt = (arr: Bolt[]) => arr.some((b) => b.nuts.length > 1 && !b.nuts.every((n) => n.color === b.nuts[0].color));

  for (let i = 0; i < shuffleMoves; i++) {
    const nonEmpty = bolts.filter((b) => b.nuts.length > 0);
    if (nonEmpty.length === 0) break;
    const src = nonEmpty[Math.floor(rng() * nonEmpty.length)];
    const { color, count } = pickTopGroup(src);
    if (!color || count === 0) continue;
    const moveCount = Math.max(1, Math.min(count, Math.floor(rng() * count) + 1));
    const targets = bolts.filter((b) => b.id !== src.id && b.nuts.length + moveCount <= b.capacity);
    if (targets.length === 0) continue;
    const mixedCandidates = targets.filter((b) => b.nuts.length > 0 && b.nuts[b.nuts.length - 1].color !== color);
    const candidates = (mixedCandidates.length > 0 ? mixedCandidates : targets).filter((t) => !(lastMove && lastMove.from === t.id && lastMove.to === src.id));
    const pickFrom = candidates.length > 0 ? candidates : mixedCandidates.length > 0 ? mixedCandidates : targets;
    const tgt = pickFrom[Math.floor(rng() * pickFrom.length)];
    const moved = src.nuts.splice(Math.max(0, src.nuts.length - moveCount), moveCount) as Nut[];
    for (const m of moved) m.revealed = true;
    tgt.nuts.push(...moved);
    const mv = moved.length
      ? {
          fromBoltId: src.id,
          toBoltId: tgt.id,
          color,
          count: moved.length,
          timestamp: Date.now(),
        }
      : null;
    if (mv) {
      moveHistory.push(mv);
      lastMove = { from: mv.fromBoltId, to: mv.toBoltId };
    }
  }
  const boltsToReturn = bolts.filter((b) => b.id !== TEMP_EXTRA_ID);
  boltsToReturn.push({ id: EXTRA_BOLT_ID, capacity: stackHeight, nuts: [] });
  const filteredMoves: Move[] = [];
  const hiddenNutsEnabled = typeof opts.hiddenNuts === 'boolean' ? opts.hiddenNuts : rng() < 0.25;

  for (const b of boltsToReturn) {
    for (const n of b.nuts) {
      (n as Nut).revealed = false;
    }
    if (b.nuts.length > 0) {
      const top = b.nuts[b.nuts.length - 1];
      if (top) top.revealed = true;
    }
  }

  const state: GameState = {
    bolts: boltsToReturn || bolts,
    extraBoltUsed: true,
    level: opts.level || 1,
    difficulty: opts.difficulty,
    seed,
    hiddenNuts: hiddenNutsEnabled,
    moveHistory: filteredMoves,
  };

  if (!hasMixedBolt(boltsToReturn)) {
    let mixedApplied = false;
    for (let i = 0; i < boltsToReturn.length; i++) {
      const src = boltsToReturn[i];
      if (src.nuts.length === 0) continue;
      for (let j = 0; j < boltsToReturn.length; j++) {
        if (i === j) continue;
        const tgt = boltsToReturn[j];
        if (
          tgt.nuts.length < tgt.capacity &&
          (tgt.nuts.length === 0 || tgt.nuts[tgt.nuts.length - 1].color !== src.nuts[src.nuts.length - 1].color)
        ) {
          const moved = src.nuts.splice(src.nuts.length - 1, 1);
          if (moved.length > 0) {
            tgt.nuts.push(moved[0]);
            filteredMoves.push({ fromBoltId: src.id, toBoltId: tgt.id, color: (moved[0] as Nut).color, count: 1, timestamp: Date.now() });
            mixedApplied = true;
            break;
          }
        }
      }
      if (mixedApplied) break;
    }
    if (!mixedApplied) {
      const nonEmpty = boltsToReturn.filter((b) => b.nuts.length > 0);
      if (nonEmpty.length >= 2) {
        const a = nonEmpty[0];
        const b = nonEmpty[1];
        const ta = a.nuts.pop() as Nut;
        const tb = b.nuts.pop() as Nut;
        a.nuts.push(tb);
        b.nuts.push(ta);
        filteredMoves.push({ fromBoltId: a.id, toBoltId: b.id, color: ta.color, count: 1, timestamp: Date.now() });
        filteredMoves.push({ fromBoltId: b.id, toBoltId: a.id, color: tb.color, count: 1, timestamp: Date.now() });
      }
    }
  }

  state.moveHistory = filteredMoves;
  const normalized = normalizeState(state);

  if ((opts.difficulty === 'hard' || opts.difficulty === 'extreme') && hasSingletonColorCount(normalized.bolts)) {
    const next = retrySeed(seed);
    if (next.retryCount < 5) {
      return createLevel({ ...opts, seed: next.retrySeed });
    }
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

  try {
    const solution = computeSolutionPath(normalized, {
      maxDepth: Math.max(80, shuffleMoves * 3),
      maxStates: 250000,
    });
    normalized.optimalMoves = solution ? solution.length : null;

    if (!solution) {
      const next = retrySeed(seed);
      if (next.retryCount < 5) {
        return createLevel({ ...opts, seed: next.retrySeed });
      }
    }
  } catch {
    normalized.optimalMoves = null;
  }

  return { state: normalized, seed };
}
