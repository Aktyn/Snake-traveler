import { SensorShapes } from './../physics/sensor';
import DynamicObject from './dynamicObject';
import { Updatable } from '../updatable';
import WorldMap from '../worldMap';
import HealthBar from './healthBar';

export default abstract class EnemyBase extends DynamicObject implements Updatable {
  public static instances = 0;

  protected readonly map: WorldMap;
  private readonly healthBar: HealthBar;
  public readonly strength: number = 0;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    map: WorldMap,
    shape: typeof SensorShapes[keyof typeof SensorShapes]
  ) {
    super(x, y, width, height, map.entities, shape);
    this.map = map;
    this.healthBar = new HealthBar(this, map.entities);
    EnemyBase.instances++;
  }

  destroy() {
    EnemyBase.instances--;
    this.healthBar.destroy();
  }

  get alive() {
    return this.healthBar.value > 0;
  }

  onHit(damage: number): void {
    if ((this.healthBar.value -= damage) <= 0) {
      this.deleted = true;
    }
  }

  update(delta: number) {
    if (this.map.isOutOfChunksGrid(this)) {
      this.deleted = true;
      return;
    }

    this.healthBar.update(delta);
  }
}
