export type ColorId = string;
export type PaletteId = number;

export type Nut = {
  id: string;
  color: ColorId;
  // When true this specific nut instance is revealed and should be drawn in full color
  revealed?: boolean;
};

export type Bolt = {
  id: string;
  // nuts array with top at the end (push/pop for top operations)
  nuts: Nut[];
  capacity: number;
};

export type Move = {
  fromBoltId: string;
  toBoltId: string;
  color: ColorId;
  count: number;
  timestamp?: number;
};

export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export type GameState = {
  bolts: Bolt[];
  extraBoltUsed: boolean;
  level: number;
  difficulty: Difficulty;
  seed?: string;
  // When true, only the top nut of each bolt is shown; underlying nuts are hidden
  // until they become the top nut. This is a per-level modifier decided at
  // generation time and persisted with the level seed.
  hiddenNuts?: boolean;
  // NOTE: per-nut reveal state is stored on each `Nut.revealed`.
  moveHistory: Move[];
  // Precalculated optimal move count for this level, if available
  optimalMoves?: number | null;
};
