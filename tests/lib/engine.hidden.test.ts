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

  it('reveals the destination top same-color chain after moving to a bolt', () => {
    const state = normalizeState({
      bolts: [
        {
          id: 'b0',
          capacity: 4,
          nuts: [{ id: 'b0-n0', color: 'c0', revealed: true }],
        },
        {
          id: 'b1',
          capacity: 4,
          nuts: [
            { id: 'b1-n0', color: 'c0', revealed: false },
            { id: 'b1-n1', color: 'c0', revealed: true },
          ],
        },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      seed: 'reveal-target-chain',
      hiddenNuts: true,
      moveHistory: [],
    });

    const res = executeMoveOnState(state, 'b0', 'b1');
    expect(res.success).toBe(true);

    const target = state.bolts.find((b) => b.id === 'b1');
    expect(target).toBeDefined();
    expect(target?.nuts.every((n) => Boolean((n as { revealed?: boolean }).revealed))).toBe(true);
  });
});
