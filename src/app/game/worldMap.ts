import Camera from './objects/camera';
import API, { CustomError } from '../common/api';
import Chunk, { postGenerateQueue, saveQueue } from './chunk';
import { Updatable } from './updatable';
import Vec2 from '../common/math/vec2';
import Player from './objects/player';
import Entities from './entities';
import { debugLine } from '../debugger';
import CollisionDetector from './collisionDetector';
import DynamicObject from './objects/dynamicObject';
import ObjectBase from './objects/objectBase';
import Bullet from './objects/bullet';
import Painter from './painter';
import { WorldSchema } from '../common/schemas';

import EnemySpawner from './objects/enemySpawner';
import PlayerSegment from './objects/playerSegment';
import EnemyBase from './objects/enemyBase';
import SpikyEnemy from './objects/spikyEnemy';
import PlayerBullet from './objects/playerBullet';
import SpikeBullet from './objects/spikeBullet';
import { AppContextSchema } from '../main/App';

type Class = { new (...args: any[]): any };

const WORLD_DATA_UPDATE_FREQUENCY = 5; //seconds

interface ChunkToSave {
  chunk: Chunk;
  saveBackground?: boolean;
}

interface SyncWorkerI extends Worker {
  run: () => void;
  registerChunkToSave: (chunkToSave: ChunkToSave) => void;
}

const getEmptyChunksGrid = (): Chunk[][] =>
  new Array(Chunk.GRID_SIZE_X * 2 + 1).fill(null).map(col => new Array(Chunk.GRID_SIZE_Y * 2 + 1).fill(null));

export default class WorldMap extends CollisionDetector implements Updatable {
  public readonly entities: Entities;
  private readonly world: WorldSchema;

  private _context: AppContextSchema;

  private cam: Camera;
  private targetPlayer: Player | null = null;
  private worldDataUpdateTimer = 0;

  private readonly centerChunkPos: Vec2;
  private chunksGrid: Chunk[][] = getEmptyChunksGrid();
  private readonly painter = new Painter();

  private objects: Updatable[] = [];
  private dynamicObjects: DynamicObject[] = [];

  constructor(world: WorldSchema, context: AppContextSchema, onLoad: (map: WorldMap) => void) {
    super();
    this.entities = new Entities();
    this.world = world;
    this._context = context;
    postGenerateQueue.registerBatchLoad(() => onLoad(this));

    this.centerChunkPos = Chunk.clampPos(world.data.playerX, -world.data.playerY);

    console.log(`Map starting point: [${this.centerChunkPos.x}, ${this.centerChunkPos.y}]`);

    this.cam = new Camera(this.centerChunkPos.x * Chunk.SIZE * 2, -this.centerChunkPos.y * Chunk.SIZE * 2);

    this.reloadChunks().catch(console.error);
  }

  destroy() {
    //this.synchronizeWorldData();

    this.objects.forEach(obj => obj instanceof ObjectBase && obj.destroy());
    this.objects = [];

    this.dynamicObjects.forEach(obj => obj.destroy());
    this.dynamicObjects = [];

    saveQueue.finalize().finally(() => {
      this.chunksGrid.forEach(col => col.forEach(chunk => chunk?.destroy()));
      this.chunksGrid = [];
    });

    this.entities.destroy();
  }

  get context() {
    return this._context;
  }

