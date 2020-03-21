const toHexString = (number: number) => '#' + ('000000' + number.toString(16)).substr(-6);

export interface ColorI {
  byteBuffer: Uint8ClampedArray;
  buffer: Float32Array;
  hex: string;
}

function gen(r: number, g: number, b: number): ColorI {
  return {
    byteBuffer: new Uint8ClampedArray([r, g, b]),
    buffer: new Float32Array([r / 255, g / 255, b / 255, 1]),
    hex: toHexString((r << 16) | (g << 8) | (b << 0))
  };
}

export const Palette = {
  WHITE: gen(255, 255, 255),
  BLACK: gen(0, 0, 0),
  WALLS: gen(129, 212, 250)
};

export const Biomes = [
  {
    background: gen(255, 128, 128)
  },
  {
    background: gen(128, 255, 128)
  },
  {
    background: gen(128, 128, 255)
  },
  {
    background: gen(255, 255, 128)
  },
  {
    background: gen(128, 255, 255)
  },
  {
    background: gen(255, 128, 255)
  }
];
