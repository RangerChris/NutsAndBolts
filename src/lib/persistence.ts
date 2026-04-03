import { STORAGE_KEY } from './constants';

// Fallback storage for non-browser envs (tests)
let storageImpl: Storage;
try {
  // detect if global localStorage is usable
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('__nb_test', '1');
      localStorage.removeItem('__nb_test');
      storageImpl = localStorage;
    } catch (e) {
      throw e;
    }
  } else {
    throw new Error('no localStorage');
  }
} catch (_) {
  const store = new Map<string, string>();
  storageImpl = {
    getItem(key: string) {
      const v = store.get(key);
      return v === undefined ? null : v;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(_index: number) {
      return null;
    },
    get length() {
      return store.size;
    },
  } as unknown as Storage;
}

// Test helpers (exported for tests)
export function _setRaw(key: string, value: string) {
  storageImpl.setItem(key, value);
}

export function _clearStorage() {
  if (typeof storageImpl.clear === 'function') storageImpl.clear();
}

export type PersistedProgress = {
  version: number;
  difficulties: Record<string, { currentLevel: number; maxReached: number }>;
  settings: { paletteId: number; difficulty?: string };
};

export const DEFAULT_PROGRESS: PersistedProgress = {
  version: 1,
  difficulties: { easy: { currentLevel: 1, maxReached: 1 } },
  settings: { paletteId: 0, difficulty: 'easy' },
};

export function saveProgress(payload: PersistedProgress) {
  try {
    storageImpl.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadProgress(): PersistedProgress {
  try {
    const raw = storageImpl.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    const migrated = migrateProgress(parsed);
    return migrated;
  } catch (e) {
    return DEFAULT_PROGRESS;
  }
}

export function migrateProgress(obj: any): PersistedProgress {
  if (!obj || typeof obj !== 'object') return DEFAULT_PROGRESS;
  // If already has a version and matches our shape, accept it
  if (typeof obj.version === 'number' && obj.difficulties && obj.settings) {
    return obj as PersistedProgress;
  }

  // Migration: older schema might have 'levels' keyed by difficulty
  if (obj.levels && typeof obj.levels === 'object') {
    const difficulties: Record<string, { currentLevel: number; maxReached: number }> = {};
    for (const k of Object.keys(obj.levels)) {
      const v = obj.levels[k];
      difficulties[k] = { currentLevel: v.current || 1, maxReached: v.max || v.current || 1 };
    }
    return { version: 1, difficulties, settings: obj.settings || DEFAULT_PROGRESS.settings };
  }

  // Fallback: try to salvage partial fields
  const difficulties = obj.difficulties || DEFAULT_PROGRESS.difficulties;
  const settings = obj.settings || DEFAULT_PROGRESS.settings;
  return { version: 1, difficulties, settings };
}

// Initialize persistence lifecycle hooks. Returns current progress and an unsubscribe function.
export function initPersistence() {
  const progress = loadProgress();
  let unsub = () => {};
  try {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const onVisibility = () => saveProgress(loadProgress());
      window.addEventListener('visibilitychange', onVisibility);
      unsub = () => window.removeEventListener('visibilitychange', onVisibility);
    }
  } catch (e) {
    // ignore in non-browser environments
  }
  return { progress, unsubscribe: unsub };
}

export function setCurrentLevel(difficulty: string, level: number) {
  const p = loadProgress();
  p.difficulties = p.difficulties || {};
  const cur = p.difficulties[difficulty] || { currentLevel: 1, maxReached: 1 };
  cur.currentLevel = level;
  cur.maxReached = Math.max(cur.maxReached || 1, level);
  p.difficulties[difficulty] = cur;
  saveProgress(p);
  return p;
}

export function setPaletteId(paletteId: number) {
  const p = loadProgress();
  p.settings = p.settings || DEFAULT_PROGRESS.settings;
  p.settings.paletteId = paletteId;
  saveProgress(p);
  return p;
}

export function getSelectedDifficulty(): string {
  const p = loadProgress();
  return (p.settings && p.settings.difficulty) || (DEFAULT_PROGRESS.settings && DEFAULT_PROGRESS.settings.difficulty) || 'easy';
}

export function setSelectedDifficulty(difficulty: string) {
  const p = loadProgress();
  p.settings = p.settings || DEFAULT_PROGRESS.settings;
  p.settings.difficulty = difficulty;
  saveProgress(p);
  return p;
}