  setContext(context: AppContextSchema) {
    this._context = context;
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

  get chunksGridRight() {
    return this.centerChunkPos.x + Chunk.GRID_SIZE_X;
  }

  get chunksGridTop() {
    return this.centerChunkPos.y + Chunk.GRID_SIZE_Y;
  }

  get camera() {
    return this.cam;
  }

  private getRandomChunk() {
    const col = this.chunksGrid[(this.chunksGrid.length * Math.random()) | 0];
    return col[(col.length * Math.random()) | 0];
  }

  //returns random point restricted to loaded chunks
  getRandomSpot() {
    const maxTries = this.chunks.length ** 2;
    for (let i = 0; i < maxTries; i++) {
      const chunk = this.getRandomChunk();
      if (chunk.isLoaded()) {
        return new Vec2(
          chunk.matrix.x + chunk.matrix.width * (Math.random() * 2 - 1),
          chunk.matrix.y + chunk.matrix.height * (Math.random() * 2 - 1)
        );
      }
    }
    return new Vec2();
  }

  isOutOfChunksGrid(object: ObjectBase) {
    return (
      this.chunksGridLeft * Chunk.SIZE * 2 > object.x - object.width ||
      (this.chunksGridRight + 1) * Chunk.SIZE * 2 < object.x + object.width ||
      -this.chunksGridBottom * Chunk.SIZE * 2 < object.y + object.height ||
      -(this.chunksGridTop + 1) * Chunk.SIZE * 2 > object.y - object.height
    );
  }

  private async reloadChunks() {
    //cleanup previous chunks
    this.chunksGrid.forEach(col => col.forEach(chunk => chunk?.destroy()));
    this.chunksGrid = getEmptyChunksGrid();

    //load new set of visible chunks
    const left = this.chunksGridLeft;
    const bottom = this.chunksGridBottom;

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

  private loadChunkAsync(x: number, y: number, _chunk?: Chunk) {
    const chunk = _chunk || new Chunk(x, y, this.world);

    API.fetchChunk(this.world.id, x * Chunk.RESOLUTION, y * Chunk.RESOLUTION, Chunk.RESOLUTION)
      .then(chunkData => chunk.setData(chunkData))
      .catch(e => {
        if (e === CustomError.TIMEOUT) {
          this.loadChunkAsync(x, y, chunk); //try again
          return;
        }
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

  spawnPlayer(posX: number, posY: number, rot: number, setAsTarget = false): Player {
    const player = new Player(posX, posY, rot, this);
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
      if (object.params.explosionRadius > 0) {
        this.painter.clearCircle(
          this.chunksGrid,
          this.centerChunkPos,
          collisionX,
          collisionY,
          object.params.explosionRadius
        );
      }
      object.deleted = true;
    } else {
      if (object instanceof SpikyEnemy) {
        (object as SpikyEnemy).resetRotation();
      }
      //if object is not a ghost and reacts with walls bouncing from them
      /*const bounceVector = */ super.bounceOutOfColor(object, this.chunks, this.centerChunkPos);
      //console.log('Object collided', bounceVector?.x, bounceVector?.y);
    }
  }

  private isObjectOfInstances(obj: ObjectBase, instances: Class[]) {
    return instances.some(instance => obj instanceof instance);
  }

  private objectsAreInstances(objA: ObjectBase, objB: ObjectBase, instances1: Class[], instances2: Class[]) {
    return (
      (this.isObjectOfInstances(objA, instances1) && this.isObjectOfInstances(objB, instances2)) ||
      (this.isObjectOfInstances(objB, instances1) && this.isObjectOfInstances(objA, instances2))
    );
  }

  private getObjectOfInstance(instance: Class, ...objects: ObjectBase[]) {
    return objects.find(obj => obj instanceof instance);
  }

  private onBulletCollision(bullet: Bullet, otherObject: DynamicObject) {
    if (bullet instanceof PlayerBullet) {
      if (this.isObjectOfInstances(otherObject, [EnemyBase as never])) {
        const enemy = otherObject as EnemyBase;
        enemy.onHit(bullet.params.power);
        if (!enemy.alive) {
          this.context.setScore(score => score + 1);
        }
      }

      if (!this.isObjectOfInstances(otherObject, [PlayerSegment])) {
        bullet.deleted = true;
      }
    } else if (bullet instanceof SpikeBullet) {
      if (this.isObjectOfInstances(otherObject, [EnemyBase as never])) {
        return;
      }
      if (this.isObjectOfInstances(otherObject, [Player, PlayerSegment])) {
        (otherObject as Player | PlayerSegment).onHit(bullet.params.power);
      }

      bullet.deleted = true;
    }
  }

  //TODO: optimize by using object type enum instead of 'instance of' expression
  onDynamicObjectsCollision(object1: DynamicObject, object2: DynamicObject) {
    if (this.objectsAreInstances(object1, object2, [Player, PlayerSegment], [Player, PlayerSegment])) {
      return;
    }

    if (this.isObjectOfInstances(object1, [Bullet as never])) {
      this.onBulletCollision(object1 as never, object2);
      return;
    }

    if (this.isObjectOfInstances(object2, [Bullet as never])) {
      this.onBulletCollision(object2 as never, object1);
      return;
    }

    if (object1 instanceof SpikyEnemy) {
      (object1 as SpikyEnemy).resetRotation();
    }
    if (object2 instanceof SpikyEnemy) {
      (object2 as SpikyEnemy).resetRotation();
    }

    if (this.objectsAreInstances(object1, object2, [EnemyBase as never], [EnemySpawner])) {
      super.bounceDynamicObjects(
        object1,
        object2,
        this.isObjectOfInstances(object1, [EnemySpawner]),
        this.isObjectOfInstances(object2, [EnemySpawner])
      );
      return;
    }

    if (this.objectsAreInstances(object1, object2, [EnemyBase as never], [Player, PlayerSegment])) {
      const enemy = this.getObjectOfInstance(EnemyBase as never, object1, object2) as EnemyBase;
      enemy.deleted = true;

      const playerOrSegment = (enemy === object1 ? object2 : object1) as Player | PlayerSegment;
      playerOrSegment.onHit(enemy.strength);
      //TODO: blood effect from the screen edges when enemy hits/bumps on player
    }

    super.bounceDynamicObjects(object1, object2);
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

  private areNearbyChunksLoaded() {
    if (!this.targetPlayer) return false;

    for (let x = -2; x <= 1; x++) {
      for (let y = -2; y <= 1; y++) {
        if (!this.chunksGrid[Chunk.GRID_SIZE_X + x][Chunk.GRID_SIZE_Y + y].isPostGenerated()) {
          return false;
        }
      }
    }

    return true;
  }

  synchronizeWorldData() {
    this.world.data.playerHealth = this.context.playerHealth;
    this.world.data.score = this.context.score;
    this.world.data.playerX = this.targetPlayer?.x ?? 0;
    this.world.data.playerY = this.targetPlayer?.y ?? 0;
    this.world.data.playerRot = this.targetPlayer?.rot ?? 0;

    API.updateWorldData(this.world.id, this.world).catch(console.error);
  }

  update(delta: number) {
    const freezePhysics = !this.areNearbyChunksLoaded();
    if (!freezePhysics) {
      for (let i = 0; i < this.objects.length; i++) {
        if (((this.objects[i] as unknown) as ObjectBase).deleted) {
          this.removeObject(this.objects[i], i);
          i--;
        } else {
          this.objects[i].update(delta);
        }
      }

      if (this.targetPlayer) {
        if ((this.worldDataUpdateTimer += delta) >= WORLD_DATA_UPDATE_FREQUENCY) {
          this.worldDataUpdateTimer -= WORLD_DATA_UPDATE_FREQUENCY;
          this.synchronizeWorldData();
        }

        this.cam.follow(this.targetPlayer);
      }
      this.cam.update(delta);

      this.updateChunks();

      super.detectCollisions(this.dynamicObjects, this.chunksGrid, this.centerChunkPos);
    }

    debugLine(`Loading chunks: ${Chunk.loadingChunks}`);
    debugLine(`Updatable objects: ${this.objects.length}`);
    debugLine(`Enemy spawners: ${EnemySpawner.instances}`);
    debugLine(`Enemies: ${EnemyBase.instances}`);
    debugLine(`Dynamic objects: ${this.dynamicObjects.length}`);
  }
}
