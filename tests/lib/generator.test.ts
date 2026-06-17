import { describe, it, expect } from 'vitest';
import { createLevel } from '../../src/lib/generator';
import { computeSolutionPath, isWin } from '../../src/lib/engine';
import { getLevelParams } from '../../src/lib/progression';
import type { Bolt, GameState, Move, Nut } from '../../src/lib/types';

const nutColor = (n: unknown) => (typeof n === 'string' ? n : (n as { color?: string } | undefined)?.color);

// Apply a count-respecting move to a deep-cloned bolt set; throws if the move is illegal.
function replayMove(bolts: Bolt[], m: Move): void {
  const src = bolts.find((b) => b.id === m.fromBoltId);
  const tgt = bolts.find((b) => b.id === m.toBoltId);
  expect(src).toBeDefined();
  expect(tgt).toBeDefined();
  const top = src!.nuts[src!.nuts.length - 1];
  expect(nutColor(top)).toBe(m.color);
  expect(tgt!.capacity - tgt!.nuts.length).toBeGreaterThanOrEqual(m.count);
  if (tgt!.nuts.length > 0) expect(nutColor(tgt!.nuts[tgt!.nuts.length - 1])).toBe(m.color);
  const moved = src!.nuts.splice(src!.nuts.length - m.count, m.count);
  tgt!.nuts.push(...moved);
}

function cloneBolts(state: GameState): Bolt[] {
  return state.bolts.map((b) => ({ ...b, nuts: b.nuts.map((n) => ({ ...n }) as Nut) }));
}

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

  it('preserves every nut across all difficulties (no nuts stranded on a dropped scratch bolt)', () => {
    const diffs = ['easy', 'medium', 'hard', 'extreme'] as const;
    for (const difficulty of diffs) {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const { state } = createLevel({ difficulty, level: lvl, seed: `preserve-${difficulty}-${lvl}` });
        const { numBolts, stackHeight } = getLevelParams(difficulty, lvl);
        const total = state.bolts.reduce((acc, b) => acc + b.nuts.length, 0);
        expect(total).toBe(numBolts * stackHeight);
      }
    }
  });

  it('every generated level has a positive optimalMoves (never null) for all difficulties', () => {
    const diffs = ['easy', 'medium', 'hard', 'extreme'] as const;
    for (const difficulty of diffs) {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const { state } = createLevel({ difficulty, level: lvl, seed: `opt-${difficulty}-${lvl}` });
        expect(state.optimalMoves).not.toBeNull();
        expect(typeof state.optimalMoves).toBe('number');
        expect((state.optimalMoves as number) > 0).toBe(true);
      }
    }
  }, 30000);

  it('the returned solution replays legally from the start board to a win', () => {
    const diffs = ['easy', 'medium', 'hard'] as const;
    for (const difficulty of diffs) {
      for (let lvl = 1; lvl <= 4; lvl++) {
        const { state, solution } = createLevel({ difficulty, level: lvl, seed: `replay-${difficulty}-${lvl}` });
        expect(Array.isArray(solution)).toBe(true);
        expect(solution!.length).toBeGreaterThan(0);
        const bolts = cloneBolts(state);
        for (const m of solution!) replayMove(bolts, m);
        expect(isWin({ ...state, bolts })).toBe(true);
      }
    }
  }, 30000);
});
