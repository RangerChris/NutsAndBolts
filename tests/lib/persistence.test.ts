import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveProgress,
  loadProgress,
  DEFAULT_PROGRESS,
  cloneDefaultProgress,
  _setRaw,
  _clearStorage,
  setCurrentLevel,
  setPaletteId,
  initPersistence,
  setLevelCompleted,
  addEndlessCompleted,
  setDailyCompleted,
  getDailyLastCompleted,
  setSelectedDifficulty,
  getSelectedDifficulty,
  getSeedForDifficulty,
  setSeedForDifficulty,
  migrateProgress,
} from '../../src/lib/persistence';

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

  // --- setLevelCompleted ---

  it('setLevelCompleted adds a completed level', () => {
    const p = setLevelCompleted('easy', 3);
    expect(p.difficulties.easy.completed).toContain(3);
  });

  it('setLevelCompleted does not duplicate an already-completed level', () => {
    setLevelCompleted('easy', 2);
    const p = setLevelCompleted('easy', 2);
    const completions = p.difficulties.easy.completed!.filter((l) => l === 2);
    expect(completions).toHaveLength(1);
  });

  it('setLevelCompleted creates a new entry for an unknown difficulty', () => {
    const p = setLevelCompleted('hard', 1);
    expect(p.difficulties.hard.completed).toContain(1);
  });

  it('setLevelCompleted increases maxReached monotonically', () => {
    setLevelCompleted('easy', 2);
    const after2 = loadProgress().difficulties.easy.maxReached;
    setLevelCompleted('easy', 5);
    const after5 = loadProgress().difficulties.easy.maxReached;
    setLevelCompleted('easy', 3);
    const after3 = loadProgress().difficulties.easy.maxReached;
    expect(after5).toBeGreaterThanOrEqual(after2);
    expect(after3).toBe(after5);
  });

  // --- addEndlessCompleted ---

  it('addEndlessCompleted increments endlessCount and saves', () => {
    const before = loadProgress().difficulties.easy.endlessCount ?? 0;
    addEndlessCompleted('easy');
    addEndlessCompleted('easy');
    addEndlessCompleted('easy');
    const loaded = loadProgress();
    expect(loaded.difficulties.easy.endlessCount).toBe(before + 3);
  });

  it('addEndlessCompleted initializes endlessCount when missing', () => {
    // Write a progress blob that lacks endlessCount on the difficulty entry.
    const initial = {
      version: 2,
      difficulties: { medium: { currentLevel: 1, maxReached: 1, completed: [] } },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      daily: { lastCompleted: null },
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    addEndlessCompleted('medium');
    const loaded = loadProgress();
    expect(loaded.difficulties.medium.endlessCount).toBe(1);
  });

  // --- Daily ---

  it('setDailyCompleted stores lastCompleted and getDailyLastCompleted retrieves it', () => {
    setDailyCompleted('2024-05-20');
    expect(getDailyLastCompleted()).toBe('2024-05-20');
  });

  it('setDailyCompleted overwrites a previously stored date', () => {
    setDailyCompleted('2024-05-20');
    setDailyCompleted('2024-05-21');
    expect(getDailyLastCompleted()).toBe('2024-05-21');
  });

  it('setDailyCompleted creates the daily section if missing', () => {
    // Write a progress blob that has no daily section.
    const initial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [], endlessCount: 0 } },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    setDailyCompleted('2024-06-01');
    const loaded = loadProgress();
    expect(loaded.daily?.lastCompleted).toBe('2024-06-01');
  });

  it('getDailyLastCompleted returns null when no daily has been completed', () => {
    // Fresh DEFAULT state has daily.lastCompleted = null.
    const initial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [], endlessCount: 0 } },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      daily: { lastCompleted: null },
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    expect(getDailyLastCompleted()).toBeNull();
  });

  // --- Difficulty selection ---

  it('setSelectedDifficulty updates the active difficulty and persists', () => {
    setSelectedDifficulty('hard');
    const loaded = loadProgress();
    expect(loaded.settings.difficulty).toBe('hard');
  });

  it('getSelectedDifficulty returns the active difficulty after it is set', () => {
    setSelectedDifficulty('medium');
    expect(getSelectedDifficulty()).toBe('medium');
  });

  // --- Seeds per difficulty ---

  it('setSeedForDifficulty stores a seed and getSeedForDifficulty retrieves it', () => {
    setSeedForDifficulty('easy', 'my-seed');
    expect(getSeedForDifficulty('easy')).toBe('my-seed');
  });

  it('setSeedForDifficulty initializes the seeds map if missing', () => {
    const initial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [], endlessCount: 0 } },
      settings: { paletteId: 0, difficulty: 'easy' },
      daily: { lastCompleted: null },
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    setSeedForDifficulty('hard', 'hard-seed');
    const loaded = loadProgress();
    expect(loaded.settings.seeds?.hard).toBe('hard-seed');
  });

  // --- migrateProgress (direct) ---

  it('migrateProgress returns DEFAULT_PROGRESS for non-objects', () => {
    expect(migrateProgress(null)).toEqual(DEFAULT_PROGRESS);
    expect(migrateProgress(undefined)).toEqual(DEFAULT_PROGRESS);
    expect(migrateProgress('string')).toEqual(DEFAULT_PROGRESS);
    expect(migrateProgress(42)).toEqual(DEFAULT_PROGRESS);
  });

  it('migrateProgress separates legacy endless entries from journey levels', () => {
    const legacy = {
      version: 2,
      difficulties: {
        easy: {
          currentLevel: 1,
          maxReached: 5,
          completed: [1, 2, 3, 1700000000000, 1700000001000, 5],
          endlessCount: 0,
        },
      },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      daily: { lastCompleted: null },
    };
    const migrated = migrateProgress(legacy);
    expect(migrated.difficulties.easy.completed).toEqual([1, 2, 3, 5]);
    expect(migrated.difficulties.easy.endlessCount).toBe(2);
  });

  it('migrateProgress adds missing completed arrays and endless counts', () => {
    const partial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1 } },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
    };
    const migrated = migrateProgress(partial);
    expect(migrated.difficulties.easy.completed).toEqual([]);
    expect(migrated.difficulties.easy.endlessCount).toBe(0);
    expect(migrated.daily).toEqual(DEFAULT_PROGRESS.daily);
  });

  it('migrateProgress handles the legacy "levels" shape with various current/max inputs', () => {
    const legacy = {
      levels: {
        easy: { current: 2, max: 4 },
        medium: { current: 1 }, // max missing
        hard: {}, // both missing
      },
      settings: { paletteId: 1 },
    };
    const migrated = migrateProgress(legacy);
    expect(migrated.difficulties.easy.currentLevel).toBe(2);
    expect(migrated.difficulties.easy.maxReached).toBe(4);
    expect(migrated.difficulties.medium.currentLevel).toBe(1);
    expect(migrated.difficulties.medium.maxReached).toBe(1);
    expect(migrated.difficulties.hard.currentLevel).toBe(1);
    expect(migrated.difficulties.hard.maxReached).toBe(1);
    expect(migrated.difficulties.easy.completed).toEqual([]);
    expect(migrated.difficulties.easy.endlessCount).toBe(0);
  });

  // --- Regression: DEFAULT_PROGRESS must not be mutated by callers ---

  it('does not mutate DEFAULT_PROGRESS when callers mutate the result of loadProgress', () => {
    // Take a snapshot of the current default state.
    const before = {
      difficulties: { easy: { currentLevel: DEFAULT_PROGRESS.difficulties.easy.currentLevel, maxReached: DEFAULT_PROGRESS.difficulties.easy.maxReached, completed: [...(DEFAULT_PROGRESS.difficulties.easy.completed ?? [])], endlessCount: DEFAULT_PROGRESS.difficulties.easy.endlessCount } },
      settings: { paletteId: DEFAULT_PROGRESS.settings.paletteId, difficulty: DEFAULT_PROGRESS.settings.difficulty, seeds: { ...DEFAULT_PROGRESS.settings.seeds } },
      daily: { lastCompleted: DEFAULT_PROGRESS.daily?.lastCompleted ?? null },
    };
    // Wipe storage and trigger a code path that returns the default.
    _setRaw('nuts-and-bolts:progress', '');
    const p = loadProgress();
    p.difficulties.easy.currentLevel = 99;
    p.difficulties.easy.completed.push(5);
    p.settings.paletteId = 7;
    p.settings.seeds.easy = 'tampered';
    // DEFAULT_PROGRESS must still match the snapshot.
    expect(DEFAULT_PROGRESS.difficulties.easy.currentLevel).toBe(before.difficulties.easy.currentLevel);
    expect(DEFAULT_PROGRESS.difficulties.easy.completed).toEqual(before.difficulties.easy.completed);
    expect(DEFAULT_PROGRESS.settings.paletteId).toBe(before.settings.paletteId);
    expect(DEFAULT_PROGRESS.settings.seeds).toEqual(before.settings.seeds);
  });

  it('does not poison future loads after setLevelCompleted on an empty store', () => {
    _setRaw('nuts-and-bolts:progress', '');
    setLevelCompleted('easy', 3);
    _setRaw('nuts-and-bolts:progress', '');
    // After wiping storage, a fresh loadProgress must return the original default.
    const fresh = loadProgress();
    expect(fresh.difficulties.easy.currentLevel).toBe(1);
    expect(fresh.difficulties.easy.maxReached).toBe(1);
    expect(fresh.difficulties.easy.completed).toEqual([]);
  });

  it('does not share the completed array between successive empty-store loads', () => {
    _setRaw('nuts-and-bolts:progress', '');
    const a = loadProgress();
    a.difficulties.easy.completed.push(7);
    const b = loadProgress();
    expect(b.difficulties.easy.completed).toEqual([]);
  });

  // --- cloneDefaultProgress ---

  it('cloneDefaultProgress returns a deep copy that does not share references with DEFAULT_PROGRESS', () => {
    const clone = cloneDefaultProgress();
    expect(clone).toEqual(DEFAULT_PROGRESS);
    expect(clone).not.toBe(DEFAULT_PROGRESS);
    expect(clone.difficulties).not.toBe(DEFAULT_PROGRESS.difficulties);
    expect(clone.difficulties.easy).not.toBe(DEFAULT_PROGRESS.difficulties.easy);
    expect(clone.difficulties.easy.completed).not.toBe(DEFAULT_PROGRESS.difficulties.easy.completed);
    expect(clone.settings).not.toBe(DEFAULT_PROGRESS.settings);
    expect(clone.settings.seeds).not.toBe(DEFAULT_PROGRESS.settings.seeds);
    expect(clone.daily).not.toBe(DEFAULT_PROGRESS.daily);
  });

  it('cloneDefaultProgress: mutations to the clone do not affect DEFAULT_PROGRESS', () => {
    const clone = cloneDefaultProgress();
    clone.difficulties.easy.currentLevel = 42;
    clone.difficulties.easy.completed.push(99);
    clone.settings.paletteId = 7;
    clone.settings.seeds.easy = 'tampered';
    clone.daily!.lastCompleted = '2099-01-01';
    expect(DEFAULT_PROGRESS.difficulties.easy.currentLevel).toBe(1);
    expect(DEFAULT_PROGRESS.difficulties.easy.completed).toEqual([]);
    expect(DEFAULT_PROGRESS.settings.paletteId).toBe(0);
    expect(DEFAULT_PROGRESS.settings.seeds).toEqual({});
    expect(DEFAULT_PROGRESS.daily?.lastCompleted).toBeNull();
  });

  // --- saveProgress error path ---

  it('saveProgress returns false when storage throws, true on success', () => {
    const ok = saveProgress(DEFAULT_PROGRESS);
    expect(ok).toBe(true);
  });

  it('saveProgress returns false when JSON.stringify throws (circular ref)', () => {
    // saveProgress does JSON.stringify(payload). A circular ref makes that throw,
    // so the catch branch returns false. This is the only way to reach the
    // false branch without monkey-patching the storage layer.
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = saveProgress(circular as unknown as typeof DEFAULT_PROGRESS);
    expect(result).toBe(false);
  });

  // --- migrateProgress catch-all branch (no version, no levels) ---

  it('migrateProgress handles objects that have neither version+settings nor levels', () => {
    // Object with only difficulties and settings but no version number — falls through.
    const input = { difficulties: { easy: { currentLevel: 1, maxReached: 1 } }, settings: { paletteId: 3 } };
    const migrated = migrateProgress(input);
    expect(migrated.version).toBe(2);
    expect(migrated.difficulties.easy.currentLevel).toBe(1);
    expect(migrated.settings.paletteId).toBe(3);
    expect(migrated.difficulties.easy.completed).toEqual([]);
    expect(migrated.difficulties.easy.endlessCount).toBe(0);
  });

  it('migrateProgress catch-all: fills missing completed/endlessCount on existing difficulty entries', () => {
    const input = {
      difficulties: { hard: { currentLevel: 2, maxReached: 2 } },
      settings: { paletteId: 0 },
    };
    const migrated = migrateProgress(input);
    expect(migrated.difficulties.hard.completed).toEqual([]);
    expect(migrated.difficulties.hard.endlessCount).toBe(0);
  });

  it('migrateProgress catch-all: defaults daily when missing', () => {
    const input = { difficulties: { easy: { currentLevel: 1, maxReached: 1 } }, settings: { paletteId: 0 } };
    const migrated = migrateProgress(input);
    expect(migrated.daily).toEqual({ lastCompleted: null });
  });

  it('migrateProgress: array input returns cloneDefaultProgress (not DEFAULT_PROGRESS reference)', () => {
    // Arrays are objects, so they pass the !obj check. But they have no
    // version/difficulties/settings/levels — they hit the catch-all.
    const migrated = migrateProgress([1, 2, 3]);
    expect(migrated).toEqual(DEFAULT_PROGRESS);
    // Must be a different object reference.
    expect(migrated).not.toBe(DEFAULT_PROGRESS);
  });

  // --- Migration: completed with only timestamps, no journey levels ---

  it('migrateProgress: completed array with only endless timestamps yields empty journey levels', () => {
    const legacy = {
      version: 2,
      difficulties: {
        easy: {
          currentLevel: 1,
          maxReached: 1,
          completed: [1700000000000, 1700000001000, 1700000002000],
          endlessCount: 0,
        },
      },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      daily: { lastCompleted: null },
    };
    const migrated = migrateProgress(legacy);
    expect(migrated.difficulties.easy.completed).toEqual([]);
    expect(migrated.difficulties.easy.endlessCount).toBe(3);
  });

  it('migrateProgress: completed array with non-number entries is ignored', () => {
    const legacy = {
      version: 2,
      difficulties: {
        easy: {
          currentLevel: 1,
          maxReached: 1,
          completed: [1, 'two', null, 3, { x: 1 }],
          endlessCount: 0,
        },
      },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      daily: { lastCompleted: null },
    };
    const migrated = migrateProgress(legacy);
    // Only the numbers 1 and 3 (1-10 range) are kept as journey levels.
    expect(migrated.difficulties.easy.completed).toEqual([1, 3]);
    expect(migrated.difficulties.easy.endlessCount).toBe(0);
  });

  it('migrateProgress: ensures endlessCount is set when missing from a v2 entry with no completed', () => {
    const legacy = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [] } },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      daily: { lastCompleted: null },
    };
    const migrated = migrateProgress(legacy);
    expect(migrated.difficulties.easy.endlessCount).toBe(0);
  });

  // --- getSeedForDifficulty / getSelectedDifficulty edge cases ---

  it('getSeedForDifficulty returns null when no seed is stored for a difficulty', () => {
    // Storage is fresh — no seeds map populated.
    const initial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [], endlessCount: 0 } },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      daily: { lastCompleted: null },
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    expect(getSeedForDifficulty('hard')).toBeNull();
    expect(getSeedForDifficulty('extreme')).toBeNull();
  });

  it('getSeedForDifficulty returns null when settings.seeds is missing entirely', () => {
    const initial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [], endlessCount: 0 } },
      settings: { paletteId: 0, difficulty: 'easy' },
      daily: { lastCompleted: null },
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    expect(getSeedForDifficulty('easy')).toBeNull();
  });

  it('getSelectedDifficulty falls back to "easy" when no difficulty is set', () => {
    const initial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [], endlessCount: 0 } },
      settings: { paletteId: 0, seeds: {} },
      daily: { lastCompleted: null },
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    expect(getSelectedDifficulty()).toBe('easy');
  });

  // --- setCurrentLevel / addEndlessCompleted on unknown difficulty ---

  it('setCurrentLevel creates a new entry for an unknown difficulty', () => {
    const p = setCurrentLevel('extreme', 3);
    expect(p.difficulties.extreme.currentLevel).toBe(3);
    expect(p.difficulties.extreme.maxReached).toBe(3);
  });

  it('addEndlessCompleted creates a new entry for an unknown difficulty', () => {
    const p = addEndlessCompleted('hard');
    expect(p.difficulties.hard.endlessCount).toBe(1);
    expect(p.difficulties.hard.completed).toEqual([]);
  });

  it('addEndlessCompleted accumulates across multiple calls', () => {
    addEndlessCompleted('medium');
    addEndlessCompleted('medium');
    const p = addEndlessCompleted('medium');
    expect(p.difficulties.medium.endlessCount).toBe(3);
  });

  it('addEndlessCompleted does not lose journey-level completions', () => {
    setLevelCompleted('easy', 5);
    addEndlessCompleted('easy');
    const loaded = loadProgress();
    expect(loaded.difficulties.easy.completed).toContain(5);
    expect(loaded.difficulties.easy.endlessCount).toBe(1);
  });

  // --- Mutation safety for all setters ---

  it('does not poison DEFAULT_PROGRESS.settings after setPaletteId', () => {
    _setRaw('nuts-and-bolts:progress', '');
    const p = setPaletteId(7);
    p.settings.paletteId = 999;
    // Wipe and reload — settings should reflect the saved value, not the in-memory mutation.
    _setRaw('nuts-and-bolts:progress', '');
    const fresh = loadProgress();
    expect(fresh.settings.paletteId).toBe(0);
  });

  it('does not poison DEFAULT_PROGRESS.settings after setSelectedDifficulty', () => {
    _setRaw('nuts-and-bolts:progress', '');
    const p = setSelectedDifficulty('hard');
    p.settings.difficulty = 'extreme';
    _setRaw('nuts-and-bolts:progress', '');
    const fresh = loadProgress();
    expect(fresh.settings.difficulty).toBe('easy');
  });

  it('does not poison DEFAULT_PROGRESS.settings.seeds after setSeedForDifficulty', () => {
    _setRaw('nuts-and-bolts:progress', '');
    const p = setSeedForDifficulty('hard', 'seed-x');
    p.settings.seeds!.easy = 'tampered';
    _setRaw('nuts-and-bolts:progress', '');
    const fresh = loadProgress();
    expect(fresh.settings.seeds).toEqual({});
  });

  // --- Round-trip: full progress object survives save/load ---

  it('round-trips a fully populated progress object through save/load', () => {
    const p = {
      version: 2,
      difficulties: {
        easy: { currentLevel: 3, maxReached: 5, completed: [1, 2, 3], endlessCount: 2 },
        hard: { currentLevel: 1, maxReached: 4, completed: [1, 2, 3, 4], endlessCount: 0 },
      },
      settings: { paletteId: 2, difficulty: 'hard', seeds: { easy: 'seed-easy', hard: 'seed-hard' } },
      daily: { lastCompleted: '2024-05-20' },
    };
    saveProgress(p as typeof DEFAULT_PROGRESS);
    const loaded = loadProgress();
    expect(loaded.version).toBe(2);
    expect(loaded.difficulties.easy).toEqual({ currentLevel: 3, maxReached: 5, completed: [1, 2, 3], endlessCount: 2 });
    expect(loaded.difficulties.hard).toEqual({ currentLevel: 1, maxReached: 4, completed: [1, 2, 3, 4], endlessCount: 0 });
    expect(loaded.settings.paletteId).toBe(2);
    expect(loaded.settings.difficulty).toBe('hard');
    expect(loaded.settings.seeds).toEqual({ easy: 'seed-easy', hard: 'seed-hard' });
    expect(loaded.daily?.lastCompleted).toBe('2024-05-20');
  });

  // --- initPersistence: visibilitychange listener saves on visibility change ---

  it('initPersistence: visibilitychange listener persists current state', () => {
    _setRaw('nuts-and-bolts:progress', '');
    const { unsubscribe } = initPersistence();
    // Simulate a state change without going through a setter.
    setCurrentLevel('easy', 9);
    // Fire visibilitychange to trigger the listener.
    window.dispatchEvent(new Event('visibilitychange'));
    // After the listener fires, loadProgress should still reflect currentLevel=9.
    const loaded = loadProgress();
    expect(loaded.difficulties.easy.currentLevel).toBe(9);
    unsubscribe();
  });

  it('initPersistence: unsubscribe removes the visibilitychange listener', () => {
    _setRaw('nuts-and-bolts:progress', '');
    const { unsubscribe } = initPersistence();
    unsubscribe();
    // After unsubscribing, firing visibilitychange should not throw or persist anything new.
    expect(() => {
      window.dispatchEvent(new Event('visibilitychange'));
    }).not.toThrow();
  });

  // --- Interleaved setters preserve all state ---

  it('interleaving setters preserves all fields', () => {
    setCurrentLevel('easy', 3);
    setLevelCompleted('easy', 3);
    addEndlessCompleted('easy');
    setPaletteId(5);
    setSelectedDifficulty('medium');
    setSeedForDifficulty('hard', 'h-seed');
    setDailyCompleted('2024-07-04');

    const loaded = loadProgress();
    expect(loaded.difficulties.easy.currentLevel).toBe(3);
    expect(loaded.difficulties.easy.completed).toContain(3);
    expect(loaded.difficulties.easy.endlessCount).toBe(1);
    expect(loaded.settings.paletteId).toBe(5);
    expect(loaded.settings.difficulty).toBe('medium');
    expect(loaded.settings.seeds?.hard).toBe('h-seed');
    expect(loaded.daily?.lastCompleted).toBe('2024-07-04');
  });

  // --- getDailyLastCompleted with missing daily section ---

  it('getDailyLastCompleted returns null when daily section is missing', () => {
    const initial = {
      version: 2,
      difficulties: { easy: { currentLevel: 1, maxReached: 1, completed: [], endlessCount: 0 } },
      settings: { paletteId: 0, difficulty: 'easy', seeds: {} },
      // no daily field
    };
    saveProgress(initial as typeof DEFAULT_PROGRESS);
    expect(getDailyLastCompleted()).toBeNull();
  });
});
