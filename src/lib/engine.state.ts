import type { Bolt, GameState, Move, Nut } from './types';
import { MAX_BOLTS } from './constants';
import { getMovableTopCount, performMove, markRevealedIfNeeded } from './engine.core';
import { emitBalancerEvent } from './balancer';

const nutColor = (n?: Nut | string | unknown) => (typeof n === 'string' ? n : (n as Nut | undefined)?.color);
const isNut = (n: unknown): n is Nut => typeof n === 'object' && n !== null && 'color' in n && 'id' in n && typeof ((n as { color?: unknown }).color) === 'string' && typeof ((n as { id?: unknown }).id) === 'string';

export function findBolt(state: GameState, id: string): Bolt | undefined {
  return state.bolts.find((b) => b.id === id);
}

export function validateState(state: GameState): { ok: boolean; reason?: string } {
  if (!state.bolts || !Array.isArray(state.bolts)) return { ok: false, reason: 'missing-bolts' };
  if (state.bolts.length === 0) return { ok: false, reason: 'no-bolts' };
  if (state.bolts.length > MAX_BOLTS) return { ok: false, reason: 'too-many-bolts' };
  for (const b of state.bolts) {
    if (!b.id) return { ok: false, reason: 'bolt-missing-id' };
    if (b.nuts.length > b.capacity) return { ok: false, reason: 'bolt-over-capacity' };
  }
  return { ok: true };
}

export function executeMoveOnState(state: GameState, fromId: string, toId: string): { success: boolean; reason?: string; move?: Move } {
  const src = findBolt(state, fromId);
  const tgt = findBolt(state, toId);
  if (!src || !tgt) return { success: false, reason: 'bolt-not-found' };
  const movable = getMovableTopCount(src, tgt);
  if (movable.count === 0) return { success: false, reason: movable.reason };
  const srcLenBefore = src.nuts.length;
  const move = performMove(src, tgt);
  if (!move) return { success: false, reason: 'perform-failed' };
  state.moveHistory = state.moveHistory || [];
  state.moveHistory.push(move);
  try {
    markRevealedIfNeeded(state, fromId, srcLenBefore, move.count);
  } catch {}
  try {
    if (isWin(state)) {
      const moveCount = state.moveHistory.length;
      const optimal = typeof state.optimalMoves === 'number' ? state.optimalMoves : null;
      let moveStars = 1;
      if (optimal && optimal > 0) {
        if (moveCount <= Math.floor(0.75 * optimal)) moveStars = 2;
        else moveStars = 1;
      }
      let timeStar = 0;
      const history = state.moveHistory || [];
      let timeSpent = 0;
      if (history.length >= 2) {
        const first = history[0].timestamp || 0;
        const last = history[history.length - 1].timestamp || 0;
        timeSpent = Math.max(0, last - first);
      } else {
        timeSpent = 0;
      }
      const availableMs = ((optimal && optimal > 0 ? optimal : moveCount) * 3) * 1000;
      if (timeSpent < availableMs) timeStar = 1;
      const totalStars = Math.min(3, moveStars + timeStar);
      emitBalancerEvent('game', {
        event: 'levelComplete',
        level: state.level,
        difficulty: state.difficulty,
        seed: state.seed,
        moveHistoryLength: moveCount,
        optimalMoves: optimal,
        timeSpentMs: timeSpent,
        timeAvailableMs: availableMs,
        stars: totalStars,
        bolts: state.bolts.length,
      });
    }
  } catch {}
  return { success: true, move };
}

export function computeOptimalMoves(startState: GameState, maxDepth = 20): number | null {
  const canon = (s: GameState) => s.bolts.map((b) => b.nuts.map((n) => nutColor(n) || '').join(',')).join('|');
  const cloneState = (s: GameState): GameState => ({
    bolts: s.bolts.map((b) => ({
      id: b.id,
      capacity: b.capacity,
      nuts: b.nuts.map((n, i) => (typeof n === 'string' ? { id: `${b.id}-n${i}`, color: n, revealed: false } : ({ ...(n as Nut) } as Nut))),
    } as Bolt)),
    extraBoltUsed: Boolean(s.extraBoltUsed),
    level: s.level,
    difficulty: s.difficulty,
    seed: s.seed,
    moveHistory: [],
  } as GameState);
  const startCanon = canon(startState);
  if (isWin(startState)) return 0;
  const queue: Array<{ state: GameState; depth: number }> = [{ state: cloneState(startState), depth: 0 }];
  const visited = new Set<string>([startCanon]);
  while (queue.length > 0) {
    const { state, depth } = queue.shift() as { state: GameState; depth: number };
    if (depth >= maxDepth) continue;
    for (let i = 0; i < state.bolts.length; i++) {
      for (let j = 0; j < state.bolts.length; j++) {
        if (i === j) continue;
        const src = state.bolts[i];
        const tgt = state.bolts[j];
        const movable = getMovableTopCount(src, tgt);
        if (movable.count === 0) continue;
        const ns = cloneState(state);
        const ssrc = ns.bolts[i];
        const stgt = ns.bolts[j];
        const moved = ssrc.nuts.splice(ssrc.nuts.length - movable.count, movable.count);
        stgt.nuts.push(...moved);
        const c = canon(ns);
        if (visited.has(c)) continue;
        if (isWin(ns)) return depth + 1;
        visited.add(c);
        queue.push({ state: ns, depth: depth + 1 });
      }
    }
  }
  return null;
}

