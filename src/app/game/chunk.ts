import Vec2 from '../common/math/vec2';
import Matrix2D from '../common/math/matrix2d';
import { ExtendedTexture } from '../graphics/texture';
import { Biomes } from '../common/colors';
import { mix } from '../common/utils';

const loadingChunks: Set<Chunk> = new Set();

export const postGenerateQueue = (() => {
  const registeredChunks: Chunk[] = [];
  const registeredBatchLoadCallbacks: Function[] = [];
  let generateTimeout: NodeJS.Timeout | null = null;

  function setQueueTimeout() {
    if (generateTimeout) {
      clearTimeout(generateTimeout);
    }

    if (!loadingChunks.size) {
      if (registeredChunks.length) {
        setTimeout(() => {
          registeredChunks.shift()?.postGenerate();
          setQueueTimeout();
        }, 1000 / 30);
      } else {
        //console.log('chunks batch fully generated');
        registeredBatchLoadCallbacks.forEach(cb => cb());
        registeredBatchLoadCallbacks.length = 0;
      }

      return;
    }

    generateTimeout = setTimeout(setQueueTimeout, 200);
  }

  return {
    registerChunk(chunk: Chunk) {
      registeredChunks.push(chunk);
      loadingChunks.delete(chunk);

      setQueueTimeout();
    },
    registerBatchLoad(callback: Function) {
      registeredBatchLoadCallbacks.push(callback);
    }
  };
})();

const prepareCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Chunk.RESOLUTION;
  return canvas;
};

export default class Chunk extends Vec2 {
  public static readonly RESOLUTION = 256;
  public static readonly SIZE = Chunk.RESOLUTION / 1024;

  //the number of chunks loaded in each direction from camera center
  public static readonly GRID_SIZE_Y = 1; //(0.5 / Chunk.SIZE + 4) | 0;
  public static readonly GRID_SIZE_X = Chunk.GRID_SIZE_Y * 2; // - 4;

  public static get loadingChunks() {
    return loadingChunks.size;
  }

  private loaded = false;
  private data: Float32Array | null = null;
  private _matrix: Matrix2D;
  private _webglTextureB: ExtendedTexture | null = null;
  private _webglTextureF: ExtendedTexture | null = null;
  public readonly canvases = {
    background: prepareCanvas(),
    foreground: prepareCanvas()
  };
  private backgroundImgData = new ImageData(Chunk.RESOLUTION, Chunk.RESOLUTION);
  private foregroundImgData = new ImageData(Chunk.RESOLUTION, Chunk.RESOLUTION);

  public needTextureUpdate = false;

  constructor(x: number, y: number) {
    super(x, y);
    this._matrix = new Matrix2D();
    this._matrix.setPos(x * Chunk.SIZE * 2, -y * Chunk.SIZE * 2);
    this._matrix.setScale(Chunk.SIZE, Chunk.SIZE);

    loadingChunks.add(this);
  }

  destroy() {
    this._webglTextureB?.destroy();
    this._webglTextureF?.destroy();
    this.data = null;
    this.canvases.background.remove();
    this.canvases.foreground.remove();
    loadingChunks.delete(this);
    this.loaded = false;
  }

  get matrix() {
    return this._matrix;
  }

  get hasWebGLTexturesGenerated() {
    return Boolean(this._webglTextureB && this._webglTextureF);
  }

  /*getForegroundPixelColor(pX: number, pY: number, buffer: Uint8Array) {
    buffer[3] = 0;
  }*/

  /**
   * @param pX it should be float in range [0, 1]
   * @param pY it should be float in range [0, 1]
   */
  getForegroundPixelAlpha(pX: number, pY: number) {
    const iX = (pX * Chunk.RESOLUTION) | 0;
    const iY = (pY * Chunk.RESOLUTION) | 0;
    const index = iX + iY * Chunk.RESOLUTION;
    return this.foregroundImgData.data[index * 4 + 3]; //return alpha channel value
  }

