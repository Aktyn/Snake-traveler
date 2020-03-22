const toHexString = (number: number) => '#' + ('000000' + number.toString(16)).substr(-6);

export interface ColorI {
  byteBuffer: Uint8ClampedArray;
  buffer: Float32Array;
  hex: string;
}

function rgb(r: number, g: number, b: number): ColorI {
  return {
    byteBuffer: new Uint8ClampedArray([r, g, b]),
    buffer: new Float32Array([r / 255, g / 255, b / 255, 1]),
    hex: toHexString((r << 16) | (g << 8) | (b << 0))
  };
}

/*export function mixColors(color1: ColorI, color2: ColorI, factor: number) {
  return rgb(
    mix(color1.byteBuffer[0], color2.byteBuffer[0], factor) | 0,
    mix(color1.byteBuffer[1], color2.byteBuffer[1], factor) | 0,
    mix(color1.byteBuffer[2], color2.byteBuffer[2], factor) | 0
  );
}*/

export const Palette = {
  WHITE: rgb(255, 255, 255),
  BLACK: rgb(0, 0, 0)
  //WALLS: rgb(129, 212, 250)
};

export const Biomes = [
  {
    foreground: rgb(239, 154, 154),
    background: rgb(244, 67, 54)
  },
  {
    foreground: rgb(244, 143, 177),
    background: rgb(233, 30, 99)
  },
  {
    foreground: rgb(206, 147, 216),
    background: rgb(156, 39, 176)
  },
  {
    foreground: rgb(179, 157, 219),
    background: rgb(103, 58, 183)
  },
  {
    foreground: rgb(159, 168, 218),
    background: rgb(63, 81, 181)
  },
  {
    foreground: rgb(144, 202, 249),
    background: rgb(33, 150, 243)
  },
  {
    foreground: rgb(129, 212, 250),
    background: rgb(3, 169, 244)
  },
  {
    foreground: rgb(128, 222, 234),
    background: rgb(0, 188, 212)
  },
  {
    foreground: rgb(128, 203, 196),
    background: rgb(0, 150, 136)
  },
  {
    foreground: rgb(165, 214, 167),
    background: rgb(76, 175, 80)
  },
  {
    foreground: rgb(197, 225, 165),
    background: rgb(139, 195, 74)
  },
  {
    foreground: rgb(230, 238, 156),
    background: rgb(205, 220, 57)
  },
  {
    foreground: rgb(255, 245, 157),
    background: rgb(255, 235, 59)
  },
  {
    foreground: rgb(255, 224, 130),
    background: rgb(255, 193, 7)
  },
  {
    foreground: rgb(255, 204, 128),
    background: rgb(255, 152, 0)
  },
  {
    foreground: rgb(255, 171, 145),
    background: rgb(255, 87, 34)
  },
  {
    foreground: rgb(188, 170, 164),
    background: rgb(121, 85, 72)
  },
  {
    foreground: rgb(238, 238, 238),
    background: rgb(158, 158, 158)
  },
  {
    foreground: rgb(176, 190, 197),
    background: rgb(96, 125, 139)
  }
];
