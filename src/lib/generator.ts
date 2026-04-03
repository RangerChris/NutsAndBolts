import { seededRandom, randomInt } from './rng';
import type { GameState, Bolt } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { pickTopGroup, canPlaceGroup, performMove, normalizeState, checkStateInvariants } from './engine';
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

  for (let i = 0; i < shuffleMoves; i++) {
    // pick random source with movable top group
    const nonEmpty = bolts.filter((b) => b.nuts.length > 0);
    if (nonEmpty.length === 0) break;
    const src = nonEmpty[Math.floor(rng() * nonEmpty.length)];
    const { color, count } = pickTopGroup(src);
    if (!color || count === 0) continue;
    // find valid targets
    const targets = bolts.filter((b) => b.id !== src.id && canPlaceGroup(src, b, count).ok);
    if (targets.length === 0) continue;
    // avoid immediate reversal
    const candidates = targets.filter((t) => !(lastMove && lastMove.from === t.id && lastMove.to === src.id));
    const tgt = candidates.length > 0 ? candidates[Math.floor(rng() * candidates.length)] : targets[Math.floor(rng() * targets.length)];
    const mv = performMove(src, tgt);
    if (mv) {
      moveHistory.push(mv);
      lastMove = { from: mv.fromBoltId, to: mv.toBoltId };
    }
  }

  const state: GameState = {
    bolts,
    extraBoltUsed: false,
    level: opts.level || 1,
    difficulty: opts.difficulty,
    seed,
    moveHistory,
  };

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
