import Camera from './camera';
import API from '../common/api';
import Chunk from './chunk';
import { Updatable } from './updatable';
import Vec2 from '../common/math/vec2';
import Player from './player';
import { debugLine } from '../debugger';
import Entities from './entities';

const CHUNKS_DISTANCE_Y = (0.5 / Chunk.SIZE + 2) | 0;
const CHUNKS_DISTANCE_X = CHUNKS_DISTANCE_Y * 2; //the number of chunks loaded in each direction from camera center

export default class WorldMap implements Updatable {
  public readonly entities: Entities;
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

  constructor(startX = 0, startY = 0) {
    this.entities = new Entities();
    this.startPos = new Vec2(startX, startY);

    console.log(`Map starting point: [${this.startPos.x}, ${this.startPos.y}]`);

    this.cam = new Camera(startX, startY);
    // this.cam.setPos(this.startPos.x, this.startPos.y, false);
    //this.cam.follow(, false);

    //this.lightSources.push(new LightSource(this.startPos.x, this.startPos.y, 8, 0xffffff));

    const startChunkPos = Chunk.clampPos(this.startPos.x, -this.startPos.y);
    this.chunksBounds.left = startChunkPos.x - Chunk.RESOLUTION * CHUNKS_DISTANCE_X;
    this.chunksBounds.right = startChunkPos.x + Chunk.RESOLUTION * CHUNKS_DISTANCE_X;
    this.chunksBounds.top = startChunkPos.y + Chunk.RESOLUTION * CHUNKS_DISTANCE_Y;
    this.chunksBounds.bottom = startChunkPos.y - Chunk.RESOLUTION * CHUNKS_DISTANCE_Y;

    this.reloadChunks().catch(console.error);
  }

  get chunks() {
    return this._chunks;
  }

  get camera() {
    return this.cam;
  }

  private async reloadChunks() {
    //cleanup previous chunks
    this._chunks.forEach(chunk => chunk.destroy());
    this._chunks = [];

    //load new set of visible chunks
    /*for (let y = this.chunksBounds.bottom; y <= this.chunksBounds.top; y += Chunk.RESOLUTION) {
      for (let x = this.chunksBounds.left; x <= this.chunksBounds.right; x += Chunk.RESOLUTION) {
        this.loadChunk(x, y).catch(() => {});
      }
    }*/

    //new method of loading (load chunks from center spirally)
    let x = ((this.chunksBounds.right + this.chunksBounds.left) / 2) | 0;
    let y = ((this.chunksBounds.top + this.chunksBounds.bottom) / 2) | 0;

    let x_step = 1;
    let y_step = 1;

    let dirX = 1;
    let dirY = -1;

    const bounds = this.chunksBounds;
    while (true) {
      const withinYBounds = y >= bounds.bottom && y <= bounds.top;
      if (withinYBounds) {
        for (let xx = 0; xx < x_step; xx++) {
          if (x >= bounds.left && x <= bounds.right) {
            this.loadChunk(x, y).catch(() => {});
          }
          x += Chunk.RESOLUTION * dirX;
        }
      } else {
        x += Chunk.RESOLUTION * dirX * x_step;
      }

      const withinXBounds = x >= this.chunksBounds.left && x <= this.chunksBounds.right;
      if (withinXBounds) {
        for (let yy = 0; yy < y_step; yy++) {
          if (y >= this.chunksBounds.bottom && y <= this.chunksBounds.top) {
            this.loadChunk(x, y).catch(() => {});
          }
          y += Chunk.RESOLUTION * dirY;
        }
      } else {
        y += Chunk.RESOLUTION * dirY * y_step;
      }

      if (!withinXBounds && !(y >= bounds.bottom && y <= bounds.top)) {
        break;
      }

      x_step++;
      y_step++;

      dirX = -dirX;
      dirY = -dirY;
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
    const chunk = new Chunk(x, y);
    this._chunks.push(chunk);
    const chunkData = await API.fetchChunk(x, y, Chunk.RESOLUTION);
    chunk.setData(chunkData);
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
    const player = new Player(x, y, this.entities);
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

    const playerChunkPos = Chunk.clampPos(this.targetPlayer.x, -this.targetPlayer.y);

    //horizontal
    while (playerChunkPos.x - Chunk.RESOLUTION * CHUNKS_DISTANCE_X < this.chunksBounds.left) {
      this.chunksBounds.left -= Chunk.RESOLUTION;
      this.loadChunksColumn(this.chunksBounds.left);
    }
    while (playerChunkPos.x + Chunk.RESOLUTION * CHUNKS_DISTANCE_X > this.chunksBounds.right) {
      this.chunksBounds.right += Chunk.RESOLUTION;
      this.loadChunksColumn(this.chunksBounds.right);
    }

    while (playerChunkPos.x - Chunk.RESOLUTION * CHUNKS_DISTANCE_X > this.chunksBounds.left + Chunk.RESOLUTION) {
      this.unloadChunksColumn(this.chunksBounds.left);
      this.chunksBounds.left += Chunk.RESOLUTION;
    }
    while (playerChunkPos.x + Chunk.RESOLUTION * CHUNKS_DISTANCE_X < this.chunksBounds.right - Chunk.RESOLUTION) {
      this.unloadChunksColumn(this.chunksBounds.right);
      this.chunksBounds.right -= Chunk.RESOLUTION;
    }

    //vertical
    while (playerChunkPos.y - Chunk.RESOLUTION * CHUNKS_DISTANCE_Y < this.chunksBounds.bottom) {
      this.chunksBounds.bottom -= Chunk.RESOLUTION;
      this.loadChunksRow(this.chunksBounds.bottom);
    }
    while (playerChunkPos.y + Chunk.RESOLUTION * CHUNKS_DISTANCE_Y > this.chunksBounds.top) {
      this.chunksBounds.top += Chunk.RESOLUTION;
      this.loadChunksRow(this.chunksBounds.top);
    }

    while (playerChunkPos.y - Chunk.RESOLUTION * CHUNKS_DISTANCE_Y > this.chunksBounds.bottom + Chunk.RESOLUTION) {
      this.unloadChunksRow(this.chunksBounds.bottom);
      this.chunksBounds.bottom += Chunk.RESOLUTION;
    }
    while (playerChunkPos.y + Chunk.RESOLUTION * CHUNKS_DISTANCE_Y < this.chunksBounds.top - Chunk.RESOLUTION) {
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
      this.cam.follow(this.targetPlayer);
    }
    this.cam.update(delta);

    this.updateChunks();
  }
}
