import Camera from './camera';
import API from '../common/api';
import Chunk from './chunk';
import { Updatable } from './updatable';
import Vec2 from '../common/math/vec2';
import Player from './player';
import { debugLine } from '../debugger';

const CHUNKS_DISTANCE = 5; //the number of chunks loaded in each direction from camera center

export default class WorldMap implements Updatable {
  private startPos: Vec2;

  private cam: Camera;
  private targetPlayer: Player | null = null;
  private _chunks: Chunk[] = [];

  private objects: Updatable[] = [];

  private chunksBounds = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };

  constructor(startX?: number, startY?: number) {
    this.startPos = new Vec2(startX || 0, startY || 0);

    console.log(`Map starting point: [${this.startPos.x}, ${this.startPos.y}]`);

    this.cam = new Camera(startX, startY);
    // this.cam.setPos(this.startPos.x, this.startPos.y, false);
    //this.cam.follow(new Vec3(this.startPos.x, this.startPos.y, 1), Math.PI / 2, false);

    //this.lightSources.push(new LightSource(this.startPos.x, this.startPos.y, 8, 0xffffff));

    const startChunkPos = Chunk.clampPos(this.startPos);
    this.chunksBounds.left = startChunkPos.x - Chunk.RESOLUTION * CHUNKS_DISTANCE;
    this.chunksBounds.right = startChunkPos.x + Chunk.RESOLUTION * CHUNKS_DISTANCE;
    this.chunksBounds.top = startChunkPos.y + Chunk.RESOLUTION * CHUNKS_DISTANCE;
    this.chunksBounds.bottom = startChunkPos.y - Chunk.RESOLUTION * CHUNKS_DISTANCE;

    this.reloadChunks().catch(console.error);
  }

  get chunks() {
    return this._chunks;
  }

  private async reloadChunks() {
    //cleanup previous chunks
    this._chunks.forEach(chunk => chunk.destroy());
    this._chunks = [];

    //load new set of visible chunks
    for (let y = this.chunksBounds.bottom; y <= this.chunksBounds.top; y += Chunk.RESOLUTION) {
      for (let x = this.chunksBounds.left; x <= this.chunksBounds.right; x += Chunk.RESOLUTION) {
        this.loadChunk(x, y).catch(() => {});
      }
    }
  }

  private loadChunksColumn(x: number) {
    for (let y = this.chunksBounds.bottom; y <= this.chunksBounds.top; y += Chunk.RESOLUTION) {
      this.loadChunk(x, y).catch(() => {});
    }
  }

  private unloadChunksColumn(x: number) {
    for (let y = this.chunksBounds.bottom; y <= this.chunksBounds.top; y += Chunk.RESOLUTION) {
      this.unloadChunk(x, y);
    }
  }

  private loadChunksRow(y: number) {
    for (let x = this.chunksBounds.left; x <= this.chunksBounds.right; x += Chunk.RESOLUTION) {
      this.loadChunk(x, y).catch(() => {});
    }
  }

  private unloadChunksRow(y: number) {
    for (let x = this.chunksBounds.left; x <= this.chunksBounds.right; x += Chunk.RESOLUTION) {
      this.unloadChunk(x, y);
    }
  }

  private async loadChunk(x: number, y: number) {
    //TODO
    const chunk = new Chunk(x, y);
    this._chunks.push(chunk);
    const chunkData = await API.fetchChunk(x, y, Chunk.RESOLUTION);
    chunk.setData(chunkData);
    /*chunkData.blocks.forEach(block => {
      chunk.objects.push(new Block(chunkData.x + block.x, chunkData.y + block.y));
    });*/

    //test
    /*const canv = document.createElement('canvas');
    canv.width = canv.height = Chunk.DEFAULT_RESOLUTION;
    const ctx = canv.getContext('2d', { alpha: false });
    const imgData = new ImageData(canv.width, canv.height);
    for (let i = 0; i < canv.width * canv.height; i++) {
      imgData.data[i * 4 + 0] = chunk.data[i];
      imgData.data[i * 4 + 1] = chunk.data[i];
      imgData.data[i * 4 + 2] = chunk.data[i];
      imgData.data[i * 4 + 3] = 255;
    }
    ctx?.putImageData(imgData, 0, 0);

    canv.style.position = 'fixed';
    canv.style.left = `${(x + window.innerWidth / 2) | 0}px`;
    canv.style.top = `${(y + window.innerHeight / 2) | 0}px`;

    document.body.appendChild(canv);*/
  }

  private unloadChunk(x: number, y: number) {
    const chunkIndex = this._chunks.findIndex(chunk => chunk.x === x && chunk.y === y);
    if (chunkIndex !== -1) {
      this._chunks[chunkIndex].destroy();
      this._chunks.splice(chunkIndex, 1);
    }
  }

  getCamera() {
    return this.cam;
  }

  zoom(factor: number) {
    this.cam.zoom(factor);
  }

  spawnPlayer(x: number, y: number, setAsTarget = false): Player {
    const player = new Player(x, y);
    this.addObject(player);

    if (setAsTarget || !this.targetPlayer) {
      this.targetPlayer = player;
    }

    return player;
  }

  getTargetPlayer() {
    return this.targetPlayer;
  }

  addObject(object: Updatable) {
    this.objects.push(object);
  }

  private updateChunks() {
    if (!this.targetPlayer) return;

    const playerChunkPos = Chunk.clampPos(this.targetPlayer);

    //horizontal
    while (playerChunkPos.x - Chunk.RESOLUTION * CHUNKS_DISTANCE < this.chunksBounds.left) {
      this.chunksBounds.left -= Chunk.RESOLUTION;
      this.loadChunksColumn(this.chunksBounds.left);
    }
    while (playerChunkPos.x + Chunk.RESOLUTION * CHUNKS_DISTANCE > this.chunksBounds.right) {
      this.chunksBounds.right += Chunk.RESOLUTION;
      this.loadChunksColumn(this.chunksBounds.right);
    }

    while (playerChunkPos.x - Chunk.RESOLUTION * CHUNKS_DISTANCE > this.chunksBounds.left + Chunk.RESOLUTION) {
      this.unloadChunksColumn(this.chunksBounds.left);
      this.chunksBounds.left += Chunk.RESOLUTION;
    }
    while (playerChunkPos.x + Chunk.RESOLUTION * CHUNKS_DISTANCE < this.chunksBounds.right - Chunk.RESOLUTION) {
      this.unloadChunksColumn(this.chunksBounds.right);
      this.chunksBounds.right -= Chunk.RESOLUTION;
    }

    //vertical
    while (playerChunkPos.y - Chunk.RESOLUTION * CHUNKS_DISTANCE < this.chunksBounds.bottom) {
      this.chunksBounds.bottom -= Chunk.RESOLUTION;
      this.loadChunksRow(this.chunksBounds.bottom);
    }
    while (playerChunkPos.y + Chunk.RESOLUTION * CHUNKS_DISTANCE > this.chunksBounds.top) {
      this.chunksBounds.top += Chunk.RESOLUTION;
      this.loadChunksRow(this.chunksBounds.top);
    }

    while (playerChunkPos.y - Chunk.RESOLUTION * CHUNKS_DISTANCE > this.chunksBounds.bottom + Chunk.RESOLUTION) {
      this.unloadChunksRow(this.chunksBounds.bottom);
      this.chunksBounds.bottom += Chunk.RESOLUTION;
    }
    while (playerChunkPos.y + Chunk.RESOLUTION * CHUNKS_DISTANCE < this.chunksBounds.top - Chunk.RESOLUTION) {
      this.unloadChunksRow(this.chunksBounds.top);
      this.chunksBounds.top -= Chunk.RESOLUTION;
    }

    debugLine(`chunks: ${this._chunks.length}`);
  }

  update(delta: number) {
    for (const object of this.objects) {
      object.update(delta);
    }

    if (this.targetPlayer) {
      this.cam.follow(this.targetPlayer, this.targetPlayer.getAngle());
    }
    this.cam.update(delta);

    this.updateChunks();
  }
}
