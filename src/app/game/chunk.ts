import Vec2 from '../common/math/vec2';
import Matrix2D from '../common/math/matrix2d';
import { ExtendedTexture } from './graphics/texture';
import { Biomes } from '../common/colors';
import { mix } from '../common/utils';
import API, { ChunkUpdateData, CustomError } from '../common/api';
import { WorldSchema } from '../common/schemas';

const STAMP = Buffer.from('mgdlnkczmr');
const MAX_BATCH_SIZE = 32;

const loadingChunks: Set<Chunk> = new Set();

export const postGenerateQueue = (() => {
  const registeredChunks: Chunk[] = [];
  const registeredBatchLoadCallbacks: Function[] = [];
  let generateTimeout: NodeJS.Timeout | null = null;

  function setQueueTimeout() {
    if (generateTimeout) {
      clearTimeout(generateTimeout);
    }

    if (!loadingChunks.size || loadingChunks.size > 8) {
      if (registeredChunks.length) {
        const chunk = registeredChunks.shift();
        setTimeout(
          () => {
            chunk?.postGenerate();
            setQueueTimeout();
          },
          chunk?.isRestored() ? 0 : 1000 / 10
        );
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
  let queueTimeout: NodeJS.Timeout | null = null;

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

  async function setQueueTimeout() {
    if (!registeredChunks.size) {
      //nothing more to save
      queueTimeout = null;
      return;
    }

    const batchSize = Math.min(MAX_BATCH_SIZE, Math.max(1, (registeredChunks.size / 1) | 0));
    const iterator = registeredChunks.values();
    const savingChunks: Chunk[] = [];
    for (let i = 0; i < batchSize; i++) {
      const chunk = iterator.next().value;
      if (!chunk) {
        break;
      }
      savingChunks.push(chunk);
    }
    if (!savingChunks.length) {
      return;
    }

    const requestPayload: ChunkUpdateData[] = [];

    for (const chunk of savingChunks) {
      registeredChunks.delete(chunk);
      const foregroundData = await canvasToBlob(chunk.canvases.foreground);

      requestPayload.push({
        worldId: chunk.world.id,
        x: chunk.x * Chunk.RESOLUTION,
        y: chunk.y * Chunk.RESOLUTION,
        foregroundData
        //backgroundData: chunkData.saveBackground ? await canvasToBlob(chunkData.chunk.canvases.background) : undefined
      });
    }

    /*for (const chunk of savingChunks) { //moved inside above loop
      registeredChunks.delete(chunk);
    }*/
    //console.log('updating chunks:', requestPayload.length);
    await API.updateChunks(requestPayload).catch(e => {
      if (e === CustomError.TIMEOUT) {
        //try again
        for (const chunk of savingChunks) {
          registeredChunks.add(chunk);
        }
      }
    });

    queueTimeout = setTimeout(setQueueTimeout, 1000 / 10);
  }

  return {
    registerChunk(chunkToSave: Chunk) {
      registeredChunks.add(chunkToSave);

      if (!queueTimeout) {
        queueTimeout = setTimeout(setQueueTimeout, 1000 / 60);
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
  private data: Buffer | null = null;
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

  private bufferToImage(buffer: Buffer): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.width = img.height = Chunk.RESOLUTION;
      img.onload = () => resolve(img);
      img.onerror = reject;

      const Reader = new FileReader();
      Reader.onerror = reject;
      Reader.onload = () => (img.src = Reader.result as string);
      Reader.readAsDataURL(new Blob([buffer]));
    });
  }

  setData(arrayBuffer: ArrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    let restored = true;
    for (let i = 0; i < STAMP.length; i++) {
      if (STAMP[i] !== dataView.getUint8(i)) {
        restored = false;
        break;
      }
    }
    this.restored = restored;

    if (restored) {
      this.data = Buffer.from(arrayBuffer) as Buffer;

      this.updateFlags.needForegroundTextureUpdate = true;

      this.loaded = true;
      postGenerateQueue.registerChunk(this);
    } else {
      this.data = (new Float32Array(arrayBuffer) as unknown) as Buffer;
      const foregroundOffset = Chunk.RESOLUTION * Chunk.RESOLUTION;

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

  public async postGenerate() {
    if (!this.data || !this.loaded) {
      return;
    }

    if (!this.restored) {
      const foregroundOffset = Chunk.RESOLUTION * Chunk.RESOLUTION;

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
        }
        if (this.foregroundImgData.data[i * 4 + 3] > 0) {
          for (let c = 0; c < 3; c++) {
            this.foregroundImgData.data[i * 4 + c] =
              (mix(Biomes[biomeF].foreground.buffer[c], Biomes[nextBiomeF].foreground.buffer[c], mixFactorF) * 255) | 0;
          }
        }

        //this.backgroundImgData.data[i * 4 + 3] = 255; //this.data[i] < 0 ? 255 : 0; //this.data[i] & 0x80 ? 255 : 0; //255;
        //this.foregroundImgData.data[i * 4 + 3] = this.data[i + foregroundOffset] & 0x80 ? 255 : 0;
      }

      this.updateCanvases();
      //saveQueue.registerChunk({ chunk: this, saveBackground: true });
    } else {
      const bgData = new Float32Array(
        this.data.buffer.slice(STAMP.length, STAMP.length + Chunk.RESOLUTION * Chunk.RESOLUTION * 4)
      );

      for (let i = 0; i < Chunk.RESOLUTION * Chunk.RESOLUTION; i++) {
        const valueB = bgData[i];
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

      ////////////////////////////////////////////////////
      const foregroundOffset = STAMP.length + Chunk.RESOLUTION * Chunk.RESOLUTION * 4;

      this.bufferToImage(this.data.subarray(foregroundOffset)).then(img => {
        this.context.foreground.clearRect(0, 0, Chunk.RESOLUTION, Chunk.RESOLUTION);
        this.context.foreground.globalCompositeOperation = 'source-over';
        this.context.foreground.drawImage(img, 0, 0);
        this.foregroundImgData = this.context.foreground.getImageData(0, 0, Chunk.RESOLUTION, Chunk.RESOLUTION);

        this.context.foreground.globalCompositeOperation = 'destination-out';

        this.updateFlags.needForegroundTextureUpdate = true;
        this.loaded = true;
      });
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

  isRestored() {
    return this.restored;
  }

  static clampPos(x: number, y: number) {
    const xInt = (x / Chunk.SIZE / 2) | 0;
    const yInt = (y / Chunk.SIZE / 2) | 0;

    return new Vec2(xInt, yInt);
  }
}
