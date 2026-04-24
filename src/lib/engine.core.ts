import type { Bolt, Move, Nut, GameState } from './types';
import { emitBalancerEvent } from './balancer';

type NutOrString = Nut | string;

const nutColor = (n?: NutOrString) => (typeof n === 'string' ? n : n?.color);

function ensureRevealedNut(bolt: Bolt, idx: number): { nut: Nut; changed: boolean } | null {
  const current = bolt.nuts[idx] as NutOrString | undefined;
  const color = nutColor(current);
  if (!color) return null;
  if (typeof current === 'string') {
    const created: Nut = { id: `${bolt.id}-n${idx}`, color, revealed: true };
    bolt.nuts[idx] = created;
    return { nut: created, changed: true };
  }
  const changed = !current.revealed;
  current.revealed = true;
  return { nut: current, changed };
}

export function revealTopColorRun(bolt: Bolt): Nut[] {
  if (!bolt.nuts || bolt.nuts.length === 0) return [];
  const topColor = nutColor(bolt.nuts[bolt.nuts.length - 1]);
  if (!topColor) return [];

  const newlyRevealed: Nut[] = [];
  let idx = bolt.nuts.length - 1;
  while (idx >= 0) {
    const color = nutColor(bolt.nuts[idx]);
    if (color !== topColor) break;
    const ensured = ensureRevealedNut(bolt, idx);
    if (ensured && ensured.changed) newlyRevealed.push(ensured.nut);
    idx--;
  }
  return newlyRevealed;
}

export function pickTopGroup(bolt: Bolt): { color?: string; count: number } {
  if (!bolt.nuts || bolt.nuts.length === 0) return { color: undefined, count: 0 };
  const top = bolt.nuts[bolt.nuts.length - 1];
  const topColor = nutColor(top);
  let count = 1;
  for (let i = bolt.nuts.length - 2; i >= 0; i--) {
    const c = nutColor(bolt.nuts[i]);
    if (c === topColor) count++;
    else break;
  }
  return { color: topColor, count };
}

export function canPlaceGroup(source: Bolt, target: Bolt, groupCount: number): { ok: boolean; reason?: string } {
  if (groupCount <= 0) return { ok: false, reason: 'empty-group' };
  const free = target.capacity - target.nuts.length;
  if (free < groupCount) return { ok: false, reason: 'capacity' };
  if (target.nuts.length === 0) return { ok: true };
  const targetTop = nutColor(target.nuts[target.nuts.length - 1]);
  const sourceTop = nutColor(source.nuts[source.nuts.length - 1]);
  if (sourceTop === targetTop) return { ok: true };
  return { ok: false, reason: 'color-mismatch' };
}

export function getMovableTopCount(source: Bolt, target: Bolt): { color?: string; count: number; reason?: string } {
  const { color, count } = pickTopGroup(source);
  if (!color || count <= 0) return { count: 0, reason: 'empty-source' };
  const can = canPlaceGroup(source, target, count);
  if (!can.ok) return { color, count: 0, reason: can.reason };
  return { color, count };
}

export function performMove(source: Bolt, target: Bolt): Move | null {
  const movable = getMovableTopCount(source, target);
  if (!movable.color || movable.count === 0) return null;
  const moved = source.nuts.splice(source.nuts.length - movable.count, movable.count) as Nut[];
  for (let i = 0; i < moved.length; i++) {
    const m = moved[i];
    if (typeof m === 'string') {
      moved[i] = { id: `${source.id}-moved-${Date.now()}-${i}`, color: m, revealed: true } as Nut;
    } else {
      moved[i].revealed = true;
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

export function markRevealedIfNeeded(state: GameState, fromId: string, beforeLen: number, moveCount: number) {
  if (!state.hiddenNuts || beforeLen - moveCount <= 0) return;
  markTopRunRevealedIfNeeded(state, fromId);
}

export function markTopRunRevealedIfNeeded(state: GameState, boltId: string) {
  if (!state.hiddenNuts) return;
  const bolt = state.bolts.find((b: Bolt) => b.id === boltId);
  if (!bolt || bolt.nuts.length === 0) return;

  const newlyRevealed = revealTopColorRun(bolt);
  for (const nut of newlyRevealed) {
    emitBalancerEvent('game', {
      event: 'nutRevealed',
      level: state.level,
      difficulty: state.difficulty,
      seed: state.seed,
      boltId,
      revealedNutId: nut.id,
      revealedColor: nut.color,
    });
  }
}
