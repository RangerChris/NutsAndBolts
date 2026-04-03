export type ColorId = string;
export type PaletteId = number;

export type Bolt = {
  id: string;
  // nuts array with top at the end (push/pop for top operations)
  nuts: ColorId[];
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
  moveHistory: Move[];
};
