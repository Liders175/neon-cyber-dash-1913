
export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
  jumpForce: number;
  grounded: boolean;
  onBlock: boolean;
  extraJumps: number;
  hasShield: boolean;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'SPIKE' | 'BLOCK' | 'FLYING_SPIKE' | 'LASER' | 'HOLE' | 'PLATFORM' | 'COLLECTIBLE' | 'SPRING' | 'SHIELD_BONUS' | 'SNOW_PILE';
  subType?: 'CORE' | 'LIFE' | 'DOUBLE_SPIKE' | 'TALL_BLOCK' | 'TREE' | 'SNOWMAN'; 
  hasBonus?: boolean;
  bonusType?: 'LIFE' | 'SCORE';
  laserState?: 'WARNING' | 'ACTIVE';
  laserTimer?: number;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  life: number;
}

export interface GameState {
  score: number;
  highScore: number;
  status: GameStatus;
  aiCoachMessage: string;
  lives: number;
  difficulty: Difficulty;
  isMuted: boolean;
  lang: 'uk';
  level: number;
  crystalsCollected: number;
}
