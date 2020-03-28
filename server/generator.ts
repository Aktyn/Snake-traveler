import * as SimplexNoise from 'simplex-noise';

/*const alphabet = 'abcdefghijklmnopqrtuvwxyz';
const randomSeed = new Array(16)
  .fill(0)
  .map(() => alphabet[(alphabet.length * Math.random()) | 0])
  .join('');
console.log('Random seed generated:', randomSeed);*/
const simplex = new SimplexNoise('mgdlnkczmr_zyxwvutrqponmlkjihgfedcba');

const normalizeNoise = (x: number, y: number) => (simplex.noise2D(x, y) + 1.0) / 2.0;
const normalizedNoisesSum = (x: number, y: number, noises: number) => {
  let noise = 0;
  for (let i = 1; i <= noises; i++) {
    noise += simplex.noise2D(x * i, y * i) + 1.0;
  }
  return noise / 2 / noises;
};

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
      for (let i = 1; i <= samples; i++) {
        b += normalizeNoise((scale * xx) / i, (scale * yy) / i);
      }
      return Math.pow(b / samples, 2) * biomes; // | 0;
    }

    //TODO: add stringified json with other data to this buffer
    const data = new Float32Array(chunkSize * chunkSize); // Buffer.alloc(chunkSize * chunkSize);

    for (let _x = 0; _x < chunkSize; _x++) {
      for (let _y = 0; _y < chunkSize; _y++) {
        const index = _x + _y * chunkSize;

        const xx = (x + _x) / (chunkSize * 2);
        const yy = (y + _y) / (chunkSize * 2);
        const noise = normalizedNoisesSum(xx / 3, yy / 3, 3);

        data[index] = noise < 0.5 ? getBiome(xx, yy, 5, 0.1) : -getBiome(xx, yy, 4, 0.05); //negative number indicates wall
      }
    }

    return Buffer.from(data.buffer);
  }
};

export default Generator;
