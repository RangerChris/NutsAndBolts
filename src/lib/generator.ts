import { seededRandom, randomInt } from './rng';
import type { GameState, Bolt } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { pickTopGroup, normalizeState, checkStateInvariants } from './engine';
import { emitBalancerEvent } from './balancer';

type CreateLevelOpts = { difficulty: GameState['difficulty']; level?: number; seed?: string | number };

export function createSolvedBoard(numBolts: number, stackHeight: number): Bolt[] {
  const bolts: Bolt[] = [];
  for (let i = 0; i < numBolts; i++) {
    const color = `c${i}`;
    const nuts = new Array(stackHeight).fill(color);
    bolts.push({ id: `b${i}`, capacity: stackHeight, nuts });
  }
  return bolts;
}

export function createLevel(opts: CreateLevelOpts): { state: GameState; seed: string } {
  const cfg = DIFFICULTY_CONFIG[opts.difficulty];
  const numBolts = cfg.minBolts;
  const stackHeight = cfg.stackHeightRange[0];
  const seed = opts.seed != null ? String(opts.seed) : `${opts.difficulty}-${opts.level || 1}`;
  const rng = seededRandom(seed);
  const shuffleMoves = randomInt(rng, cfg.shuffleRange[0], cfg.shuffleRange[1]);

  const bolts = createSolvedBoard(numBolts, stackHeight);
  // Add one temporary empty bolt to allow legal reverse moves
  bolts.push({ id: `extra`, capacity: stackHeight, nuts: [] });
  const moveHistory: any[] = [];

  let lastMove: { from?: string; to?: string } | null = null;
  const hasMixedBolt = (arr: Bolt[]) =>
    arr.some((b) => b.nuts.length > 1 && !b.nuts.every((n) => n === b.nuts[0]));

  for (let i = 0; i < shuffleMoves; i++) {
    // pick random source with movable top group
    const nonEmpty = bolts.filter((b) => b.nuts.length > 0);
    if (nonEmpty.length === 0) break;
    const src = nonEmpty[Math.floor(rng() * nonEmpty.length)];
    const { color, count } = pickTopGroup(src);
    if (!color || count === 0) continue;
    // choose a partial move size to avoid always moving whole stacks
    const moveCount = Math.max(1, Math.min(count, Math.floor(rng() * count) + 1));
    // scramble generation allows mixing colors in target stacks
    const targets = bolts.filter((b) => b.id !== src.id && b.nuts.length + moveCount <= b.capacity);
    if (targets.length === 0) continue;
    const mixedCandidates = targets.filter((b) => b.nuts.length > 0 && b.nuts[b.nuts.length - 1] !== color);
    // avoid immediate reversal
    const candidates = (mixedCandidates.length > 0 ? mixedCandidates : targets).filter(
      (t) => !(lastMove && lastMove.from === t.id && lastMove.to === src.id)
    );
    const pickFrom = candidates.length > 0 ? candidates : mixedCandidates.length > 0 ? mixedCandidates : targets;
    const tgt = pickFrom[Math.floor(rng() * pickFrom.length)];
    // perform a partial move of `moveCount` nuts
    const moved = src.nuts.splice(Math.max(0, src.nuts.length - moveCount), moveCount);
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

  const state: GameState = {
    bolts,
    // An empty extra bolt is included at creation; mark it as used so only one exists
    extraBoltUsed: true,
    level: opts.level || 1,
    difficulty: opts.difficulty,
    seed,
    moveHistory,
  };

  // Guarantee at least one mixed bolt so the level does not look solved at start.
  if (!hasMixedBolt(state.bolts)) {
    const src = state.bolts.find((b) => b.nuts.length > 0);
    const tgt = state.bolts.find(
      (b) =>
        b.id !== src?.id &&
        b.nuts.length > 0 &&
        b.nuts.length < b.capacity &&
        src &&
        b.nuts[b.nuts.length - 1] !== src.nuts[src.nuts.length - 1]
    );
    if (src && tgt) {
      const moved = src.nuts.splice(src.nuts.length - 1, 1);
      if (moved.length > 0) {
        tgt.nuts.push(moved[0]);
        moveHistory.push({
          fromBoltId: src.id,
          toBoltId: tgt.id,
          color: moved[0],
          count: 1,
          timestamp: Date.now(),
        });
      }
    }
  }

  // Normalize and validate before returning/emit

  const normalized = normalizeState(state);
  const invariants = checkStateInvariants(normalized);

  // Emit a balancing event for analysis tools (include invariants)
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
  } catch (e) {
    // ignore
  }

  return { state: normalized, seed };
}
