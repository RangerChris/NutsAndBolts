export type ColorId = string;
export type PaletteId = number;

export type Nut = {
  id: string;
  color: ColorId;
  revealed?: boolean;
};

export type Bolt = {
  id: string;
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
  hiddenNuts?: boolean;
  moveHistory: Move[];
  optimalMoves?: number | null;
};

export type PlayMode = 'journey' | 'daily' | 'custom' | 'endless' | 'tutorial';

export type Screen =
  | { type: 'home' }
  | { type: 'difficulty-select'; mode: 'journey' | 'endless' }
  | { type: 'custom-seed-entry' }
  | { type: 'game'; mode: PlayMode; difficulty: Difficulty; seed?: string }
  | { type: 'tutorial' };
