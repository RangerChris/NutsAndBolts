import { describe, it, expect } from 'vitest';
import { createLevel } from './generator';

describe('level generator', () => {
  it('generates reproducible board for same seed', () => {
    const a = createLevel({ difficulty: 'easy', level: 1, seed: 'seed-123' });
    const b = createLevel({ difficulty: 'easy', level: 1, seed: 'seed-123' });
    expect(JSON.stringify(a.state.bolts)).toBe(JSON.stringify(b.state.bolts));
    expect(a.seed).toBe(b.seed);
  });

  it('reverse-play moves can be reversed to solved state', () => {
    const { state } = createLevel({ difficulty: 'easy', level: 1, seed: 'reverse-test' });
    // apply reverse of recorded moves to attempt to reach solved state
    const bolts = state.bolts.map((b) => ({ ...b, nuts: b.nuts.slice() }));
    // apply inverse moves in reverse order
    const history = (state.moveHistory || []).slice();
    for (let i = history.length - 1; i >= 0; i--) {
      const mv = history[i];
      // move from to -> from
      const from = bolts.find((x) => x.id === mv.toBoltId)!;
      const to = bolts.find((x) => x.id === mv.fromBoltId)!;
      const moved = from.nuts.splice(from.nuts.length - mv.count, mv.count);
      to.nuts.push(...moved);
    }
    // after reversing, each bolt should be uniform color equal to its id-based color
    const solved = bolts.every((b) => b.nuts.length === 0 || b.nuts.every((n) => n === b.nuts[0]));
    expect(solved).toBe(true);
  });
});
