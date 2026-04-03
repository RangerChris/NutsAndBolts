import type { Bolt, Move, GameState } from './types';
import { MAX_BOLTS } from './constants';

export function pickTopGroup(bolt: Bolt): { color?: string; count: number } {
  if (!bolt.nuts || bolt.nuts.length === 0) return { color: undefined, count: 0 };
  const top = bolt.nuts[bolt.nuts.length - 1];
  let count = 1;
  for (let i = bolt.nuts.length - 2; i >= 0; i--) {
    if (bolt.nuts[i] === top) count++;
    else break;
  }
  return { color: top, count };
}

export function canPlaceGroup(
  source: Bolt,
  target: Bolt,
  groupCount: number
): { ok: boolean; reason?: string } {
  if (groupCount <= 0) return { ok: false, reason: 'empty-group' };
  const free = target.capacity - target.nuts.length;
  if (free < groupCount) return { ok: false, reason: 'capacity' };
  if (target.nuts.length === 0) return { ok: true };
  const targetTop = target.nuts[target.nuts.length - 1];
  const sourceTop = source.nuts[source.nuts.length - 1];
  if (sourceTop === targetTop) return { ok: true };
  return { ok: false, reason: 'color-mismatch' };
}

export function performMove(source: Bolt, target: Bolt): Move | null {
  const { color, count } = pickTopGroup(source);
  if (!color || count === 0) return null;
  const can = canPlaceGroup(source, target, count);
  if (!can.ok) return null;
  // remove from source
  const moved = source.nuts.splice(source.nuts.length - count, count);
  // append to target
  target.nuts.push(...moved);
  const move: Move = {
    fromBoltId: source.id,
    toBoltId: target.id,
    color,
    count,
    timestamp: Date.now(),
  };
  return move;
}

// Higher-level state helpers
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
  const { color, count } = pickTopGroup(src);
  if (!color || count === 0) return { success: false, reason: 'empty-source' };
  const can = canPlaceGroup(src, tgt, count);
  if (!can.ok) return { success: false, reason: can.reason };
  const move = performMove(src, tgt);
  if (!move) return { success: false, reason: 'perform-failed' };
  state.moveHistory = state.moveHistory || [];
  state.moveHistory.push(move);
  return { success: true, move };
}

export function undoLastMove(state: GameState): { success: boolean; reason?: string } {
  const history = state.moveHistory || [];
  if (history.length === 0) return { success: false, reason: 'no-history' };
  const last = history.pop() as Move;
  const src = findBolt(state, last.fromBoltId);
  const tgt = findBolt(state, last.toBoltId);
  if (!src || !tgt) return { success: false, reason: 'bolt-not-found' };
  // verify top of target matches expected moved color
  const topSlice = tgt.nuts.slice(tgt.nuts.length - last.count);
  if (topSlice.length !== last.count || topSlice.some((c) => c !== last.color)) {
    return { success: false, reason: 'mismatch-target-state' };
  }
  const moved = tgt.nuts.splice(tgt.nuts.length - last.count, last.count);
  src.nuts.push(...moved);
  return { success: true };
}

export function addExtraBolt(state: GameState, boltId?: string, capacity?: number): { success: boolean; reason?: string } {
  if (state.extraBoltUsed) return { success: false, reason: 'already-used' };
  if (state.bolts.length >= MAX_BOLTS) return { success: false, reason: 'max-bolts' };
  const id = boltId || `extra-${Date.now()}`;
  const cap = capacity ?? (state.bolts[0]?.capacity ?? 4);
  state.bolts.push({ id, capacity: cap, nuts: [] });
  state.extraBoltUsed = true;
  return { success: true };
}

export function isWin(state: GameState): boolean {
  for (const b of state.bolts) {
    if (b.nuts.length === 0) continue;
    const first = b.nuts[0];
    if (!b.nuts.every((n) => n === first)) return false;
  }
  return true;
}
