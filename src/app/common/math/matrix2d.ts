export default class Matrix2D {
  private readonly _buffer: Float32Array;
  protected _rot = 0;
  private _width = 1;
  private _height = 1;

  constructor() {
    this._buffer = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  }

  setIdentity() {
    this._buffer.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this._rot = 0;
    this._width = 1;
    this._height = 1;

    return this;
  }

  setPos(x: number, y: number) {
    this._buffer[6] = x;
    this._buffer[7] = y;
    return this;
  }

  move(x: number, y: number) {
    this._buffer[6] += x;
    this._buffer[7] += y;
    return this;
  }

  private setRotScale(rot: number, w: number, h: number) {
    this._rot = rot;
    this._width = w;
    this._height = h;

    const c = Math.cos(rot);
    const s = Math.sin(rot);

    this._buffer[0] = w * c;
    this._buffer[1] = w * -s;

    this._buffer[3] = h * s;
    this._buffer[4] = h * c;

    return this;
  }

  setScale(w: number, h: number) {
    return this.setRotScale(this._rot, w, h);
  }

  setRot(rot: number) {
    return this.setRotScale(rot, this._width, this._height);
  }
  set rot(rot: number) {
    this.setRotScale(rot, this._width, this._height);
  }

  // GETTERS //

  get buffer() {
    return this._buffer;
  }

  get x() {
    return this._buffer[6];
  }
  set x(x: number) {
    this._buffer[6] = x;
  }

  get y() {
    return this._buffer[7];
  }
  set y(y: number) {
    this._buffer[7] = y;
  }

  get rot() {
    return this._rot;
  }

  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
}
