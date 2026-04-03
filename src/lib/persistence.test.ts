import { describe, it, expect, beforeEach } from 'vitest';
import { saveProgress, loadProgress, DEFAULT_PROGRESS, _setRaw, _clearStorage, migrateProgress, setCurrentLevel, setPaletteId, initPersistence } from './persistence';

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

  it('migrates old schema with levels', () => {
    const old = { levels: { easy: { current: 3, max: 3 } }, settings: { paletteId: 2 } };
    _setRaw('nuts-and-bolts:progress', JSON.stringify(old));
    const loaded = loadProgress();
    expect(loaded.difficulties.easy.currentLevel).toBe(3);
    expect(loaded.settings.paletteId).toBe(2);
  });

  it('setCurrentLevel updates and saves', () => {
    _clearStorage();
    const p = setCurrentLevel('easy', 4);
    expect(p.difficulties.easy.currentLevel).toBe(4);
    const loaded = loadProgress();
    expect(loaded.difficulties.easy.currentLevel).toBe(4);
  });

  it('setPaletteId updates settings', () => {
    _clearStorage();
    const p = setPaletteId(3);
    expect(p.settings.paletteId).toBe(3);
    const loaded = loadProgress();
    expect(loaded.settings.paletteId).toBe(3);
  });

  it('initPersistence returns progress and unsubscribe', () => {
    _clearStorage();
    const { progress, unsubscribe } = initPersistence();
    expect(progress).toBeDefined();
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
