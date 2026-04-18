import { describe, it, expect } from 'vitest';
import { normalizeState, executeMoveOnState } from '../../src/lib/engine';
import { onBalancerEvent } from '../../src/lib/balancer';

describe('engine hidden-nut reveal telemetry', () => {
  it('emits nutRevealed when hiddenNuts enabled and an underlying nut is exposed', () => {
    const state = normalizeState({
      bolts: [
        { id: 'b0', capacity: 4, nuts: ['c0', 'c1'] },
        { id: 'b1', capacity: 4, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      seed: 'reveal-test',
      hiddenNuts: true,
      moveHistory: [],
    });

    const events: unknown[] = [];
    const off = onBalancerEvent((ev) => events.push(ev));

    const res = executeMoveOnState(state, 'b0', 'b1');
    expect(res.success).toBe(true);

    off();

    const found = events.some((e) => (e as { payload?: { event?: string } }).payload?.event === 'nutRevealed');
    expect(found).toBe(true);
  });
});
