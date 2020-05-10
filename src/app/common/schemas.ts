export interface WorldSchema {
  id: string;
  name: string;
  seed: string;
  data: {
    playerX: number;
    playerY: number;
    playerRot: number;
    playerHealth: number[];
    score: number;
  };
}