  bindForegroundTexture() {
    this._webglTextureF?.bind();
  }

  bindBackgroundTexture() {
    this._webglTextureB?.bind();
  }

  private updateCanvases() {
    this.canvases.background.getContext('2d', { alpha: false })?.putImageData(this.backgroundImgData, 0, 0);
    this.canvases.foreground.getContext('2d', { alpha: false })?.putImageData(this.foregroundImgData, 0, 0);
  }

  setData(buffer: ArrayBuffer) {
    this.data = new Float32Array(buffer);

    for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
      for (let c = 0; c < 3; c++) {
        this.backgroundImgData.data[i * 4 + c] = 128;
        this.foregroundImgData.data[i * 4 + c] = 255;
      }

      this.backgroundImgData.data[i * 4 + 3] = 255;
      this.foregroundImgData.data[i * 4 + 3] = this.data[i] & 0x80 ? 255 : 0;
    }

    this.updateCanvases();

    this.needTextureUpdate = true;
    this.loaded = true;

    postGenerateQueue.registerChunk(this);
    //setTimeout(() => this.postGenerate(), 1);
  }

  public postGenerate() {
    if (!this.data || !this.loaded) {
      return;
    }

    for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
      //foreground data (wall color can be set here (according to biome))
      const value = Math.abs(this.data[i]);
      const biome = Math.max(0, value | 0); //this.data[i] & ~0x80;
      const nextBiome = Math.min(Biomes.length - 1, biome + 1);
      const mixFactor = value - biome;

      for (let c = 0; c < 3; c++) {
        //mixedBackground.byteBuffer[c];
        this.backgroundImgData.data[i * 4 + c] =
          (mix(Biomes[biome].background.buffer[c], Biomes[nextBiome].background.buffer[c], mixFactor) * 255) | 0;
        this.foregroundImgData.data[i * 4 + c] =
          (mix(Biomes[biome].foreground.buffer[c], Biomes[nextBiome].foreground.buffer[c], mixFactor) * 255) | 0;
      }

      this.backgroundImgData.data[i * 4 + 3] = 255; //this.data[i] < 0 ? 255 : 0; //this.data[i] & 0x80 ? 255 : 0; //255;
      this.foregroundImgData.data[i * 4 + 3] = this.data[i] & 0x80 ? 255 : 0;
    }

    //little blur for foreground texture
    /*const blurRadius = 3;
    const maxNeighbors = (blurRadius * 2 + 1) ** 2 - 1;
    for (let x = 0; x < Chunk.RESOLUTION; x++) {
      for (let y = 0; y < Chunk.RESOLUTION; y++) {
        const i = x + y * Chunk.RESOLUTION;

        let neighbors = 0; //0 -> (blurRadius*2+1)**2 - 1
        for (let yy = -blurRadius; yy <= blurRadius; yy++) {
          for (let xx = -blurRadius; xx <= blurRadius; xx++) {
            if (
              x + xx < 0 ||
              x + xx >= Chunk.RESOLUTION ||
              y + yy < 0 ||
              y + yy >= Chunk.RESOLUTION ||
              (xx === 0 && yy === 0)
            ) {
              neighbors++;
              continue;
            }
            const j = x + xx + (y + yy) * Chunk.RESOLUTION;
            if (backgroundImgData.data[j * 4 + 3] > 0) {
              neighbors++;
            }
          }
        }

        foregroundImgData.data[i * 4 + 3] = (backgroundImgData.data[i * 4 + 3] * (neighbors / maxNeighbors)) | 0;
        backgroundImgData.data[i * 4 + 3] = 255;
      }
    }*/

    this.updateCanvases();

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
    return this.loaded;
  }

  static clampPos(x: number, y: number) {
    const xInt = (x / Chunk.SIZE / 2) | 0;
    const yInt = (y / Chunk.SIZE / 2) | 0;

    return new Vec2(xInt, yInt);
  }
}