export function computeStars(state: GameState) {
  const moveCount = (state.moveHistory || []).length;
  const optimal = typeof state.optimalMoves === 'number' ? state.optimalMoves : null;
  let moveStars = 1;
  if (optimal && optimal > 0) {
    if (moveCount <= Math.floor(0.75 * optimal)) moveStars = 2;
    else moveStars = 1;
  }
  const history = state.moveHistory || [];
  let timeSpent = 0;
  if (history.length >= 2) {
    const first = history[0].timestamp || 0;
    const last = history[history.length - 1].timestamp || 0;
    timeSpent = Math.max(0, last - first);
  }
  const availableMs = ((optimal && optimal > 0 ? optimal : moveCount) * 3) * 1000;
  const timeStar = timeSpent < availableMs ? 1 : 0;
  const totalStars = Math.min(3, moveStars + timeStar);
  return { moveCount, optimal, moveStars, timeSpentMs: timeSpent, timeAvailableMs: availableMs, timeStar, totalStars };
}

export function undoLastMove(state: GameState): { success: boolean; reason?: string } {
  const history = state.moveHistory || [];
  if (history.length === 0) return { success: false, reason: 'no-history' };
  const last = history.pop() as Move;
  const src = findBolt(state, last.fromBoltId);
  const tgt = findBolt(state, last.toBoltId);
  if (!src || !tgt) return { success: false, reason: 'bolt-not-found' };
  const topSlice = tgt.nuts.slice(tgt.nuts.length - last.count);
  if (topSlice.length !== last.count || topSlice.some((c) => nutColor(c) !== last.color)) {
    return { success: false, reason: 'mismatch-target-state' };
  }
  const moved = tgt.nuts.splice(tgt.nuts.length - last.count, last.count);
  src.nuts.push(...moved);
  return { success: true };
}

export function isWin(state: GameState): boolean {
  const seenColors = new Set<string>();
  for (const b of state.bolts) {
    if (b.nuts.length === 0) continue;
    const first = nutColor(b.nuts[0]);
    if (!b.nuts.every((n) => nutColor(n) === first)) return false;
    if (seenColors.has(first || '')) return false;
    seenColors.add(first || '');
  }
  return true;
}

export function checkStateInvariants(state: GameState): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const v = validateState(state);
  if (!v.ok) problems.push(v.reason || 'invalid-state');
  const ids = state.bolts.map((b) => b.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length > 0) problems.push('duplicate-bolt-ids');
  for (const b of state.bolts) {
    if (typeof b.capacity !== 'number' || b.capacity < 0) problems.push('invalid-bolt-capacity');
    if (!Array.isArray(b.nuts)) problems.push('invalid-bolt-nuts');
    else if (b.nuts.length > b.capacity) problems.push('bolt-over-capacity');
    else if (b.nuts.some((n) => typeof n === 'string' ? false : !isNut(n))) problems.push('invalid-nut-type');
  }
  if (state.moveHistory && !Array.isArray(state.moveHistory)) problems.push('invalid-moveHistory');
  else if (Array.isArray(state.moveHistory)) {
    for (const m of state.moveHistory) {
      if (!m || typeof m !== 'object' || !('fromBoltId' in m) || !('toBoltId' in m) || !('count' in m)) {
        problems.push('invalid-move-entry');
        break;
      }
    }
  }
  if (typeof state.extraBoltUsed !== 'boolean') problems.push('invalid-extraBoltUsed');
  if ('optimalMoves' in state && state.optimalMoves != null && typeof state.optimalMoves !== 'number') {
    problems.push('invalid-optimalMoves');
  }
  return { ok: problems.length === 0, problems };
}

export function normalizeState(state: Partial<GameState>): GameState {
  const bolts = (state.bolts || []).map((b: Partial<Bolt> | undefined, idx: number) => ({
    id: b?.id ?? `b${idx}`,
    capacity: typeof b?.capacity === 'number' ? b.capacity : 4,
    nuts: Array.isArray(b?.nuts)
      ? (b.nuts as unknown[]).map((n, i) => (typeof n === 'string' ? { id: `${b?.id ?? `b${idx}`}-n${i}`, color: n, revealed: i === ((b?.nuts as unknown[]).length - 1) } : { id: (n as { id?: unknown }).id ?? `${b?.id ?? `b${idx}`}-n${i}`, color: (n as { color?: unknown }).color ?? String(n), revealed: Boolean((n as { revealed?: unknown }).revealed) }))
      : [],
  }));
  const normalized: GameState = {
    bolts,
    extraBoltUsed: Boolean(state.extraBoltUsed),
    level: state.level ?? 1,
    difficulty: (state.difficulty as GameState['difficulty']) ?? 'easy',
    seed: (state.seed as string) ?? '',
    moveHistory: Array.isArray(state.moveHistory) ? (state.moveHistory as Move[]).slice() : [],
    optimalMoves: (state.optimalMoves as number | null | undefined) ?? null,
  } as GameState;
  if (typeof (state as unknown as { hiddenNuts?: unknown }).hiddenNuts === 'boolean') normalized.hiddenNuts = (state as unknown as { hiddenNuts: boolean }).hiddenNuts;
  return normalized;
}
