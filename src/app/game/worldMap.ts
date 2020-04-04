import Camera from './camera';
import API from '../common/api';
import Chunk, { postGenerateQueue } from './chunk';
import { Updatable } from './updatable';
import Vec2 from '../common/math/vec2';
import Player from './player';
import Entities from './entities';
import { debugLine } from '../debugger';
import CollisionDetector from './collisionDetector';
import DynamicObject from './dynamicObject';
import ObjectBase from './objectBase';
import Bullet from './bullet';
import Painter from './painter';
import { WorldSchema } from '../common/schemas';

const getEmptyChunksGrid = (): Chunk[][] =>
  new Array(Chunk.GRID_SIZE_X * 2 + 1).fill(null).map(col => new Array(Chunk.GRID_SIZE_Y * 2 + 1).fill(null));

export default class WorldMap extends CollisionDetector implements Updatable {
  public readonly entities: Entities;
  private readonly world: WorldSchema;

  private cam: Camera;
  private targetPlayer: Player | null = null;

  private centerChunkPos: Vec2;
  private chunksGrid: Chunk[][] = getEmptyChunksGrid();
  private readonly painter = new Painter();

  private objects: Updatable[] = [];
  private dynamicObjects: DynamicObject[] = [];

  constructor(world: WorldSchema, startX = 0, startY = 0, onLoad: (map: WorldMap) => void) {
    super();
    this.entities = new Entities();
    this.world = world;
    postGenerateQueue.registerBatchLoad(() => onLoad(this));

    this.centerChunkPos = Chunk.clampPos(startX | 0, -(startY | 0));

    console.log(`Map starting point: [${this.centerChunkPos.x}, ${this.centerChunkPos.y}]`);

    this.cam = new Camera(this.centerChunkPos.x * Chunk.SIZE * 2, -this.centerChunkPos.y * Chunk.SIZE * 2);

    this.reloadChunks().catch(console.error);
  }

  getCenter() {
    return new Vec2(this.centerChunkPos.x * Chunk.SIZE * 2, -this.centerChunkPos.y * Chunk.SIZE * 2);
  }

  get chunks() {
    return this.chunksGrid;
  }

  get chunksGridLeft() {
    return this.centerChunkPos.x - Chunk.GRID_SIZE_X;
  }

  get chunksGridBottom() {
    return this.centerChunkPos.y - Chunk.GRID_SIZE_Y;
  }

  get camera() {
    return this.cam;
  }

  private async reloadChunks() {
    //cleanup previous chunks
    this.chunksGrid.forEach(col => col.forEach(chunk => chunk?.destroy()));
    this.chunksGrid = getEmptyChunksGrid();

    //load new set of visible chunks
    const left = this.chunksGridLeft;
    const bottom = this.chunksGridBottom;

    /*for (let x = 0; x < this.chunksGrid.length; x++) {
      const column = this.chunksGrid[x];
      for (let y = 0; y < column.length; y++) {
        column[y] = this.loadChunkAsync(left + x * Chunk.RESOLUTION, bottom + y * Chunk.RESOLUTION);
      }
    }*/

    //new method of loading (load chunks from center spirally)
    let x = Chunk.GRID_SIZE_X;
    let y = Chunk.GRID_SIZE_Y;

    let x_step = 1;
    let y_step = 1;

    let dirX = 1;
    let dirY = -1;

    while (true) {
      const withinYBounds = y >= 0 && y < Chunk.GRID_SIZE_Y * 2 + 1;
      if (withinYBounds) {
        for (let xx = 0; xx < x_step; xx++) {
          if (x >= 0 && x < Chunk.GRID_SIZE_X * 2 + 1) {
            this.chunksGrid[x][y] = this.loadChunkAsync(left + x, bottom + y);
          }
          x += dirX;
        }
      } else {
        x += dirX * x_step;
      }

      const withinXBounds = x >= 0 && x < Chunk.GRID_SIZE_X * 2 + 1;
      if (withinXBounds) {
        for (let yy = 0; yy < y_step; yy++) {
          if (y >= 0 && y < Chunk.GRID_SIZE_Y * 2 + 1) {
            this.chunksGrid[x][y] = this.loadChunkAsync(left + x, bottom + y);
          }
          y += dirY;
        }
      } else {
        y += dirY * y_step;
      }

      if (!withinXBounds && !(y >= 0 && y <= Chunk.GRID_SIZE_Y * 2 + 1)) {
        break;
      }

      x_step++;
      y_step++;

      dirX = -dirX;
      dirY = -dirY;
    }
  }

  private loadChunkAsync(x: number, y: number) {
    const chunk = new Chunk(x, y, this.world);

    API.fetchChunk(this.world.id, x * Chunk.RESOLUTION, y * Chunk.RESOLUTION, Chunk.RESOLUTION)
      .then(chunkData => chunk.setData(chunkData))
      .catch(e => {
        console.log(e);
        chunk.destroy();
      });

    return chunk;
  }

