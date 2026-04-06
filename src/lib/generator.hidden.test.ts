import { describe, it, expect } from 'vitest';
import { createLevel } from './generator';

describe('createLevel hiddenNuts flag', () => {
  it('is reproducible for same seed', () => {
    const a = createLevel({ difficulty: 'easy', level: 1, seed: 'hidden-seed-1' });
    const b = createLevel({ difficulty: 'easy', level: 1, seed: 'hidden-seed-1' });
    expect(a.seed).toBe(b.seed);
    expect(a.state.hiddenNuts).toBe(b.state.hiddenNuts);
  });

  it('respects forced true/false', () => {
    const forcedOn = createLevel({ difficulty: 'easy', level: 1, seed: 's1', hiddenNuts: true });
    const forcedOff = createLevel({ difficulty: 'easy', level: 1, seed: 's1', hiddenNuts: false });
    expect(forcedOn.state.hiddenNuts).toBe(true);
    expect(forcedOff.state.hiddenNuts).toBe(false);
  });
});
