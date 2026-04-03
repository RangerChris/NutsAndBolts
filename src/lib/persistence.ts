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
  settings: { paletteId: number };
};

export const DEFAULT_PROGRESS: PersistedProgress = {
  version: 1,
  difficulties: { easy: { currentLevel: 1, maxReached: 1 } },
  settings: { paletteId: 0 },
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
    const parsed = JSON.parse(raw) as PersistedProgress;
    if (!parsed.version) return DEFAULT_PROGRESS;
    return parsed;
  } catch (e) {
    return DEFAULT_PROGRESS;
  }
}
