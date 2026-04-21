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
  const path = computeSolutionPath(startState, { maxDepth });
  return path ? path.length : null;
}

type SolverBolt = {
  id: string;
  capacity: number;
  nuts: string[];
};

type SolverStep = {
  fromBoltId: string;
  toBoltId: string;
  color: string;
  count: number;
};

type SolverOptions = {
  maxDepth?: number;
  maxStates?: number;
};

function toSolverBolts(state: GameState): SolverBolt[] {
  return state.bolts.map((b) => ({
    id: b.id,
    capacity: b.capacity,
    nuts: b.nuts.map((n) => nutColor(n) || ''),
  }));
}

function canonSolverBolts(bolts: SolverBolt[]): string {
  return bolts.map((b) => b.nuts.join(',')).join('|');
}

function isWinSolverBolts(bolts: SolverBolt[]): boolean {
  const seenColors = new Set<string>();
  for (const b of bolts) {
    if (b.nuts.length === 0) continue;
    const first = b.nuts[0];
    if (!b.nuts.every((n) => n === first)) return false;
    if (seenColors.has(first)) return false;
    seenColors.add(first);
  }
  return true;
}

function cloneSolverBolts(bolts: SolverBolt[]): SolverBolt[] {
  return bolts.map((b) => ({ id: b.id, capacity: b.capacity, nuts: b.nuts.slice() }));
}

function getTopGroupForSolver(source: SolverBolt): { color?: string; count: number } {
  if (source.nuts.length === 0) return { color: undefined, count: 0 };
  const topColor = source.nuts[source.nuts.length - 1];
  let count = 1;
  for (let i = source.nuts.length - 2; i >= 0; i--) {
    if (source.nuts[i] === topColor) count++;
    else break;
  }
  return { color: topColor, count };
}

function getMovableCountForSolver(source: SolverBolt, target: SolverBolt): { color?: string; count: number } {
  const { color, count } = getTopGroupForSolver(source);
  if (!color || count <= 0) return { color, count: 0 };
  const free = target.capacity - target.nuts.length;
  if (free < count) return { color, count: 0 };
  if (target.nuts.length > 0 && target.nuts[target.nuts.length - 1] !== color) return { color, count: 0 };
  return { color, count };
}

export function computeSolutionPath(startState: GameState, options?: SolverOptions): SolverStep[] | null {
  const maxDepth = options?.maxDepth ?? 120;
  const maxStates = options?.maxStates ?? 250000;
  const startBolts = toSolverBolts(startState);
  const startCanon = canonSolverBolts(startBolts);
  if (isWinSolverBolts(startBolts)) return [];

  const queue: Array<{ bolts: SolverBolt[]; depth: number; canon: string }> = [
    { bolts: startBolts, depth: 0, canon: startCanon },
  ];
  const visited = new Set<string>([startCanon]);
  const parent = new Map<string, { prev: string | null; move: SolverStep | null }>();
  parent.set(startCanon, { prev: null, move: null });

  for (let qIndex = 0; qIndex < queue.length; qIndex++) {
    const { bolts, depth, canon } = queue[qIndex];
    if (depth >= maxDepth) continue;

    for (let i = 0; i < bolts.length; i++) {
      for (let j = 0; j < bolts.length; j++) {
        if (i === j) continue;
        const source = bolts[i];
        const target = bolts[j];
        const movable = getMovableCountForSolver(source, target);
        if (!movable.color || movable.count === 0) continue;

        const nextBolts = cloneSolverBolts(bolts);
        const moved = nextBolts[i].nuts.splice(nextBolts[i].nuts.length - movable.count, movable.count);
        nextBolts[j].nuts.push(...moved);
        const nextCanon = canonSolverBolts(nextBolts);
        if (visited.has(nextCanon)) continue;

        const move: SolverStep = {
          fromBoltId: source.id,
          toBoltId: target.id,
          color: movable.color,
          count: movable.count,
        };
        parent.set(nextCanon, { prev: canon, move });

        if (isWinSolverBolts(nextBolts)) {
          const path: SolverStep[] = [];
          let cur: string | null = nextCanon;
          while (cur) {
            const p = parent.get(cur);
            if (!p) break;
            if (p.move) path.unshift(p.move);
            cur = p.prev;
          }
          return path;
        }

        visited.add(nextCanon);
        if (visited.size >= maxStates) return null;
        queue.push({ bolts: nextBolts, depth: depth + 1, canon: nextCanon });
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
