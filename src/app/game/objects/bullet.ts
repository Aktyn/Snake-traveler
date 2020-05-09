import { SensorShapes } from '../physics/sensor';
import DynamicObject from './dynamicObject';
import { Updatable } from '../updatable';
import Entities from '../entities';
import { Palette } from '../../common/colors';

const BULLET_SIZE = 0.02;
const BULLET_SPEED = 1;
const BULLET_LIFETIME = 5;
const DEFAULT_BULLET_POWER = 0.2;

export default class Bullet extends DynamicObject implements Updatable {
  private static readonly entityName = 'player';
  public static readonly explosionRadius = 0.1;

  private timer = 0;
  public power = DEFAULT_BULLET_POWER;

  constructor(x: number, y: number, rot: number, entities: Entities) {
    super(x, y, BULLET_SIZE, BULLET_SIZE, entities, SensorShapes.BULLET);
    super.setRot(rot);
    this.color = Palette.BULLET;

    this.entities.addObject(Bullet.entityName, this);
  }

  destroy() {
    this.entities.removeObject(Bullet.entityName, this);
  }

  update(delta: number) {
    super.moveForward(delta * BULLET_SPEED);

    if ((this.timer += delta) > BULLET_LIFETIME) {
      this.deleted = true;
    }
  }
}
