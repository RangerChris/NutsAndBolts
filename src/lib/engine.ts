import type { Bolt, Move, GameState } from './types';
import { MAX_BOLTS } from './constants';
import { emitBalancerEvent } from './balancer';

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
  // Emit level-complete event if this move solved the level
  try {
    if (isWin(state)) {
      emitBalancerEvent('game', {
        event: 'levelComplete',
        level: state.level,
        difficulty: state.difficulty,
        seed: state.seed,
        moveHistoryLength: state.moveHistory.length,
        bolts: state.bolts.length,
      });
    }
  } catch (e) {
    // swallow
  }
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
  // Prevent adding a second extra bolt if the state flag indicates one was used
  if (state.extraBoltUsed) return { success: false, reason: 'already-used' };
  // Also be defensive: prevent adding if a bolt id prefixed with 'extra' already exists
  if (state.bolts.some((b) => String(b.id).startsWith('extra'))) return { success: false, reason: 'already-used' };
  if (state.bolts.length >= MAX_BOLTS) return { success: false, reason: 'max-bolts' };
  const id = boltId || `extra-${Date.now()}`;
  const cap = capacity ?? (state.bolts[0]?.capacity ?? 4);
  state.bolts.push({ id, capacity: cap, nuts: [] });
  state.extraBoltUsed = true;
  return { success: true };
}

export function isWin(state: GameState): boolean {
  // Each non-empty bolt must contain only a single color, and any given
  // color may appear on exactly one bolt (not spread across multiple bolts).
  const seenColors = new Set<string>();
  for (const b of state.bolts) {
    if (b.nuts.length === 0) continue;
    const first = b.nuts[0];
    // all nuts on the bolt must be the same color
    if (!b.nuts.every((n) => n === first)) return false;
    // the color must not already appear on another bolt
    if (seenColors.has(first)) return false;
    seenColors.add(first);
  }
  return true;
}

// New: state invariant and guard helpers
export function checkStateInvariants(state: GameState): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const v = validateState(state);
  if (!v.ok) problems.push(v.reason || 'invalid-state');
  // unique bolt ids
  const ids = state.bolts.map((b) => b.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length > 0) problems.push('duplicate-bolt-ids');
  // bolt capacity and nuts types
  for (const b of state.bolts) {
    if (typeof b.capacity !== 'number' || b.capacity < 0) problems.push('invalid-bolt-capacity');
    if (!Array.isArray(b.nuts)) problems.push('invalid-bolt-nuts');
    else if (b.nuts.length > b.capacity) problems.push('bolt-over-capacity');
    else if (b.nuts.some((n) => typeof n !== 'string')) problems.push('invalid-nut-type');
  }
  // moveHistory structure
  if (state.moveHistory && !Array.isArray(state.moveHistory)) problems.push('invalid-moveHistory');
  else if (Array.isArray(state.moveHistory)) {
    for (const m of state.moveHistory) {
      if (!m || typeof m !== 'object' || !('fromBoltId' in m) || !('toBoltId' in m) || !('count' in m)) {
        problems.push('invalid-move-entry');
        break;
      }
    }
  }
  // extraBoltUsed is boolean
  if (typeof state.extraBoltUsed !== 'boolean') problems.push('invalid-extraBoltUsed');

  return { ok: problems.length === 0, problems };
}

export function normalizeState(state: Partial<GameState>): GameState {
  const bolts = (state.bolts || []).map((b: any, idx: number) => ({
    id: b?.id ?? `b${idx}`,
    capacity: typeof b?.capacity === 'number' ? b.capacity : 4,
    nuts: Array.isArray(b?.nuts) ? b.nuts.slice() : [],
  }));
  const normalized: GameState = {
    bolts,
    extraBoltUsed: Boolean(state.extraBoltUsed),
    level: state.level ?? 1,
    difficulty: (state as any).difficulty ?? 'easy',
    seed: (state as any).seed ?? '',
    moveHistory: Array.isArray(state.moveHistory) ? (state.moveHistory as any[]).slice() : [],
  } as GameState;
  return normalized;
}
