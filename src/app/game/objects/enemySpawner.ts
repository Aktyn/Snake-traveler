import DynamicObject from './dynamicObject';
import { Updatable } from '../updatable';
import { SensorShapes } from '../physics/sensor';
import { Palette } from '../../common/colors';
import WorldMap from '../worldMap';
import SpikyEnemy from './spikyEnemy';
import EnemyBase from './enemyBase';
import Config from '../../common/config';

const SPAWN_FREQUENCY = 4;
const GROW_DURATION = 1;
const SHRINK_DURATION = 1;
const LIFETIME = 32;

export default class EnemySpawner extends DynamicObject implements Updatable {
  public static instances = 0;

  public static readonly entityName = 'enemySpawner';
  public static readonly defaultSize = 0.15;

  private readonly map: WorldMap;
  private growTimer = 0;
  private shrinkTimer = 0;
  private lifeTimer = 0;
  private spawnTimer = 0;

  constructor(x: number, y: number, map: WorldMap) {
    super(x, y, 0, 0, map.entities, SensorShapes.CIRCLE);
    this.map = map;
    super.color = Palette.ENEMY_SPAWNER;

    this.entities.addObject(EnemySpawner.entityName, this);
    EnemySpawner.instances++;
  }

  destroy() {
    this.entities.removeObject(EnemySpawner.entityName, this);
    EnemySpawner.instances--;
  }

  private spawnEnemy() {
    if (EnemyBase.instances < Config.MAXIMUM_ENEMIES) {
      this.map.addObject(new SpikyEnemy(this.x, this.y, this.map));
    }
  }

  update(delta: number) {
    if (this.map.isOutOfChunksGrid(this)) {
      this.deleted = true;
      return;
    }

    if (this.growTimer < GROW_DURATION) {
      this.growTimer += delta;
      const scale = Math.min(1, this.growTimer / GROW_DURATION) * EnemySpawner.defaultSize;
      super.setScale(scale, scale);
    } else if ((this.lifeTimer += delta) > LIFETIME - GROW_DURATION - SHRINK_DURATION) {
      if (this.shrinkTimer < SHRINK_DURATION) {
        this.shrinkTimer += delta;
        const scale = Math.max(0, 1 - this.shrinkTimer / SHRINK_DURATION) * EnemySpawner.defaultSize;
        super.setScale(scale, scale);
      } else {
        this.deleted = true;
        return;
      }
    } else {
      if ((this.spawnTimer += delta) >= SPAWN_FREQUENCY) {
        this.spawnTimer = 0;
        this.spawnEnemy();
      }
    }
  }
}
