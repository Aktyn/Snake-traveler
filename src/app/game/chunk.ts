import Vec2 from '../common/math/vec2';
import Matrix2D from '../common/math/matrix2d';
import { ExtendedTexture } from '../graphics/texture';
import { Biomes } from '../common/colors';
import { mix } from '../common/utils';
import API from '../common/api';
import { WorldSchema } from '../common/schemas';

const STAMP = Float32Array.from(Buffer.from('mgdlnkczmr'));

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

    generateTimeout = setTimeout(setQueueTimeout, 1000 / 30);
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

export const saveQueue = (() => {
  const registeredChunks = new Set<Chunk>();
  let saveTimeout: NodeJS.Timeout | null = null;
  let savingChunk: Chunk | undefined;

  function canvasToBlob(canvas: HTMLCanvasElement) {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject('Cannot extract blob data from canvas');
        }
      });
    });
  }

  function setQueueTimeout() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    if (savingChunk || !registeredChunks.size) {
      saveTimeout = null;
      return;
    }

    savingChunk = registeredChunks.values().next().value;

    setTimeout(async () => {
      if (!savingChunk) {
        return;
      }
      const foregroundData = await canvasToBlob(savingChunk.canvases.foreground);
      registeredChunks.delete(savingChunk);
      await API.updateChunk(
        savingChunk.world.id,
        savingChunk.x * Chunk.RESOLUTION,
        savingChunk.y * Chunk.RESOLUTION,
        foregroundData
      );

      //console.log('saved', savingChunk?.x, savingChunk?.y);
      savingChunk = undefined;
      setQueueTimeout();
    }, 1000 / 30);

    saveTimeout = setTimeout(setQueueTimeout, 1000 / 30);
  }

  return {
    registerChunk(chunk: Chunk) {
      if (!registeredChunks.has(chunk)) {
        registeredChunks.add(chunk);
        setQueueTimeout();
      }
    }
  };
})();

const prepareCanvas = () => {
  //if ('OffscreenCanvas' in window) {
  //  return new OffscreenCanvas(Chunk.RESOLUTION, Chunk.RESOLUTION);
  //} else {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Chunk.RESOLUTION;
  return canvas;
  //}
};

const prepareContext = (canvas: OffscreenCanvas | HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', {
    alpha: true
  }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  ctx.globalCompositeOperation = 'destination-out'; //'source-over' is default

  return ctx;
};

export default class Chunk extends Vec2 {
  public static readonly RESOLUTION = 256;
  public static readonly SIZE = Chunk.RESOLUTION / 1024;
  private static readonly SPAWN_AREA_RADIUS = 0.5;

  //the number of chunks loaded in each direction from camera center
  public static readonly GRID_SIZE_Y = (0.5 / Chunk.SIZE + 4) | 0; //3
  public static readonly GRID_SIZE_X = Chunk.GRID_SIZE_Y * 2 - 4; //4

  public static get loadingChunks() {
    return loadingChunks.size;
  }

  private loaded = false;
  private restored = false;
  private postGenerated = false;
  public readonly world: WorldSchema;
  private data: Float32Array | null = null;
  private _matrix: Matrix2D;

  private _webglTextureB: ExtendedTexture | null = null;
  private _webglTextureF: ExtendedTexture | null = null;

  public readonly canvases = {
    background: prepareCanvas(),
    foreground: prepareCanvas()
  };
  public readonly context = {
    background: prepareContext(this.canvases.background),
    foreground: prepareContext(this.canvases.foreground)
  };

  private backgroundImgData = new ImageData(Chunk.RESOLUTION, Chunk.RESOLUTION);
  private foregroundImgData = new ImageData(Chunk.RESOLUTION, Chunk.RESOLUTION);

  public readonly updateFlags = {
    needBackgroundTextureUpdate: false,
    needForegroundTextureUpdate: false,
    needForegroundImageDataUpdate: false
  };

  constructor(x: number, y: number, world: WorldSchema) {
    super(x, y);
    this.world = world;
    this._matrix = new Matrix2D();
    this._matrix.setPos(x * Chunk.SIZE * 2, -y * Chunk.SIZE * 2);
    this._matrix.setScale(Chunk.SIZE, Chunk.SIZE);

    loadingChunks.add(this);
  }

