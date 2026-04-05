import { seededRandom, randomInt } from './rng';
import type { GameState, Bolt } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { getLevelParams } from './progression';
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
  // derive level parameters (numBolts, stackHeight) from progression rules so
  // generator matches the rest of the game progression logic.
  const levelNum = opts.level || 1;
  const { numBolts, stackHeight } = getLevelParams(opts.difficulty, levelNum);
  const seed = opts.seed != null ? String(opts.seed) : `${opts.difficulty}-${levelNum}`;
  const rng = seededRandom(seed);
  const shuffleMoves = randomInt(rng, cfg.shuffleRange[0], cfg.shuffleRange[1]);

  const bolts = createSolvedBoard(numBolts, stackHeight);
  // Temporarily add an extra empty bolt to allow legal reverse moves while shuffling.
  // This temp bolt will be removed before returning the generated state so the
  // level does not start with the extra bolt present.
  const TEMP_EXTRA_ID = '__temp_extra';
  bolts.push({ id: TEMP_EXTRA_ID, capacity: stackHeight, nuts: [] });
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
  // Use the actual shuffled bolt state directly (minus the temp bolt).
  // Replaying only `filteredMoves` on a fresh solved board is incorrect: those
  // moves were recorded while temp-bolt moves freed capacity, so replaying them
  // without the temp moves creates over-capacity bolts and clips nuts above the
  // SVG viewport. The shuffle loop already respected capacity at each step, so
  // the final `bolts` array is always valid.
  const boltsToReturn = bolts.filter((b) => b.id !== TEMP_EXTRA_ID);
  // Move history cannot be reliably reconstructed without temp-bolt moves,
  // so start fresh. Undo only covers moves made during gameplay.
  const filteredMoves: any[] = [];

  const state: GameState = {
    bolts: boltsToReturn || bolts,
    // An empty extra bolt is included at creation; still mark as not 'used' —
    // presence of the extra bolt itself determines availability.
    extraBoltUsed: false,
    level: opts.level || 1,
    difficulty: opts.difficulty,
    seed,
    moveHistory: filteredMoves,
  };

  // Guarantee at least one mixed bolt so the level does not look solved at start.
  // Operate on the returned bolts and the filteredMoves list so the returned
  // state is consistent and reversible.
  if (!hasMixedBolt(boltsToReturn)) {
    // try to find a source and a target where moving one nut will create a mixed bolt
    let mixedApplied = false;
    for (let i = 0; i < boltsToReturn.length; i++) {
      const src = boltsToReturn[i];
      if (src.nuts.length === 0) continue;
      for (let j = 0; j < boltsToReturn.length; j++) {
        if (i === j) continue;
        const tgt = boltsToReturn[j];
        if (tgt.nuts.length < tgt.capacity && tgt.nuts[tgt.nuts.length - 1] !== src.nuts[src.nuts.length - 1]) {
          const moved = src.nuts.splice(src.nuts.length - 1, 1);
          if (moved.length > 0) {
            tgt.nuts.push(moved[0]);
            filteredMoves.push({ fromBoltId: src.id, toBoltId: tgt.id, color: moved[0], count: 1, timestamp: Date.now() });
            mixedApplied = true;
            break;
          }
        }
      }
      if (mixedApplied) break;
    }

    // fallback: if no capacity-based move was possible, swap top nuts between first two non-empty bolts
    if (!mixedApplied) {
      const nonEmpty = boltsToReturn.filter((b) => b.nuts.length > 0);
      if (nonEmpty.length >= 2) {
        const a = nonEmpty[0];
        const b = nonEmpty[1];
        const ta = a.nuts.pop() as string;
        const tb = b.nuts.pop() as string;
        a.nuts.push(tb);
        b.nuts.push(ta);
        // record as two moves for reversibility
        filteredMoves.push({ fromBoltId: a.id, toBoltId: b.id, color: ta, count: 1, timestamp: Date.now() });
        filteredMoves.push({ fromBoltId: b.id, toBoltId: a.id, color: tb, count: 1, timestamp: Date.now() });
      }
    }
  }

  // Normalize and validate before returning/emit

  // update state.moveHistory to the filteredMoves we used/repaired above
  state.moveHistory = filteredMoves;
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
