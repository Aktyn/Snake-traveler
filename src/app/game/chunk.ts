import Vec2 from '../common/math/vec2';
import Matrix2D from '../common/math/matrix2d';
import { ExtendedTexture } from '../graphics/texture';
import { Biomes, Palette } from '../common/colors';

const prepareCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Chunk.RESOLUTION;
  return canvas;
};

export default class Chunk extends Vec2 {
  public static RESOLUTION = 256;
  public static SIZE = Chunk.RESOLUTION / 1024;

  //objects: ObjectBase[] = [];
  private data: Uint8ClampedArray | null = null;
  private _matrix: Matrix2D;
  private _webglTextureB: ExtendedTexture | null = null;
  private _webglTextureF: ExtendedTexture | null = null;
  public readonly canvases = {
    background: prepareCanvas(),
    foreground: prepareCanvas()
  };

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
    this._webglTextureB?.destroy();
    this._webglTextureF?.destroy();
  }

  get matrix() {
    return this._matrix;
  }

  get hasWebGLTexturesGenerated() {
    return Boolean(this._webglTextureB && this._webglTextureF);
  }

  bindForegroundTexture() {
    this._webglTextureF?.bind();
  }

  bindBackgroundTexture() {
    this._webglTextureB?.bind();
  }

  private static setImageDataToCanvas(canvas: HTMLCanvasElement, data: ImageData) {
    canvas.getContext('2d', { alpha: false })?.putImageData(data, 0, 0);
  }

  setData(buffer: ArrayBuffer) {
    this.data = new Uint8ClampedArray(buffer);

    const backgroundImgData = new ImageData(Chunk.RESOLUTION, Chunk.RESOLUTION);
    const foregroundImgData = new ImageData(Chunk.RESOLUTION, Chunk.RESOLUTION);

    for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
      //TODO: antialias texture
      //foreground data (wall color can be set here (according to biome))
      const biome = this.data[i] & ~0x80;

      backgroundImgData.data[i * 4 + 0] = Biomes[biome].background.byteBuffer[0];
      backgroundImgData.data[i * 4 + 1] = Biomes[biome].background.byteBuffer[1];
      backgroundImgData.data[i * 4 + 2] = Biomes[biome].background.byteBuffer[2];
      backgroundImgData.data[i * 4 + 3] = 255;

      foregroundImgData.data[i * 4 + 0] = Palette.WALLS.byteBuffer[0];
      foregroundImgData.data[i * 4 + 1] = Palette.WALLS.byteBuffer[1];
      foregroundImgData.data[i * 4 + 2] = Palette.WALLS.byteBuffer[2];
      foregroundImgData.data[i * 4 + 3] = this.data[i] & 0x80 ? 255 : 0;
    }

    Chunk.setImageDataToCanvas(this.canvases.background, backgroundImgData);
    Chunk.setImageDataToCanvas(this.canvases.foreground, foregroundImgData);

    this.needTextureUpdate = true;
  }

  setTextures(background: ExtendedTexture, foreground: ExtendedTexture) {
    this._webglTextureB = background;
    this._webglTextureF = foreground;
    this.needTextureUpdate = false;
  }

  updateTexture() {
    this._webglTextureB?.update(this.canvases.background, true);
    this._webglTextureF?.update(this.canvases.foreground, true);
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
