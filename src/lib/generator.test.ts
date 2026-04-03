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

  it('reverse-play recorded moves can be reversed to solved state', () => {
    const { state } = createLevel({ difficulty: 'easy', level: 1, seed: 'reverse-test' });
    const copy: any = JSON.parse(JSON.stringify(state));
    // undo recorded moves in reverse using engine helper
    while (copy.moveHistory && copy.moveHistory.length > 0) {
      const r = undoLastMove(copy);
      expect(r.success).toBe(true);
    }
    expect(isWin(copy)).toBe(true);
  });
});
