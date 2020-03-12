export default class Vec2 {
  private _x: number;
  private _y: number;

  constructor(x?: number, y?: number) {
    this._x = x || 0;
    this._y = y || 0;
  }

  public get x() {
    return this._x;
  }

  public get y() {
    return this._y;
  }

  public set(x: number, y: number) {
    this._x = x;
    this._y = y;
  }
}
