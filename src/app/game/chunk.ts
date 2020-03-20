import Vec2 from '../common/math/vec2';
import Matrix2D from '../common/math/matrix2d';
import { ExtendedTexture } from '../graphics/texture';

export default class Chunk extends Vec2 {
  public static RESOLUTION = 256;
  public static SIZE = Chunk.RESOLUTION / 1024;

  //objects: ObjectBase[] = [];
  private data: Uint8ClampedArray | null = null;
  private _matrix: Matrix2D;
  private _webglTexture: ExtendedTexture | null = null;
  private _canvas: HTMLCanvasElement | null = null;

  public needTextureUpdate = false;

  constructor(x: number, y: number) {
    super(x, y);
    this._matrix = new Matrix2D();
    this._matrix.setPos((x / Chunk.RESOLUTION) * Chunk.SIZE * 2, (-y / Chunk.RESOLUTION) * Chunk.SIZE * 2);
    this._matrix.setScale(Chunk.SIZE, Chunk.SIZE);
  }

  destroy() {
    //this.objects.forEach(obj => obj.destroy());
    //this.objects = [];
    this._webglTexture?.destroy();
  }

  get matrix() {
    return this._matrix;
  }

  get webglTexture() {
    return this._webglTexture;
  }

  get canvas() {
    return this._canvas;
  }

  setData(buffer: ArrayBuffer) {
    this.data = new Uint8ClampedArray(buffer);

    this._canvas = document.createElement('canvas');
    this._canvas.width = this._canvas.height = Chunk.RESOLUTION;
    const ctx = this._canvas.getContext('2d', { alpha: false });
    const imgData = new ImageData(Chunk.RESOLUTION, Chunk.RESOLUTION);
    for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
      imgData.data[i * 4 + 0] = this.data[i];
      imgData.data[i * 4 + 1] = this.data[i];
      imgData.data[i * 4 + 2] = this.data[i];
      imgData.data[i * 4 + 3] = 255;
    }
    ctx?.putImageData(imgData, 0, 0);

    this.needTextureUpdate = true;
  }

  setTexture(texture: ExtendedTexture) {
    this._webglTexture = texture;
    this.needTextureUpdate = false;
  }

  updateTexture() {
    if (this._canvas) {
      this._webglTexture?.update(this._canvas, true);
    }
    this.needTextureUpdate = false;
  }

  isLoaded() {
    return this.data !== null;
  }

  static clampPos(pos: Vec2) {
    const xInt = pos.x | 0;
    const yInt = pos.y | 0;

    return new Vec2(xInt - (xInt % Chunk.RESOLUTION), yInt - (yInt % Chunk.RESOLUTION));
  }
}
