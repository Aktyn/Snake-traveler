import * as SimplexNoise from 'simplex-noise';

//const simplex = new SimplexNoise('mgdlnkczmr_zyxwvutrqponmlkjihgfedcba');

const normalizeNoise = (simplex: SimplexNoise, x: number, y: number) => (simplex.noise2D(x, y) + 1.0) / 2.0;
const normalizedNoisesSum = (simplex: SimplexNoise, x: number, y: number, noises: number) => {
  let noise = 0;
  for (let i = 1; i <= noises; i++) {
    noise += simplex.noise2D(x * i, y * i) + 1.0;
  }
  return noise / 2 / noises;
};

const Generator = {
  /** params should be integers */ //TODO: this function takes about 30ms, it can be optimized by running multiple threads
  generateChunk: (
    simplex: SimplexNoise,
    x: number,
    y: number,
    chunkSize: number,
    biomes: number,
    onlyBackground = false
  ) => {
    x = x | 0;
    y = y | 0;
    chunkSize = chunkSize | 0;

    if (x % chunkSize || y % chunkSize) {
      throw new Error('Incorrect chunk coordinates');
    }

    function getBiome(xx: number, yy: number, samples: number, scale: number) {
      let b = 0;
      for (let i = 1; i <= samples; i++) {
        b += normalizeNoise(simplex, (scale * xx) / i, (scale * yy) / i);
      }
      return Math.pow(b / samples, 2) * biomes; // | 0;
    }

    const foregroundOffset = chunkSize * chunkSize;
    let data: Float32Array;

    if (onlyBackground) {
      data = new Float32Array(chunkSize * chunkSize);

      for (let _x = 0; _x < chunkSize; _x++) {
        for (let _y = 0; _y < chunkSize; _y++) {
          const index = _x + _y * chunkSize;
          const xx = (x + _x) / (chunkSize * 2);
          const yy = (y + _y) / (chunkSize * 2);

          data[index] = getBiome(xx, yy, 3, 0.1); //only background
        }
      }
    } else {
      data = new Float32Array(chunkSize * chunkSize * 2);

      for (let _x = 0; _x < chunkSize; _x++) {
        for (let _y = 0; _y < chunkSize; _y++) {
          const index = _x + _y * chunkSize;

          const xx = (x + _x) / (chunkSize * 2);
          const yy = (y + _y) / (chunkSize * 2);
          const noise = normalizedNoisesSum(simplex, xx / 3, yy / 3, 3);

          data[index] = getBiome(xx, yy, 3, 0.1); //background
          const f = getBiome(xx, yy, 4, 0.07);
          data[index + foregroundOffset] = noise < 0.5 ? f : -f;
        }
      }
    }

    return Buffer.from(data.buffer);
  }
};

export default Generator;
