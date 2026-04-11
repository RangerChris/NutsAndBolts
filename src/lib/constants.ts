import type { Difficulty } from './types';

export const STORAGE_KEY = 'nuts-and-bolts:progress';

export const MAX_BOLTS = 10;

export const DEFAULT_PALETTE_ID = 0;

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    minBolts: number;
    maxBolts: number;
    stackHeightRange: [number, number];
    shuffleRange: [number, number];
  }
> = {
  easy: { minBolts: 3, maxBolts: 4, stackHeightRange: [3, 4], shuffleRange: [5, 10] },
  medium: { minBolts: 4, maxBolts: 6, stackHeightRange: [3, 5], shuffleRange: [20, 30] },
  hard: { minBolts: 6, maxBolts: 8, stackHeightRange: [4, 6], shuffleRange: [50, 80] },
  extreme: { minBolts: 8, maxBolts: 9, stackHeightRange: [6, 10], shuffleRange: [120, 200] },
};

// improved-game feature constants
export const DAILY_DIFFICULTY: Difficulty = 'medium';
export const DAILY_SEED_VERSION = 'daily-v1';
export const TUTORIAL_SEED = 'tutorial-v1';
