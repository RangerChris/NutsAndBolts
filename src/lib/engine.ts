import type { Bolt, Move, GameState } from './types';
import { MAX_BOLTS } from './constants';
import { emitBalancerEvent } from './balancer';

export function pickTopGroup(bolt: Bolt): { color?: string; count: number } {
  if (!bolt.nuts || bolt.nuts.length === 0) return { color: undefined, count: 0 };
  const top = bolt.nuts[bolt.nuts.length - 1];
  const topColor = typeof top === 'string' ? top : (top as any).color;
  let count = 1;
  for (let i = bolt.nuts.length - 2; i >= 0; i--) {
    const c = typeof bolt.nuts[i] === 'string' ? (bolt.nuts[i] as any) : (bolt.nuts[i] as any).color;
    if (c === topColor) count++;
    else break;
  }
  return { color: topColor, count };
}

export function canPlaceGroup(
  source: Bolt,
  target: Bolt,
  groupCount: number
): { ok: boolean; reason?: string } {
  if (groupCount <= 0) return { ok: false, reason: 'empty-group' };
  const free = target.capacity - target.nuts.length;
  if (free <= 0) return { ok: false, reason: 'capacity' };
  if (target.nuts.length === 0) return { ok: true };
  const targetTop = typeof target.nuts[target.nuts.length - 1] === 'string' ? (target.nuts[target.nuts.length - 1] as any) : (target.nuts[target.nuts.length - 1] as any).color;
  const sourceTop = typeof source.nuts[source.nuts.length - 1] === 'string' ? (source.nuts[source.nuts.length - 1] as any) : (source.nuts[source.nuts.length - 1] as any).color;
  if (sourceTop === targetTop) return { ok: true };
  return { ok: false, reason: 'color-mismatch' };
}

export function getMovableTopCount(
  source: Bolt,
  target: Bolt
): { color?: string; count: number; reason?: string } {
  const { color, count } = pickTopGroup(source);
  if (!color || count <= 0) return { count: 0, reason: 'empty-source' };
  const can = canPlaceGroup(source, target, count);
  if (!can.ok) return { color, count: 0, reason: can.reason };
  const free = target.capacity - target.nuts.length;
  return { color, count: Math.min(count, free) };
}

