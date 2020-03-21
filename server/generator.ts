import * as SimplexNoise from 'simplex-noise';

const simplex = new SimplexNoise('mgdlnkczmr');

const normalizeNoise = (x: number, y: number) => (simplex.noise2D(x, y) + 1.0) / 2.0;

const Generator = {
  /** params should be integers */ //TODO: dynamic number of biomes
  generateChunk: (x: number, y: number, chunkSize: number) => {
    x = x | 0;
    y = y | 0;
    chunkSize = chunkSize | 0;

    if (x % chunkSize || y % chunkSize) {
      throw new Error('Incorrect chunk coordinates');
    }

    //TODO: add stringified json with other data to this buffer
    const data = Buffer.alloc(chunkSize * chunkSize);

    for (let _x = 0; _x < chunkSize; _x++) {
      for (let _y = 0; _y < chunkSize; _y++) {
        const index = _x + _y * chunkSize;

        const xx = (x + _x) / (chunkSize * 2);
        const yy = (y + _y) / (chunkSize * 2);
        const noise = normalizeNoise(xx, yy);

        const biomes = 2;
        const biomeScale = 0.25;
        const biome = (normalizeNoise(xx * biomeScale, yy * biomeScale) * biomes) | 0;

        data[index] = noise < 0.5 ? biome : biome | 0x80; //first bit set to 1 indicates height
        //data[index] = (normalizeNoise(xx, yy) * 256) | 0;

        /*const xx = (chunkX + x) / (chunkSize * 2);
        const yy = (chunkY + y) / (chunkSize * 2);
        let noise = normalizeNoise(simplex.noise2D(xx, yy));
        if (noise < 0.5) {
          noise = 0.5;
        }

        const biomes = 2,
          biomeScale = 0.25;
        const biome = (normalizeNoise(simplex.noise2D(xx * biomeScale, yy * biomeScale)) * biomes) | 0;

        blocks.push({
          x,
          y,
          z,
          type: z > 0 ? 0 : 1 + biome
        });*/
      }
    }

    /*return {
      x,
      y,
      data
    };*/
    return data;
  }
};

export default Generator;
