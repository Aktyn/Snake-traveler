import Camera from './camera';
import API from '../common/api';
import Chunk from './chunk';
import Block from './block';
import LightSource from './lightSource';
import { Updatable } from './updatable';
import Vec2 from '../common/math/vec2';
import core from './core';
import Player from './player';
import Vec3 from '../common/math/vec3';

const CHUNKS_DISTANCE = 2; //the number of chunks loaded in each direction from camera center

export default class WorldMap implements Updatable {
  private startPos: Vec2;

  private cam: Camera;
  private targetPlayer: Player | null = null;
  private chunks: Chunk[] = [];
  private lightSources: LightSource[] = [];

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
    this.cam.follow(new Vec3(this.startPos.x, this.startPos.y, 1), Math.PI / 2, false);

    this.lightSources.push(new LightSource(this.startPos.x, this.startPos.y, 8, 0xffffff));

    const startChunkPos = Chunk.clampPos(this.startPos);
    this.chunksBounds.left = startChunkPos.x - Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE;
    this.chunksBounds.right = startChunkPos.x + Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE;
    this.chunksBounds.top = startChunkPos.y + Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE;
    this.chunksBounds.bottom = startChunkPos.y - Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE;

    this.reloadChunks().catch(console.error);
  }

  private async reloadChunks() {
    //cleanup previous chunks
    this.chunks.forEach(chunk => chunk.destroy());
    this.chunks = [];

    //load new set of visible chunks
    for (let y = this.chunksBounds.bottom; y <= this.chunksBounds.top; y += Chunk.DEFAULT_SIZE) {
      for (let x = this.chunksBounds.left; x <= this.chunksBounds.right; x += Chunk.DEFAULT_SIZE) {
        this.loadChunk(x, y).catch(() => {});
      }
    }
  }

  private loadChunksColumn(x: number) {
    for (let y = this.chunksBounds.bottom; y <= this.chunksBounds.top; y += Chunk.DEFAULT_SIZE) {
      this.loadChunk(x, y).catch(() => {});
    }
  }

  private unloadChunksColumn(x: number) {
    for (let y = this.chunksBounds.bottom; y <= this.chunksBounds.top; y += Chunk.DEFAULT_SIZE) {
      this.unloadChunk(x, y);
    }
  }

  private loadChunksRow(y: number) {
    for (let x = this.chunksBounds.left; x <= this.chunksBounds.right; x += Chunk.DEFAULT_SIZE) {
      this.loadChunk(x, y).catch(() => {});
    }
  }

  private unloadChunksRow(y: number) {
    for (let x = this.chunksBounds.left; x <= this.chunksBounds.right; x += Chunk.DEFAULT_SIZE) {
      this.unloadChunk(x, y);
    }
  }

  private async loadChunk(x: number, y: number) {
    const chunk = new Chunk(x, y);
    this.chunks.push(chunk);
    const chunkData = await API.fetchChunk(x, y, Chunk.DEFAULT_SIZE);

    chunkData.blocks.forEach(block => {
      chunk.objects.push(new Block(chunkData.x + block.x, chunkData.y + block.y, block.z, block.type));
    });

    chunk.loaded = true;
  }

  private unloadChunk(x: number, y: number) {
    const chunkIndex = this.chunks.findIndex(chunk => chunk.x === x && chunk.y === y);
    if (chunkIndex !== -1) {
      this.chunks[chunkIndex].destroy();
      this.chunks.splice(chunkIndex, 1);
    }
  }

  getCamera() {
    return this.cam;
  }

  zoom(factor: number) {
    this.cam.zoom(factor);
  }

  spawnPlayer(x: number, y: number, setAsTarget = false): Player {
    const player = new Player(x, y, 1);
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
    while (playerChunkPos.x - Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE < this.chunksBounds.left) {
      this.chunksBounds.left -= Chunk.DEFAULT_SIZE;
      this.loadChunksColumn(this.chunksBounds.left);
    }
    while (playerChunkPos.x + Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE > this.chunksBounds.right) {
      this.chunksBounds.right += Chunk.DEFAULT_SIZE;
      this.loadChunksColumn(this.chunksBounds.right);
    }

    while (playerChunkPos.x - Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE > this.chunksBounds.left + Chunk.DEFAULT_SIZE) {
      this.unloadChunksColumn(this.chunksBounds.left);
      this.chunksBounds.left += Chunk.DEFAULT_SIZE;
    }
    while (playerChunkPos.x + Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE < this.chunksBounds.right - Chunk.DEFAULT_SIZE) {
      this.unloadChunksColumn(this.chunksBounds.right);
      this.chunksBounds.right -= Chunk.DEFAULT_SIZE;
    }

    //vertical
    while (playerChunkPos.y - Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE < this.chunksBounds.bottom) {
      this.chunksBounds.bottom -= Chunk.DEFAULT_SIZE;
      this.loadChunksRow(this.chunksBounds.bottom);
    }
    while (playerChunkPos.y + Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE > this.chunksBounds.top) {
      this.chunksBounds.top += Chunk.DEFAULT_SIZE;
      this.loadChunksRow(this.chunksBounds.top);
    }

    while (playerChunkPos.y - Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE > this.chunksBounds.bottom + Chunk.DEFAULT_SIZE) {
      this.unloadChunksRow(this.chunksBounds.bottom);
      this.chunksBounds.bottom += Chunk.DEFAULT_SIZE;
    }
    while (playerChunkPos.y + Chunk.DEFAULT_SIZE * CHUNKS_DISTANCE < this.chunksBounds.top - Chunk.DEFAULT_SIZE) {
      this.unloadChunksRow(this.chunksBounds.top);
      this.chunksBounds.top -= Chunk.DEFAULT_SIZE;
    }

    core.debug(`chunks: ${this.chunks.length}`);
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
