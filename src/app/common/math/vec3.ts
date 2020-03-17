import Vec2 from './vec2';

export default class Vec3 extends Vec2 {
  private _z: number;

  constructor(x?: number, y?: number, z?: number) {
    super(x, y);
    this._z = z || 0;
  }

  get z() {
    return this._z;
  }

  setXYZ(x: number, y: number, z: number) {
    this._z = z;
    return super.setXY(x, y);
  }

  addXYZ(x: number, y: number, z: number) {
    this._z += z;
    return super.addXY(x, y);
  }
}
