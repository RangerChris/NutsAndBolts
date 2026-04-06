import { describe, it, expect } from 'vitest';
import { normalizeState, checkStateInvariants } from './engine';
import type { GameState, Bolt } from './types';

describe('engine invariants', () => {
  it('normalizeState fills defaults and preserves valid state', () => {
    const partial: Partial<GameState> = {
      bolts: [{ id: 'b0', capacity: 3, nuts: ['c0'] } as Partial<Bolt>],
    };
    const s = normalizeState(partial);
    expect(s.bolts.length).toBe(1);
    expect(s.extraBoltUsed).toBeDefined();
    expect(Array.isArray(s.moveHistory)).toBe(true);
  });

  it('checkStateInvariants reports problems for invalid state', () => {
    const bad = {
      bolts: [{ id: 'b0', capacity: 2, nuts: ['c', 1] }],
      extraBoltUsed: 'nope',
      moveHistory: 'not-an-array',
    };
    const res = checkStateInvariants(bad as unknown as GameState);
    expect(res.ok).toBe(false);
    expect(res.problems.length).toBeGreaterThan(0);
  });
});
