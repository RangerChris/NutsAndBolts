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
} catch {
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
    key(index: number) {
      void index;
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
  } catch {
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
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function migrateProgress(obj: unknown): PersistedProgress {
  if (!obj || typeof obj !== 'object') return DEFAULT_PROGRESS;
  const o = obj as Record<string, unknown>;
  // If already has a version and matches our shape, accept it
  if (typeof o.version === 'number' && o.difficulties && o.settings) {
    return o as PersistedProgress;
  }

  // Migration: older schema might have 'levels' keyed by difficulty
  if (o.levels && typeof o.levels === 'object') {
    const difficulties: Record<string, { currentLevel: number; maxReached: number }> = {};
    const levels = o.levels as Record<string, unknown>;
    for (const k of Object.keys(levels)) {
      const v = levels[k] as Record<string, unknown>;
      const current = typeof v?.current === 'number' ? (v.current as number) : 1;
      const max = typeof v?.max === 'number' ? (v.max as number) : current;
      difficulties[k] = { currentLevel: current, maxReached: max };
    }
    return { version: 1, difficulties, settings: (o.settings as PersistedProgress['settings']) || DEFAULT_PROGRESS.settings };
  }

  // Fallback: try to salvage partial fields
  const difficulties = (o.difficulties as PersistedProgress['difficulties']) || DEFAULT_PROGRESS.difficulties;
  const settings = (o.settings as PersistedProgress['settings']) || DEFAULT_PROGRESS.settings;
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
  } catch {
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
