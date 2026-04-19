
import { Difficulty } from './types';

export const GRAVITY = 0.6;
export const JUMP_FORCE = -13.5;
export const DOUBLE_JUMP_FORCE = -12.5;
export const SPRING_FORCE = -21.0;
export const LEVEL_UP_THRESHOLD = 10000;

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: { speed: 5, spawnChance: 0.015, gravityMult: 0.9 },
  [Difficulty.NORMAL]: { speed: 7, spawnChance: 0.025, gravityMult: 1.0 },
  [Difficulty.HARD]: { speed: 9, spawnChance: 0.04, gravityMult: 1.15 },
};

export const LEVEL_THEMES = [
  {
    bg: '#020617',
    player: '#22d3ee',
    obstacle: '#f43f5e',
    secondary: '#a855f7',
    ground: '#0a0f1e',
    accent: '#22d3ee'
  },
  {
    bg: '#051505',
    player: '#4ade80',
    obstacle: '#fb923c',
    secondary: '#16a34a',
    ground: '#081a08',
    accent: '#4ade80'
  },
  {
    bg: '#1a0505',
    player: '#fca5a5',
    obstacle: '#ffffff',
    secondary: '#b91c1c',
    ground: '#2a0808',
    accent: '#ef4444'
  },
  {
    bg: '#111111',
    player: '#fcd34d',
    obstacle: '#6366f1',
    secondary: '#b45309',
    ground: '#1a1a1a',
    accent: '#fbbf24'
  }
];

export const COLORS = {
  PLAYER: '#22d3ee',
  SPIKE: '#f43f5e',
  BLOCK: '#a855f7',
  BG: '#020617',
  LIFE: '#10b981',
  SCORE: '#f59e0b',
  STAR: '#334155',
  LASER: '#ff0000',
  CRYSTAL: '#22d3ee',
  HEART: '#f43f5e',
  SPRING: '#fbbf24',
  SHIELD: '#00ffff',
  SNOW: '#ffffff',
  TREE: '#15803d',
  SNOWMAN: '#f8fafc'
};

export const TRANSLATIONS = {
  uk: {
    title: "НЕОНОВИЙ РИВОК",
    play: "ГРАТИ",
    difficulty: "СКЛАДНІСТЬ",
    easy: "ЛЕГКО",
    normal: "НОРМА",
    hard: "ВАЖКО",
    gameOver: "ГРУ ЗАКІНЧЕНО",
    lives: "ЖИТТЯ",
    retry: "СПРОБУВАТИ ЩЕ",
    menu: "МЕНЮ",
    coach: "ПОРАДА ШІ",
    score: "РАХУНОК",
    level: "РІВЕНЬ",
    levelUp: "НОВИЙ РІВЕНЬ!"
  }
};
