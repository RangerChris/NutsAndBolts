import { describe, it, expect } from 'vitest';
import { computeOptimalMoves, computeStars } from './engine';
import type { GameState } from './types';

describe('stars and optimal moves', () => {
  it('computeOptimalMoves returns 0 for already solved', () => {
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 2, nuts: ['red', 'red'] },
        { id: 'b', capacity: 2, nuts: ['blue', 'blue'] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
      optimalMoves: null,
    };
    expect(computeOptimalMoves(state, 6)).toBe(0);
  });

  it('computeStars awards 3 stars for optimal & fast', () => {
    const now = 1_000_000;
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 3, nuts: ['red', 'red', 'red'] },
        { id: 'b', capacity: 3, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      seed: 's',
      moveHistory: [
        { fromBoltId: 'x', toBoltId: 'y', color: 'red', count: 1, timestamp: now },
        { fromBoltId: 'x', toBoltId: 'y', color: 'red', count: 1, timestamp: now + 1000 },
        { fromBoltId: 'x', toBoltId: 'y', color: 'red', count: 1, timestamp: now + 2000 },
      ],
      optimalMoves: 4,
    };
    const res = computeStars(state);
    expect(res.moveCount).toBe(3);
    expect(res.optimal).toBe(4);
    expect(res.moveStars).toBe(2);
    expect(res.timeStar).toBe(1);
    expect(res.totalStars).toBe(3);
  });

  it('computeStars gives 1 star if slow or not optimal', () => {
    const now = 2_000_000;
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 3, nuts: ['red', 'red', 'red'] },
        { id: 'b', capacity: 3, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      seed: 's',
      moveHistory: [
        { fromBoltId: 'x', toBoltId: 'y', color: 'red', count: 1, timestamp: now },
        { fromBoltId: 'x', toBoltId: 'y', color: 'red', count: 1, timestamp: now + 50_000 },
      ],
      optimalMoves: 2,
    };
    const res = computeStars(state);
    expect(res.moveCount).toBe(2);
    expect(res.moveStars).toBe(1);
    expect(res.timeStar).toBe(0);
    expect(res.totalStars).toBe(1);
  });
});
