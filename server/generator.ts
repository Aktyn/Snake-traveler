import * as SimplexNoise from 'simplex-noise';

const simplex = new SimplexNoise(Math.random);
// var SimplexNoise = require('simplex-noise'),
// simplex = new SimplexNoise(Math.random),
// value2d = simplex.noise2D(x, y);

const CHUNK_SIZE = 64;
const MAX_HEIGHT_UP = 4;
const MAX_HEIGHT_DOWN = -4;

const Generator = {
  /** x and y should be integers */
  generateChunk: (_x: number, _y: number) => {
    const chunkX = _x - (_x % CHUNK_SIZE);
    const chunkY = _y - (_y % CHUNK_SIZE);

    const blocks = [];

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        const noise = simplex.noise2D((chunkX + x) / (CHUNK_SIZE * 2), (chunkY + y) / (CHUNK_SIZE * 2));
        const noise2 = simplex.noise2D((chunkX + x) / (CHUNK_SIZE / 4), (chunkY + y) / (CHUNK_SIZE / 4));
        const z = (MAX_HEIGHT_DOWN + noise * noise2 * (MAX_HEIGHT_UP - MAX_HEIGHT_DOWN)) | 0;

        blocks.push({
          x,
          y,
          z,
          type: 0
        });
      }
    }

    return {
      x: chunkX,
      y: chunkY,
      size: CHUNK_SIZE,
      blocks
    };
  }
};

export default Generator;
