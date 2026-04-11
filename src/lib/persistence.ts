import { STORAGE_KEY } from './constants';

let storageImpl: Storage;
try {
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

export function _setRaw(key: string, value: string) {
  storageImpl.setItem(key, value);
}

export function _clearStorage() {
  if (typeof storageImpl.clear === 'function') storageImpl.clear();
}

export type PersistedProgress = {
  version: number;
  difficulties: Record<string, { currentLevel: number; maxReached: number }>;
  settings: { paletteId: number; difficulty?: string; seeds?: Record<string, string>; tutorialCompleted?: boolean };
  daily?: { lastCompleted?: string | null };
};

export const DEFAULT_PROGRESS: PersistedProgress = {
  version: 2,
  difficulties: { easy: { currentLevel: 1, maxReached: 1 } },
  settings: { paletteId: 0, difficulty: 'easy', seeds: {}, tutorialCompleted: false },
  daily: { lastCompleted: null },
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
  
  if (typeof o.version === 'number' && o.difficulties && o.settings) {
    const p = o as PersistedProgress;
    // ensure new fields
    p.settings = p.settings || DEFAULT_PROGRESS.settings;
    if (p.settings.tutorialCompleted === undefined) p.settings.tutorialCompleted = false;
    if (!('daily' in p)) p.daily = DEFAULT_PROGRESS.daily;
    return p as PersistedProgress;
  }

  
  if (o.levels && typeof o.levels === 'object') {
    const difficulties: Record<string, { currentLevel: number; maxReached: number }> = {};
    const levels = o.levels as Record<string, unknown>;
    for (const k of Object.keys(levels)) {
      const v = levels[k] as Record<string, unknown>;
      const current = typeof v?.current === 'number' ? (v.current as number) : 1;
      const max = typeof v?.max === 'number' ? (v.max as number) : current;
      difficulties[k] = { currentLevel: current, maxReached: max };
    }
    const settings = (o.settings as PersistedProgress['settings']) || DEFAULT_PROGRESS.settings;
    if (settings.tutorialCompleted === undefined) settings.tutorialCompleted = false;
    return { version: 2, difficulties, settings, daily: DEFAULT_PROGRESS.daily };
  }

  
  const difficulties = (o.difficulties as PersistedProgress['difficulties']) || DEFAULT_PROGRESS.difficulties;
  const settings = (o.settings as PersistedProgress['settings']) || DEFAULT_PROGRESS.settings;
  if (settings.tutorialCompleted === undefined) settings.tutorialCompleted = false;
  const daily = (o.daily as PersistedProgress['daily']) || DEFAULT_PROGRESS.daily;
  return { version: 2, difficulties, settings, daily };
}

export function setDailyCompleted(dateString: string) {
  const p = loadProgress();
  p.daily = p.daily || { lastCompleted: null };
  p.daily.lastCompleted = dateString;
  saveProgress(p);
}

export function getDailyLastCompleted(): string | null {
  const p = loadProgress();
  return p.daily?.lastCompleted || null;
}

export function setTutorialCompleted(val: boolean) {
  const p = loadProgress();
  p.settings = p.settings || DEFAULT_PROGRESS.settings;
  p.settings.tutorialCompleted = val;
  saveProgress(p);
}

export function initPersistence() {
  const progress = loadProgress();
  let unsub = () => {};
  try {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const onVisibility = () => saveProgress(loadProgress());
      window.addEventListener('visibilitychange', onVisibility);
      unsub = () => window.removeEventListener('visibilitychange', onVisibility);
    }
  } catch {}
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

export function getSeedForDifficulty(difficulty: string): string | null {
  const p = loadProgress();
  if (p.settings && p.settings.seeds && p.settings.seeds[difficulty]) return p.settings.seeds[difficulty];
  return null;
}

export function setSeedForDifficulty(difficulty: string, seed: string) {
  const p = loadProgress();
  p.settings = p.settings || DEFAULT_PROGRESS.settings;
  p.settings.seeds = p.settings.seeds || {};
  p.settings.seeds[difficulty] = seed;
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
