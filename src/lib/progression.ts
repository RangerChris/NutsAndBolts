import type { Difficulty } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { loadProgress, saveProgress } from './persistence';
import { progressionConfig } from '../config/progression';

type LevelParams = {
  numBolts: number;
  stackHeight: number;
  shuffleMoves: number;
};

function mutateDifficulty(
  difficulty: Difficulty,
  mutate: (s: { currentLevel: number; maxReached: number }) => void,
) {
  const p = loadProgress();
  if (!p.difficulties) p.difficulties = {};
  const d = p.difficulties[difficulty] || { currentLevel: 1, maxReached: 1 };
  mutate(d);
  d.maxReached = Math.max(d.maxReached || 1, d.currentLevel);
  p.difficulties[difficulty] = d;
  saveProgress(p);
  return { currentLevel: d.currentLevel, maxReached: d.maxReached };
}

export function getLevelParams(difficulty: Difficulty, level: number): LevelParams {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const clamped = Math.max(1, level) - 1;
  const boltsGrowEvery = 3;
  const heightGrowEvery = 5;

  const numBolts = Math.min(cfg.maxBolts, cfg.minBolts + Math.floor(clamped / boltsGrowEvery));
  const [minHeight, maxHeight] = cfg.stackHeightRange;
  const stackHeight = Math.min(maxHeight, minHeight + Math.floor(clamped / heightGrowEvery));

  const { levelCap, easingExponent, difficultyMultiplier } = progressionConfig;
  const easedT = Math.pow(Math.min(clamped, levelCap) / levelCap, easingExponent);
  const [shuffleMin, shuffleMax] = cfg.shuffleRange;
  const base = shuffleMin + easedT * (shuffleMax - shuffleMin);
  const shuffleMoves = Math.round(Math.min(shuffleMax, base * difficultyMultiplier[difficulty]));

  return { numBolts, stackHeight, shuffleMoves };
}

export function getCurrentLevel(difficulty: Difficulty): number {
  return loadProgress().difficulties?.[difficulty]?.currentLevel ?? 1;
}

export function advanceLevel(difficulty: Difficulty) {
  return mutateDifficulty(difficulty, (d) => {
    d.currentLevel = (d.currentLevel || 1) + 1;
  });
}

export function setCurrentLevel(difficulty: Difficulty, level: number) {
  mutateDifficulty(difficulty, (d) => {
    d.currentLevel = Math.max(1, level);
  });
}

export default { getLevelParams, getCurrentLevel, advanceLevel, setCurrentLevel };
