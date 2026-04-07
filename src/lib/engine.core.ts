import type { Bolt, Move, Nut, GameState } from './types';
import { emitBalancerEvent } from './balancer';

type NutOrString = Nut | string;

const nutColor = (n?: NutOrString) => (typeof n === 'string' ? n : n?.color);

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
  if (free <= 0) return { ok: false, reason: 'capacity' };
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
  const free = target.capacity - target.nuts.length;
  return { color, count: Math.min(count, free) };
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
  const revealedBolt = state.bolts.find((b: Bolt) => b.id === fromId);
  let revealedNut =
    revealedBolt && revealedBolt.nuts.length > 0 ? revealedBolt.nuts[revealedBolt.nuts.length - 1] : undefined;
  const revealedColor = revealedNut ? nutColor(revealedNut) : undefined;
  if (revealedNut && typeof revealedNut === 'string') {
    const idx = revealedBolt!.nuts.length - 1;
    revealedNut = { id: `${revealedBolt!.id}-n${idx}`, color: revealedNut, revealed: true } as Nut;
    revealedBolt!.nuts[idx] = revealedNut;
  } else if (revealedNut && typeof revealedNut !== 'string') {
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
