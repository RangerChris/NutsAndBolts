import { describe, it, expect } from 'vitest';
import { normalizeState, executeMoveOnState } from './engine';
import { onBalancerEvent } from './balancer';

describe('engine hidden-nut reveal telemetry', () => {
  it('emits nutRevealed when hiddenNuts enabled and an underlying nut is exposed', () => {
    const state = normalizeState({
      bolts: [
        { id: 'b0', capacity: 4, nuts: ['c0', 'c1'] }, // two nuts: top=c1
        { id: 'b1', capacity: 4, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      seed: 'reveal-test',
      hiddenNuts: true,
      moveHistory: [],
    });

    const events: any[] = [];
    const off = onBalancerEvent((ev) => events.push(ev));

    // Move the top group (count=1) from b0 to b1 — this should expose c0 on b0
    const res = executeMoveOnState(state, 'b0', 'b1');
    expect(res.success).toBe(true);

    off();

    const found = events.some((e) => (e.payload as any).event === 'nutRevealed');
    expect(found).toBe(true);
  });
});
