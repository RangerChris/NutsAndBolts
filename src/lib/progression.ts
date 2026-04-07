import type { Difficulty } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { loadProgress, saveProgress } from './persistence';
import { progressionConfig } from '../config/progression';

type LevelParams = {
  numBolts: number;
  stackHeight: number;
  shuffleMoves: number;
};

export function getLevelParams(difficulty: Difficulty, level: number): LevelParams {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const boltsGrowEvery = 3;
  const heightGrowEvery = 5;

  const extraBolts = Math.floor((Math.max(1, level) - 1) / boltsGrowEvery);
  const numBolts = Math.min(cfg.maxBolts, cfg.minBolts + extraBolts);

  const extraHeight = Math.floor((Math.max(1, level) - 1) / heightGrowEvery);
  const maxHeight = cfg.stackHeightRange[1];
  const stackHeight = Math.min(maxHeight, cfg.stackHeightRange[0] + extraHeight);

  const levelCap = progressionConfig.levelCap;
  const rawT = Math.min(level - 1, levelCap) / levelCap;
  const easedT = Math.pow(rawT, progressionConfig.easingExponent);
  const shuffleMin = cfg.shuffleRange[0];
  const shuffleMax = cfg.shuffleRange[1];
  const difficultyMultiplier: Record<Difficulty, number> = progressionConfig.difficultyMultiplier as Record<Difficulty, number>;
  const base = shuffleMin + easedT * (shuffleMax - shuffleMin);
  const shuffleMoves = Math.round(Math.min(shuffleMax, base * difficultyMultiplier[difficulty]));

  return { numBolts, stackHeight, shuffleMoves };
}

export function getCurrentLevel(difficulty: Difficulty): number {
  const p = loadProgress();
  return p.difficulties?.[difficulty]?.currentLevel ?? 1;
}

export function advanceLevel(difficulty: Difficulty): { currentLevel: number; maxReached: number } {
  const p = loadProgress();
  if (!p.difficulties) p.difficulties = {};
  const d = p.difficulties[difficulty] || { currentLevel: 1, maxReached: 1 };
  d.currentLevel = (d.currentLevel || 1) + 1;
  d.maxReached = Math.max(d.maxReached || 1, d.currentLevel);
  p.difficulties[difficulty] = d;
  saveProgress(p);
  return { currentLevel: d.currentLevel, maxReached: d.maxReached };
}

export function setCurrentLevel(difficulty: Difficulty, level: number) {
  const p = loadProgress();
  if (!p.difficulties) p.difficulties = {};
  const d = p.difficulties[difficulty] || { currentLevel: 1, maxReached: 1 };
  d.currentLevel = Math.max(1, level);
  d.maxReached = Math.max(d.maxReached || 1, d.currentLevel);
  p.difficulties[difficulty] = d;
  saveProgress(p);
}

export default { getLevelParams, getCurrentLevel, advanceLevel, setCurrentLevel };
