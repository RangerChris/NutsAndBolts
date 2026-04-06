import { describe, it, expect } from 'vitest';
import { onBalancerEvent } from './balancer';
import { executeMoveOnState } from './engine';
import type { GameState } from './types';

describe('level completion event', () => {
  it('emits levelComplete when move solves the level', () => {
    const state: GameState = {
      bolts: [
        { id: 'b0', capacity: 4, nuts: ['x', 'x'] },
        { id: 'b1', capacity: 4, nuts: ['x'] },
        { id: 'b2', capacity: 4, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 2,
      difficulty: 'easy',
      seed: 'win-seed',
      moveHistory: [],
      optimalMoves: null,
    };

    let seen: unknown = null;
    const unsub = onBalancerEvent((ev) => {
      if (ev.payload && ev.payload.event === 'levelComplete') seen = ev.payload;
    });

    const res = executeMoveOnState(state, 'b1', 'b0');
    expect(res.success).toBe(true);
    expect(seen).not.toBeNull();
    expect((seen as { event?: string }).event).toBe('levelComplete');
    expect((seen as { level?: number }).level).toBe(2);
    expect((seen as { seed?: string }).seed).toBe('win-seed');

    unsub();
  });
});
