import DynamicObject from './dynamicObject';
import { Updatable } from '../updatable';
import { SensorShapes } from '../physics/sensor';
import { Palette } from '../../common/colors';
import Vec2 from '../../common/math/vec2';
import { angleLerp } from '../../common/utils';
import WorldMap from '../worldMap';

const DIFF_TOLERANCE = 0.001;
const POSITION_SPEED = 12;
const ROTATION_SPEED = Math.PI;

export default class PlayerSegment extends DynamicObject implements Updatable {
  public static readonly entityName = 'playerSegment';
  public static readonly offset = 0;
  public static readonly defaultSize = 0.05;

  private readonly map: WorldMap;

  public readonly index: number;
  public nextSegment: PlayerSegment | null = null;
  private health = 1;
  private targetPos: Vec2;

  constructor(x: number, y: number, map: WorldMap, index: number) {
    super(x, y, 1, 1, map.entities, SensorShapes.PLAYER);
    super.setScale(PlayerSegment.defaultSize, PlayerSegment.defaultSize);
    super.color = Palette.PLAYER;
    this.targetPos = new Vec2(x, y);
    this.index = index;
    this.map = map;

    this.entities.addObject(PlayerSegment.entityName, this);
  }

  destroy() {
    this.entities.removeObject(PlayerSegment.entityName, this);
  }

  onHit(damage: number) {
    if (this.nextSegment?.getHealth()) {
      const damageOverload = this.nextSegment.onHit(damage);
      if (damageOverload > 0) {
        this.onHit(damageOverload);
      }
    } else {
      this.health -= damage;
      this.map.context.setPlayerHealth(this.index, Math.max(0, this.health));
    }

    if (this.health < 1e-8) {
      const damageOverload = -this.health;
      this.health = 0;
      this.deleted = true;
      return damageOverload;
    }
    return 0;
  }

  heal(factor: number) {
    this.health = Math.min(1, this.health + factor);
    this.map.context.setPlayerHealth(this.index, this.health);
  }

  getHealth() {
    return this.health;
  }

  setHealth(value: number) {
    this.health = value;

    if (this.health < 1e-8) {
      this.health = 0;
      this.deleted = true;
    }
    if (this.health >= 1 - 1e-8) {
      this.health = 1;
    }
  }

  setTargetPos(x: number, y: number) {
    this.targetPos.set(x, y);
  }

  update(delta: number): void {
    const headPos = new Vec2(
      this.x + Math.cos(this.fixedRot) * (this.width + PlayerSegment.offset),
      this.y + Math.sin(this.fixedRot) * (this.height + PlayerSegment.offset)
    );

    let dx = this.targetPos.x - headPos.x;
    let dy = this.targetPos.y - headPos.y;

    if (Math.abs(dx) > DIFF_TOLERANCE || Math.abs(dy) > DIFF_TOLERANCE) {
      this.rot = angleLerp(this.rot, -Math.atan2(dy, dx) + Math.PI / 2, Math.min(1, delta * ROTATION_SPEED));

      dx = this.targetPos.x - (this.x + Math.cos(this.fixedRot) * (this.width + PlayerSegment.offset));
      dy = this.targetPos.y - (this.y + Math.sin(this.fixedRot) * (this.height + PlayerSegment.offset));

      this.x += dx * Math.min(1, delta * POSITION_SPEED);
      this.y += dy * Math.min(1, delta * POSITION_SPEED);
    }
  }
}