  destroy() {
    this._webglTextureB?.destroy();
    this._webglTextureF?.destroy();
    this.data = null;
    loadingChunks.delete(this);
    this.loaded = false;
  }

  get matrix() {
    return this._matrix;
  }

  get hasWebGLTexturesGenerated() {
    return Boolean(this._webglTextureB && this._webglTextureF);
  }

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
    this.context.background.putImageData(this.backgroundImgData, 0, 0);
    this.context.foreground.putImageData(this.foregroundImgData, 0, 0);

    this.updateFlags.needBackgroundTextureUpdate = this.updateFlags.needForegroundTextureUpdate = true;
  }

  private isWithinSpawnArea(pixelIndex: number) {
    if (
      this.matrix.x + Chunk.SIZE < -Chunk.SPAWN_AREA_RADIUS ||
      this.matrix.x - Chunk.SIZE > Chunk.SPAWN_AREA_RADIUS ||
      this.matrix.y + Chunk.SIZE < -Chunk.SPAWN_AREA_RADIUS ||
      this.matrix.y - Chunk.SIZE > Chunk.SPAWN_AREA_RADIUS
    ) {
      return;
    }

    const y = (pixelIndex / Chunk.RESOLUTION) | 0;
    const x = pixelIndex - y * Chunk.RESOLUTION;

    const xx = this.matrix.x - Chunk.SIZE + (x / Chunk.RESOLUTION) * Chunk.SIZE * 2;
    const yy = -this.matrix.y - Chunk.SIZE + (y / Chunk.RESOLUTION) * Chunk.SIZE * 2;

    return xx * xx + yy * yy < Chunk.SPAWN_AREA_RADIUS ** 2;
  }

  setData(buffer: ArrayBuffer) {
    this.data = new Float32Array(buffer);

    let restored = true;
    for (let i = 0; i < STAMP.length; i++) {
      if (STAMP[i] !== this.data[i]) {
        restored = false;
        break;
      }
    }
    this.restored = restored;

    const foregroundOffset = Chunk.RESOLUTION * Chunk.RESOLUTION;

    if (restored) {
      this.context.background.globalCompositeOperation = 'source-over';
      this.context.background.fillStyle = '#808080';
      this.context.background.fillRect(0, 0, Chunk.RESOLUTION, Chunk.RESOLUTION);
      this.context.background.globalCompositeOperation = 'destination-out';

      const img = new Image();
      img.width = img.height = Chunk.RESOLUTION;
      img.onload = () => {
        this.context.foreground.clearRect(0, 0, Chunk.RESOLUTION, Chunk.RESOLUTION);
        this.context.foreground.globalCompositeOperation = 'source-over';
        this.context.foreground.drawImage(img, 0, 0);
        this.foregroundImgData = this.context.foreground.getImageData(0, 0, Chunk.RESOLUTION, Chunk.RESOLUTION);

        this.context.foreground.globalCompositeOperation = 'destination-out';

        postGenerateQueue.registerChunk(this);

        this.updateFlags.needBackgroundTextureUpdate = this.updateFlags.needForegroundTextureUpdate = true;
        this.loaded = true;
      };
      const reader = new FileReader();
      reader.onerror = console.error;
      reader.onload = () => (img.src = reader.result as string);
      reader.readAsDataURL(new Blob([this.data.subarray(STAMP.length + foregroundOffset)]));
    } else {
      for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
        for (let c = 0; c < 3; c++) {
          this.backgroundImgData.data[i * 4 + c] = 128;
          this.foregroundImgData.data[i * 4 + c] = 255;
        }

        this.backgroundImgData.data[i * 4 + 3] = 255;
        if (this.isWithinSpawnArea(i)) {
          this.data[i + foregroundOffset] = 0;
        }
        this.foregroundImgData.data[i * 4 + 3] = this.data[i + foregroundOffset] & 0x80 ? 255 : 0;
      }

      this.updateCanvases();

      this.loaded = true;
      postGenerateQueue.registerChunk(this);
    }
  }

  public postGenerate() {
    if (!this.data || !this.loaded) {
      return;
    }
    const foregroundOffset = Chunk.RESOLUTION * Chunk.RESOLUTION;

    if (this.restored) {
      //const bgData = this.data.subarray(STAMP.length, STAMP.length + foregroundOffset - 1);
      //paint only background layer
      for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
        const valueB = this.data[i + STAMP.length];
        const biomeB = Math.max(0, valueB | 0);
        const nextBiomeB = Math.min(Biomes.length - 1, biomeB + 1);
        const mixFactorB = valueB - biomeB;

        for (let c = 0; c < 3; c++) {
          this.backgroundImgData.data[i * 4 + c] =
            (mix(Biomes[biomeB].background.buffer[c], Biomes[nextBiomeB].background.buffer[c], mixFactorB) * 255) | 0;
        }
        this.backgroundImgData.data[i * 4 + 3] = 255;
      }

      this.context.background.putImageData(this.backgroundImgData, 0, 0);
      this.updateFlags.needBackgroundTextureUpdate = true;
    } else {
      for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
        //foreground data (wall color can be set here (according to biome))
        const valueB = this.data[i];
        const valueF = Math.abs(this.data[i + foregroundOffset]);
        const biomeB = Math.max(0, valueB | 0);
        const biomeF = Math.max(0, valueF | 0);
        const nextBiomeB = Math.min(Biomes.length - 1, biomeB + 1);
        const nextBiomeF = Math.min(Biomes.length - 1, biomeF + 1);
        const mixFactorB = valueB - biomeB;
        const mixFactorF = valueF - biomeF;

        for (let c = 0; c < 3; c++) {
          this.backgroundImgData.data[i * 4 + c] =
            (mix(Biomes[biomeB].background.buffer[c], Biomes[nextBiomeB].background.buffer[c], mixFactorB) * 255) | 0;
          this.foregroundImgData.data[i * 4 + c] =
            (mix(Biomes[biomeF].foreground.buffer[c], Biomes[nextBiomeF].foreground.buffer[c], mixFactorF) * 255) | 0;
        }

        //this.backgroundImgData.data[i * 4 + 3] = 255; //this.data[i] < 0 ? 255 : 0; //this.data[i] & 0x80 ? 255 : 0; //255;
        //this.foregroundImgData.data[i * 4 + 3] = this.data[i + foregroundOffset] & 0x80 ? 255 : 0;
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
      saveQueue.registerChunk(this); //TODO: {chunk: this, saveBackground: true} (background can be saved in backend just once after first chunk post generation)
    }

    this.postGenerated = true;
  }

  setTextures(background: ExtendedTexture, foreground: ExtendedTexture) {
    this._webglTextureB = background;
    this._webglTextureF = foreground;
    this.updateFlags.needBackgroundTextureUpdate = this.updateFlags.needForegroundTextureUpdate = false;
  }

  needTextureUpdate() {
    return (
      this.updateFlags.needBackgroundTextureUpdate ||
      this.updateFlags.needForegroundTextureUpdate ||
      this.updateFlags.needForegroundImageDataUpdate
    );
  }

  updateTexture() {
    if (this.updateFlags.needForegroundImageDataUpdate) {
      this.foregroundImgData = this.context.foreground.getImageData(0, 0, Chunk.RESOLUTION, Chunk.RESOLUTION); //TODO: optimize because it takes about 2 ms
      this.updateFlags.needForegroundImageDataUpdate = false;

      saveQueue.registerChunk(this);
    }

    if (this.updateFlags.needBackgroundTextureUpdate) {
      this._webglTextureB?.update(this.canvases.background, true);
      this.updateFlags.needBackgroundTextureUpdate = false;
    }

    if (this.updateFlags.needForegroundTextureUpdate) {
      this._webglTextureF?.update(this.canvases.foreground, true);
      this.updateFlags.needForegroundTextureUpdate = false;
    }
  }

  isLoaded() {
    return this.loaded;
  }

  isPostGenerated() {
    return this.postGenerated;
  }

  static clampPos(x: number, y: number) {
    const xInt = (x / Chunk.SIZE / 2) | 0;
    const yInt = (y / Chunk.SIZE / 2) | 0;

    return new Vec2(xInt, yInt);
  }
}
