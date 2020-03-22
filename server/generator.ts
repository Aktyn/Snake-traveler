import * as SimplexNoise from 'simplex-noise';

const simplex = new SimplexNoise('mgdlnkczmr');

const normalizeNoise = (x: number, y: number) => (simplex.noise2D(x, y) + 1.0) / 2.0;

const Generator = {
  /** params should be integers */ //TODO: this function takes about 30ms, it can be optimized by running multiple threads
  generateChunk: (x: number, y: number, chunkSize: number, biomes: number) => {
    x = x | 0;
    y = y | 0;
    chunkSize = chunkSize | 0;

    if (x % chunkSize || y % chunkSize) {
      throw new Error('Incorrect chunk coordinates');
    }

    function getBiome(xx: number, yy: number, samples: number, scale: number) {
      let b = 0;
      for (let i = 0; i < samples; i++) {
        b += normalizeNoise((scale * xx) / 2 ** i, (scale * yy) / 2 ** i);
      }
      return (b / samples) * biomes; // | 0;
    }

    //TODO: add stringified json with other data to this buffer
    const data = new Float32Array(chunkSize * chunkSize); // Buffer.alloc(chunkSize * chunkSize);

    for (let _x = 0; _x < chunkSize; _x++) {
      for (let _y = 0; _y < chunkSize; _y++) {
        const index = _x + _y * chunkSize;

        const xx = (x + _x) / (chunkSize * 2);
        const yy = (y + _y) / (chunkSize * 2);
        const noise = normalizeNoise(xx, yy);

        data[index] = noise < 0.5 ? getBiome(xx, yy, 8, 0.1) : -getBiome(xx, yy, 8, 0.05); //negative number indicates wall
      }
    }

    return Buffer.from(data.buffer);
  }
};

export default Generator;
