
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED',
}

export enum ObstacleType {
  TRUCK = 'TRUCK',
  CACTUS = 'CACTUS',
  JAYWALKER = 'JAYWALKER',
}

export interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number; // -1 (left) to 1 (right)
  z: number; // distance from camera
  width: number;
  height: number;
  damage: number;
  hit: boolean;
}

export interface Player {
  x: number; // -1 to 1
  lane: number; // 0, 1, 2
  speed: number;
  maxSpeed: number;
  energy: number;
}

export interface ScoreRecord {
  date: string;
  distance: number; // meters
}
