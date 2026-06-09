import { describe, it, expect } from 'vitest';
import { xmur3, mulberry32, seededRandom, randomInt, shuffle } from '../../src/lib/rng';

describe('xmur3', () => {
  it('returns a function that produces a stable 32-bit hash sequence for the same input', () => {
    const a = xmur3('seed-1');
    const b = xmur3('seed-1');
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('produces different sequences for different inputs', () => {
    const a = xmur3('seed-a')();
    const b = xmur3('seed-b')();
    expect(a).not.toBe(b);
  });

  it('handles the empty string', () => {
    const a = xmur3('')();
    const b = xmur3('')();
    expect(a).toBe(b);
    // Output is a 32-bit unsigned integer.
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(0xffffffff);
  });

  it('handles unicode characters in the seed', () => {
    const a = xmur3('🦀-seed')();
    const b = xmur3('🦀-seed')();
    expect(a).toBe(b);
  });
});

describe('mulberry32', () => {
  it('returns a function that produces values in [0, 1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces a stable sequence for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });
});

describe('seededRandom', () => {
  it('coerces a numeric seed to a string', () => {
    const a = seededRandom(123)();
    const b = seededRandom('123')();
    expect(a).toBe(b);
  });

  it('falls back to an empty-string seed when given an empty string', () => {
    const a = seededRandom('')();
    const b = seededRandom('')();
    expect(a).toBe(b);
  });

  it('returns a function whose outputs are in [0, 1)', () => {
    const rng = seededRandom('coverage');
    for (let i = 0; i < 50; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randomInt', () => {
  it('returns integers in the inclusive [min, max] range', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const v = randomInt(rng, 3, 7);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('returns min when min === max', () => {
    expect(randomInt(mulberry32(1), 5, 5)).toBe(5);
  });

  it('handles negative ranges', () => {
    const rng = mulberry32(2);
    for (let i = 0; i < 100; i++) {
      const v = randomInt(rng, -3, -1);
      expect([-3, -2, -1]).toContain(v);
    }
  });
});

describe('shuffle', () => {
  it('returns a permutation of the same length with the same elements', () => {
    const rng = mulberry32(1);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const output = shuffle(input, rng);
    expect(output).toHaveLength(input.length);
    expect([...output].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b));
  });

  it('does not mutate the original array', () => {
    const rng = mulberry32(1);
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffle(input, rng);
    expect(input).toEqual(snapshot);
  });

  it('returns an empty array when given an empty array', () => {
    expect(shuffle<number>([], mulberry32(1))).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(shuffle([42], mulberry32(1))).toEqual([42]);
  });

  it('produces deterministic results for a seeded RNG', () => {
    const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mulberry32(99));
    const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mulberry32(99));
    expect(a).toEqual(b);
  });
});
