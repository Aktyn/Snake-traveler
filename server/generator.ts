import * as SimplexNoise from 'simplex-noise';

const simplex = new SimplexNoise(Math.random);

const MAX_HEIGHT_UP = 4;
const MAX_HEIGHT_DOWN = -4;

const Generator = {
  /** x and y should be integers */
  generateChunk: (_x: number, _y: number, chunkSize: number) => {
    const chunkX = _x - (_x % chunkSize);
    const chunkY = _y - (_y % chunkSize);

    const blocks = [];

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkSize; y++) {
        let noise = 0.2 + simplex.noise2D((chunkX + x) / (chunkSize * 2), (chunkY + y) / (chunkSize * 2));
        if (noise < 0.5) {
          noise = 0.5;
        }
        //const noise2 = simplex.noise2D((chunkX + x) / (chunkSize / 4), (chunkY + y) / (chunkSize / 4));
        const z = (MAX_HEIGHT_DOWN + noise * (MAX_HEIGHT_UP - MAX_HEIGHT_DOWN)) | 0;

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
      blocks
    };
  }
};

export default Generator;
