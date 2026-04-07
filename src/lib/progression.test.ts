import { describe, it, expect, beforeEach } from 'vitest';
import { getLevelParams, getCurrentLevel, advanceLevel, setCurrentLevel } from './progression';
import { _clearStorage } from './persistence';
import { DIFFICULTY_CONFIG } from './constants';

describe('progression scaling', () => {
  beforeEach(() => {
    _clearStorage();
  });

  it('returns base params for level 1', () => {
    const params = getLevelParams('easy', 1);
    expect(params.numBolts).toBe(DIFFICULTY_CONFIG.easy.minBolts);
    expect(params.stackHeight).toBe(DIFFICULTY_CONFIG.easy.stackHeightRange[0]);
    expect(params.shuffleMoves).toBeGreaterThanOrEqual(DIFFICULTY_CONFIG.easy.shuffleRange[0]);
  });

  it('increases bolts and height with level', () => {
    const p5 = getLevelParams('medium', 1);
    const p10 = getLevelParams('medium', 10);
    expect(p10.numBolts).toBeGreaterThanOrEqual(p5.numBolts);
    expect(p10.stackHeight).toBeGreaterThanOrEqual(p5.stackHeight);
    expect(p10.shuffleMoves).toBeGreaterThanOrEqual(p5.shuffleMoves);
  });

  it('advances and persists level', () => {
    const curr = getCurrentLevel('easy');
    const res = advanceLevel('easy');
    expect(res.currentLevel).toBe(curr + 1);
    setCurrentLevel('easy', 5);
    expect(getCurrentLevel('easy')).toBe(5);
  });
});
