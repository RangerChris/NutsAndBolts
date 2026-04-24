import { describe, it, expect } from 'vitest';
import { createLevel } from '../../src/lib/generator';
import { computeSolutionPath } from '../../src/lib/engine';

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

    const nutColor = (n: unknown) => (typeof n === 'string' ? n : (n as { color?: string } | undefined)?.color);
    const hasMixed = state.bolts.some(
      (b) => b.nuts.length > 1 && !b.nuts.every((n) => nutColor(n) === nutColor(b.nuts[0]))
    );
    expect(hasMixed).toBe(true);

    const path = computeSolutionPath(state, { maxDepth: 140, maxStates: 250000 });
    expect(path).not.toBeNull();
    expect(typeof state.optimalMoves === 'number' || state.optimalMoves === null).toBe(true);
  });

  it('never generates a singleton color on hard or extreme', () => {
    const difficulties = ['hard', 'extreme'] as const;
    for (const difficulty of difficulties) {
      for (let i = 0; i < 8; i++) {
        const { state } = createLevel({ difficulty, level: (i % 4) + 1, seed: `${difficulty}-singleton-${i}` });
        const counts = new Map<string, number>();
        for (const bolt of state.bolts) {
          for (const nut of bolt.nuts) {
            counts.set(nut.color, (counts.get(nut.color) ?? 0) + 1);
          }
        }
        const hasSingleton = Array.from(counts.values()).some((n) => n === 1);
        expect(hasSingleton).toBe(false);
      }
    }
  }, 15000);

  it('can skip solvability check for restart flows', () => {
    const { state } = createLevel({
      difficulty: 'easy',
      level: 1,
      seed: 'restart-skip-check',
      skipSolvabilityCheck: true,
    });

    expect(state.optimalMoves).toBeNull();
    for (const bolt of state.bolts) {
      expect(bolt.nuts.length).toBeLessThanOrEqual(bolt.capacity);
    }
  });
});
