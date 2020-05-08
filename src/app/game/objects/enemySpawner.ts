import DynamicObject from './dynamicObject';
import { Updatable } from '../updatable';
import { SensorShapes } from '../physics/sensor';
import { Palette } from '../../common/colors';
import WorldMap from '../worldMap';

const GROW_DURATION = 1;
const SHRINK_DURATION = 1;
const LIFETIME = 32;

export default class EnemySpawner extends DynamicObject implements Updatable {
  public static spawners = 0;

  public static readonly entityName = 'enemySpawner';
  public static readonly defaultSize = 0.15;

  private readonly map: WorldMap;
  private growTimer = 0;
  private shrinkTimer = 0;
  private lifeTimer = 0;

  constructor(x: number, y: number, map: WorldMap) {
    super(x, y, 1, 1, map.entities, SensorShapes.CIRCLE);
    super.setScale(0, 0);
    this.map = map;
    super.color = Palette.ENEMY_SPAWNER;

    this.entities.addObject(EnemySpawner.entityName, this);
    EnemySpawner.spawners++;
  }

  destroy() {
    this.entities.removeObject(EnemySpawner.entityName, this);
    EnemySpawner.spawners--;
  }

  update(delta: number) {
    if (this.map.isOutOfChunksGrid(this)) {
      this.deleted = true;
      return;
    }

    if ((this.lifeTimer += delta) > LIFETIME) {
      if (this.shrinkTimer < SHRINK_DURATION) {
        this.shrinkTimer += delta;
        const scale = Math.max(0, 1 - this.shrinkTimer / SHRINK_DURATION) * EnemySpawner.defaultSize;
        super.setScale(scale, scale);
      } else {
        this.deleted = true;
        return;
      }
    }

    if (this.growTimer < GROW_DURATION) {
      this.growTimer += delta;
      const scale = Math.min(1, this.growTimer / GROW_DURATION) * EnemySpawner.defaultSize;
      super.setScale(scale, scale);
    }
  }
}
