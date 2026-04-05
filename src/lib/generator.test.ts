import { describe, it, expect } from 'vitest';
import { createLevel } from './generator';
import { undoLastMove, isWin } from './engine';

describe('level generator', () => {
  it('generates reproducible board for same seed', () => {
    const a = createLevel({ difficulty: 'easy', level: 1, seed: 'seed-123' });
    const b = createLevel({ difficulty: 'easy', level: 1, seed: 'seed-123' });
    expect(a.seed).toBe(b.seed);
    expect(JSON.stringify(a.state.bolts)).toBe(JSON.stringify(b.state.bolts));
    expect(a.state.moveHistory.length).toBe(b.state.moveHistory.length);
  });

  it('generated board has no over-capacity bolts and is not trivially solved', () => {
    // The generator uses the live shuffled state directly instead of replaying
    // filtered moves on a solved board, so nuts.length must never exceed capacity.
    const { state } = createLevel({ difficulty: 'easy', level: 1, seed: 'reverse-test' });
    for (const bolt of state.bolts) {
      expect(bolt.nuts.length).toBeLessThanOrEqual(bolt.capacity);
    }
    // At least one bolt must be mixed (level should not be trivially solved at start).
    const hasMixed = state.bolts.some(
      (b) => b.nuts.length > 1 && !b.nuts.every((n) => n === b.nuts[0])
    );
    expect(hasMixed).toBe(true);
  });
});