  private moveGrid(dirX: 1 | -1 | 0, dirY: 1 | -1 | 0) {
    const left = this.chunksGridLeft;
    const bottom = this.chunksGridBottom;

    if (dirX === -1) {
      this.chunksGrid.pop()?.forEach(chunk => chunk.destroy()); //unload and remove right column
      const leftCol = new Array(Chunk.GRID_SIZE_Y * 2 + 1).fill(null).map((_, y) => {
        return this.loadChunkAsync(left - 1, bottom + y);
      });
      this.chunksGrid.unshift(leftCol); //add new column to the left side
    }

    if (dirX === 1) {
      this.chunksGrid.shift()?.forEach(chunk => chunk.destroy()); //unload and remove left column
      const rightCol = new Array(Chunk.GRID_SIZE_Y * 2 + 1).fill(null).map((_, y) => {
        return this.loadChunkAsync(this.centerChunkPos.x + Chunk.GRID_SIZE_X + 1, bottom + y);
      });
      this.chunksGrid.push(rightCol); //add new column to the right side
    }

    if (dirY === -1) {
      this.chunksGrid.forEach((column, x) => {
        column.pop()?.destroy(); //unload top row
        const chunk = this.loadChunkAsync(left + x, bottom - 1); //load bottom row
        column.unshift(chunk);
      });
    }

    if (dirY === 1) {
      this.chunksGrid.forEach((column, x) => {
        column.shift()?.destroy(); //unload bottom row
        const chunk = this.loadChunkAsync(left + x, this.centerChunkPos.y + Chunk.GRID_SIZE_Y + 1); //load top row
        column.push(chunk);
      });
    }

    this.centerChunkPos.add(dirX, dirY);
  }

  getCamera() {
    return this.cam;
  }

  zoom(factor: number) {
    this.cam.zoom(factor);
  }

  spawnPlayer(pos: Vec2, setAsTarget = false): Player {
    const player = new Player(pos.x, pos.y, this);
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

    if (object instanceof DynamicObject) {
      this.dynamicObjects.push(object);
    }
  }

  removeObject(object: Updatable, i: number | undefined) {
    if (i === undefined) {
      i = this.objects.indexOf(object);
    }
    this.objects.splice(i, 1);

    if (object instanceof DynamicObject) {
      const index = this.dynamicObjects.indexOf(object);
      if (index !== -1) {
        this.dynamicObjects.splice(index, 1);
      }
    }
    ((object as unknown) as ObjectBase).destroy?.();
  }

  onPainterCollision(object: DynamicObject, collisionX: number, collisionY: number) {
    if (object instanceof Bullet) {
      this.painter.clearCircle(this.chunksGrid, this.centerChunkPos, collisionX, collisionY, Bullet.explosionRadius);
      object.deleted = true;
    } else {
      //if object is not a ghost and reacts with walls bouncing from them
      /*const bounceVector = */ super.bounceOutOfColor(object, this.chunks, this.centerChunkPos);
      //console.log('Object collided', bounceVector?.x, bounceVector?.y);
    }
  }

  private updateChunks() {
    if (!this.targetPlayer) return;

    const playerChunkPos = Chunk.clampPos(this.targetPlayer.x + Chunk.SIZE, -this.targetPlayer.y + Chunk.SIZE);

    while (playerChunkPos.x < this.centerChunkPos.x) {
      this.moveGrid(-1, 0);
    }
    while (playerChunkPos.x > this.centerChunkPos.x) {
      this.moveGrid(1, 0);
    }

    while (playerChunkPos.y < this.centerChunkPos.y) {
      this.moveGrid(0, -1);
    }
    while (playerChunkPos.y > this.centerChunkPos.y) {
      this.moveGrid(0, 1);
    }
  }

  update(delta: number) {
    for (let i = 0; i < this.objects.length; i++) {
      if (((this.objects[i] as unknown) as ObjectBase).deleted) {
        this.removeObject(this.objects[i], i);
        i--;
      } else {
        this.objects[i].update(delta);
      }
    }

    if (this.targetPlayer) {
      this.cam.follow(this.targetPlayer);
    }
    this.cam.update(delta);

    if (Chunk.loadingChunks === 0) {
      this.updateChunks();
    }

    super.detectCollisions(this.dynamicObjects, this.chunksGrid, this.centerChunkPos);

    debugLine(`Loading chunks: ${Chunk.loadingChunks}`);
    debugLine(`Updatable objects: ${this.objects.length}`);
    debugLine(`Dynamic objects: ${this.dynamicObjects.length}`);
  }
}
