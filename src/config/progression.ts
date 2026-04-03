export const progressionConfig = {
  // easing exponent applied to level progression (0.0-1.0 faster growth, >1 slower)
  easingExponent: 0.7,
  // difficulty multipliers to scale shuffle growth
  difficultyMultiplier: {
    easy: 1.0,
    medium: 1.0,
    hard: 0.95,
    extreme: 0.85,
  },
  // cap for level influence when computing t
  levelCap: 50,
};

export default progressionConfig;
