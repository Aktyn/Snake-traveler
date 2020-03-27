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

  set(x: number, y: number) {
    this._x = x;
    this._y = y;
    return this;
  }

  add(x: number, y: number) {
    this.set(this._x + x, this._y + y);
    return this;
  }

  normalize() {
    const len = this.getLength();
    if (len <= Number.EPSILON) {
      this.set(0, 1);
    }

    this.set(this._x / len, this._y / len);

    return this;
  }

  dot(inVec: Vec2) {
    const valuesSum = this.x * inVec.x + this.y * inVec.y;
    return valuesSum;
  }

  getLengthSquared() {
    return this._x * this._x + this._y * this._y;
  }

  getLength() {
    return Math.sqrt(this.getLengthSquared());
  }

  sub(x: number, y: number) {
    this.set(this._x - x, this._y - y);
    return this;
  }

  //static methods

  static subtract(v1: Vec2, v2: Vec2) {
    return v1.clone().sub(v2.x, v2.y);
  }
}
