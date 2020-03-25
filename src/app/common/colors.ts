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
    foreground: rgb(144, 164, 174),
    background: rgb(244, 67, 54)
  },
  {
    foreground: rgb(224, 224, 224),
    background: rgb(233, 30, 99)
  },
  {
    foreground: rgb(161, 136, 127),
    background: rgb(156, 39, 176)
  },
  {
    foreground: rgb(255, 138, 101),
    background: rgb(103, 58, 183)
  },
  {
    foreground: rgb(255, 183, 77),
    background: rgb(63, 81, 181)
  },
  {
    foreground: rgb(255, 213, 79),
    background: rgb(33, 150, 243)
  },
  {
    foreground: rgb(255, 241, 118),
    background: rgb(3, 169, 244)
  },
  {
    foreground: rgb(220, 231, 117),
    background: rgb(0, 188, 212)
  },
  {
    foreground: rgb(174, 213, 129),
    background: rgb(0, 150, 136)
  },
  {
    foreground: rgb(129, 199, 132),
    background: rgb(76, 175, 80)
  },
  {
    foreground: rgb(77, 182, 172),
    background: rgb(139, 195, 74)
  },
  {
    foreground: rgb(77, 208, 225),
    background: rgb(205, 220, 57)
  },
  {
    foreground: rgb(79, 195, 247),
    background: rgb(255, 235, 59)
  },
  {
    foreground: rgb(100, 181, 246),
    background: rgb(255, 193, 7)
  },
  {
    foreground: rgb(121, 134, 203),
    background: rgb(255, 152, 0)
  },
  {
    foreground: rgb(149, 117, 205),
    background: rgb(255, 87, 34)
  },
  {
    foreground: rgb(186, 104, 200),
    background: rgb(121, 85, 72)
  },
  {
    foreground: rgb(240, 98, 146),
    background: rgb(158, 158, 158)
  },
  {
    foreground: rgb(229, 115, 115),
    background: rgb(96, 125, 139)
  }
];
