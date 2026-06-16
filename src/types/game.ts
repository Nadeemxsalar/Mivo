// src/types/game.ts

export type Color = 'red' | 'green' | 'yellow' | 'blue';

export interface Token {
  id: string;
  color: Color;
  position: number;   // -1 = Base, 0-50 = Main Path, 51-56 = Home Path, 57 = Won
  isFinished: boolean;
}

export interface Player {
  id: string;
  color: Color;
  tokens: Token[];
  isActive: boolean;
}

// Ludo Path Math: Har color kis global index se start hota hai
export const START_OFFSETS: Record<Color, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// Global safe zones jahan goti nahi kat sakti (Starts + Stars)
export const SAFE_POSITIONS_GLOBAL = [0, 8, 13, 21, 26, 34, 39, 47];