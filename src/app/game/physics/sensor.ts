/*function extendType<T>(target: T): T & { [index: string]: ShapeI } {
  return target as T & { [index: string]: ShapeI };
}

export interface ShapeI {
  [index: string]: number[][];
}*/

export const SensorShapes = {
  /*TRIANGLE: [
    [0.0, 1.0],
    [-1.0, -1.0],
    [1.0, -1.0],
    [-0.5, 0.0],
    [0.5, 0.0]
  ],
  SQUARE: [
    [0.0, 1.0],
    [-1.0, -1.0],
    [1.0, -1.0],
    [-0.5, 0.0],
    [0.5, 0.0]
  ],
  PENTAGON: [
    [0.0, 1.0],
    [-0.5, 1.0],
    [0.5, 1.0],
    [-0.5, -1.0],
    [0.5, -1.0],
    [-1.0, -0.5],
    [1.0, -0.5]
  ],
  ROCKET: [
    [0.0, 1.0],
    [-1.0, -0.9],
    [1.0, -0.9],
    [-0.5, 0.5],
    [0.5, 0.5]
  ],*/

  CIRCLE: new Array(8).fill(0).map((_, index, arr) => {
    const a = Math.PI * 2.0 * (index / arr.length) + Math.PI / 2;
    return [Math.cos(a), Math.sin(a)].map(v => (Math.abs(v) < 1e-10 ? 0 : v));
  }),
  PLAYER: [
    [0.0, 1.0],
    [0.5, 0.5],
    [0.5, -0.5],
    [0.0, -1.0],
    [-0.5, -0.5],
    [-0.5, 0.5]
  ],
  BULLET: [
    [0.0, 1.0],
    [0.0, -1.0],
    [-0.5, 0.5],
    [0.5, 0.5],
    [-0.5, -0.5],
    [0.5, -0.5]
  ]
};

export default class Sensor {
  public shape: number[][];

  constructor(shape = SensorShapes.CIRCLE) {
    this.shape = shape;
  }
}
