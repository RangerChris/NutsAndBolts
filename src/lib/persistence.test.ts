import { describe, it, expect, beforeEach } from 'vitest';
import { saveProgress, loadProgress, DEFAULT_PROGRESS, _setRaw, _clearStorage } from './persistence';

describe('persistence', () => {
  beforeEach(() => {
    _clearStorage();
  });

  it('saves and loads progress', () => {
    const p = { ...DEFAULT_PROGRESS, difficulties: { easy: { currentLevel: 2, maxReached: 2 } } };
    const ok = saveProgress(p);
    expect(ok).toBe(true);
    const loaded = loadProgress();
    expect(loaded.difficulties.easy.currentLevel).toBe(2);
  });

  it('returns default on corrupted data', () => {
    _setRaw('nuts-and-bolts:progress', '{invalid');
    const loaded = loadProgress();
    expect(loaded).toEqual(DEFAULT_PROGRESS);
  });
});
