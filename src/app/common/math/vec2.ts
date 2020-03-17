export default class Vec2 {
  private _x: number;
  private _y: number;

  constructor(x?: number, y?: number) {
    this._x = x || 0;
    this._y = y || 0;
  }

  clone() {
    return new Vec2(this._x, this._y);
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  set x(x: number) {
    this._x = x;
  }

  set y(y: number) {
    this._y = y;
  }

  setXY(x: number, y: number) {
    this._x = x;
    this._y = y;
    return this;
  }

  addXY(x: number, y: number) {
    this.setXY(this._x + x, this._y + y);
    return this;
  }

  subXY(x: number, y: number) {
    this.setXY(this._x - x, this._y - y);
    return this;
  }

  //static methods

  static subtract(v1: Vec2, v2: Vec2) {
    return v1.clone().subXY(v2.x, v2.y);
  }
}
