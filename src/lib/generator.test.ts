import { describe, it, expect } from 'vitest';
import { createLevel } from './generator';

describe('level generator', () => {
  it('generates reproducible board for same seed', () => {
    const a = createLevel({ difficulty: 'easy', level: 1, seed: 'seed-123' });
    const b = createLevel({ difficulty: 'easy', level: 1, seed: 'seed-123' });
    expect(a.seed).toBe(b.seed);
    expect(JSON.stringify(a.state.bolts)).toBe(JSON.stringify(b.state.bolts));
    expect(a.state.moveHistory.length).toBe(b.state.moveHistory.length);
  });

  it('generated board has no over-capacity bolts and is not trivially solved', () => {
    const { state } = createLevel({ difficulty: 'easy', level: 1, seed: 'reverse-test' });
    for (const bolt of state.bolts) {
      expect(bolt.nuts.length).toBeLessThanOrEqual(bolt.capacity);
    }
    
    const hasMixed = state.bolts.some(
      (b) => b.nuts.length > 1 && !b.nuts.every((n) => n === b.nuts[0])
    );
    expect(hasMixed).toBe(true);
    expect(typeof state.optimalMoves === 'number' || state.optimalMoves === null).toBe(true);
  });
});
