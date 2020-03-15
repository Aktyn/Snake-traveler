import * as SimplexNoise from 'simplex-noise';

const simplex = new SimplexNoise(Math.random);

const MAX_HEIGHT_UP = 4;
const MAX_HEIGHT_DOWN = -4;

const normalizeNoise = (value: number) => (value + 1.0) / 2.0;

const Generator = {
  /** x and y should be integers */
  generateChunk: (_x: number, _y: number, chunkSize: number) => {
    if (_x % chunkSize || _y % chunkSize) {
      throw new Error('Incorrect chunk coordinates');
    }

    const chunkX = _x;
    const chunkY = _y;

    const blocks = [];

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        const xx = (chunkX + x) / (chunkSize * 2);
        const yy = (chunkY + y) / (chunkSize * 2);
        let noise = normalizeNoise(simplex.noise2D(xx, yy));
        if (noise < 0.5) {
          noise = 0.5;
        }
        //const noise2 = simplex.noise2D((chunkX + x) / (chunkSize / 4), (chunkY + y) / (chunkSize / 4));
        const z = (MAX_HEIGHT_DOWN + noise * (MAX_HEIGHT_UP - MAX_HEIGHT_DOWN)) | 0;

        const biomes = 2,
          biomeScale = 0.25;
        const biome = (normalizeNoise(simplex.noise2D(xx * biomeScale, yy * biomeScale)) * biomes) | 0;

        blocks.push({
          x,
          y,
          z,
          type: z > 0 ? 0 : 1 + biome
        });
      }
    }

    return {
      x: chunkX,
      y: chunkY,
      blocks
    };
  }
};

export default Generator;