export function performMove(source: Bolt, target: Bolt): Move | null {
  const movable = getMovableTopCount(source, target);
  if (!movable.color || movable.count === 0) return null;
  // remove from source
  const moved = source.nuts.splice(source.nuts.length - movable.count, movable.count) as any[];
  // append to target
  // ensure moved items are Nut objects and mark revealed
  for (let i = 0; i < moved.length; i++) {
    const m = moved[i];
    if (typeof m === 'string') {
      moved[i] = { id: `${source.id}-moved-${Date.now()}-${i}`, color: m, revealed: true } as any;
    } else {
      (m as any).revealed = true;
    }
  }
  target.nuts.push(...moved);
  const move: Move = {
    fromBoltId: source.id,
    toBoltId: target.id,
    color: movable.color,
    count: movable.count,
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
  const movable = getMovableTopCount(src, tgt);
  if (movable.count === 0) return { success: false, reason: movable.reason };
  // capture source length before move to detect if a hidden nut becomes exposed
  const srcLenBefore = src.nuts.length;
  const move = performMove(src, tgt);
  if (!move) return { success: false, reason: 'perform-failed' };
  state.moveHistory = state.moveHistory || [];
  state.moveHistory.push(move);
  // If hiddenNuts is active and the move exposed a new top nut on the source bolt,
  // mark that nut color as revealed (persisting knowledge) and emit telemetry.
  try {
    if (state.hiddenNuts && srcLenBefore - move.count > 0) {
      const revealedBolt = findBolt(state, fromId);
      let revealedNut = revealedBolt && revealedBolt.nuts.length > 0 ? revealedBolt.nuts[revealedBolt.nuts.length - 1] as any : undefined;
      const revealedColor = revealedNut ? (typeof revealedNut === 'string' ? revealedNut : revealedNut.color) : undefined;
      if (revealedNut && typeof revealedNut === 'string') {
        // migrate legacy string nut to Nut object so we can set revealed
        const idx = revealedBolt!.nuts.length - 1;
        revealedNut = { id: `${revealedBolt!.id}-n${idx}`, color: revealedNut, revealed: true } as any;
        revealedBolt!.nuts[idx] = revealedNut;
      } else if (revealedNut) {
        revealedNut.revealed = true;
      }
      emitBalancerEvent('game', {
        event: 'nutRevealed',
        level: state.level,
        difficulty: state.difficulty,
        seed: state.seed,
        boltId: fromId,
        revealedNutId: revealedNut ? revealedNut.id : undefined,
        revealedColor,
      });
    }
  } catch {
    // swallow telemetry errors
  }
  // Emit level-complete event if this move solved the level
  try {
    if (isWin(state)) {
      // compute move/time based stars
      const moveCount = state.moveHistory.length;
      const optimal = typeof state.optimalMoves === 'number' ? state.optimalMoves : null;
      // move quality stars: 2 stars if within 75% of optimal, otherwise 1
      let moveStars = 1;
      if (optimal && optimal > 0) {
        if (moveCount <= Math.floor(0.75 * optimal)) moveStars = 2;
        else moveStars = 1;
      }
      // time-based star: available time = optimalMoves * 3 seconds
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
  } catch {
    // swallow
  }
  return { success: true, move };
}

// Compute minimal moves to reach a win state using BFS up to maxDepth.
export function computeOptimalMoves(startState: GameState, maxDepth = 20): number | null {
  // canonicalize a state to string (handle string nuts or Nut objects)
  const nutColor = (n: any) => (typeof n === 'string' ? n : n?.color);
  const canon = (s: GameState) => s.bolts.map((b) => b.nuts.map((n: any) => nutColor(n) || '').join(',')).join('|');

  // shallow clone a GameState (bolts deep copied). Ensure nuts are objects.
  const cloneState = (s: GameState): GameState => ({
    bolts: s.bolts.map((b) => ({
      id: b.id,
      capacity: b.capacity,
      nuts: b.nuts.map((n: any, i: number) => (typeof n === 'string' ? { id: `${b.id}-n${i}`, color: n, revealed: false } : { ...n })),
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
    // generate moves: for each pair of bolts
    for (let i = 0; i < state.bolts.length; i++) {
      for (let j = 0; j < state.bolts.length; j++) {
        if (i === j) continue;
        const src = state.bolts[i];
        const tgt = state.bolts[j];
        const movable = getMovableTopCount(src, tgt);
        if (movable.count === 0) continue;
        // apply move on a clone
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
  // verify top of target matches expected moved color
  const topSlice = tgt.nuts.slice(tgt.nuts.length - last.count);
  const nutColor = (n: any) => (typeof n === 'string' ? n : n?.color);
  if (topSlice.length !== last.count || topSlice.some((c) => nutColor(c) !== last.color)) {
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
    const first = typeof b.nuts[0] === 'string' ? (b.nuts[0] as any) : (b.nuts[0] as any).color;
    // all nuts on the bolt must be the same color
    if (!b.nuts.every((n) => (typeof n === 'string' ? (n as any) : (n as any).color) === first)) return false;
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
    else if (b.nuts.some((n) => typeof (n as any).color !== 'string' || typeof (n as any).id !== 'string')) problems.push('invalid-nut-type');
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
  // optimalMoves if present must be number or null
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
      ? (b.nuts as any[]).map((n, i) => {
          // migrate old string-form nuts into Nut objects
          if (typeof n === 'string') return { id: `${b?.id ?? `b${idx}`}-n${i}`, color: n, revealed: i === ((b?.nuts as any[]).length - 1) };
          return { id: (n as any).id ?? `${b?.id ?? `b${idx}`}-n${i}`, color: (n as any).color ?? String(n), revealed: Boolean((n as any).revealed) };
        })
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
  // preserve optional hiddenNuts flag when present on partial state
  if (typeof (state as any).hiddenNuts === 'boolean') normalized.hiddenNuts = (state as any).hiddenNuts;
  return normalized;
}
