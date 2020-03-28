import DynamicObject from './dynamicObject';
import { Updatable } from './updatable';
import Entities from './entities';
import { SensorShapes } from '../physics/sensor';
import { Palette } from '../common/colors';
import Vec2 from '../common/math/vec2';
import { angleLerp } from '../common/utils';

const DIFF_TOLERANCE = 0.001;
const POSITION_SPEED = 12;
const ROTATION_SPEED = Math.PI;

export default class PlayerSegment extends DynamicObject implements Updatable {
  public static readonly entityName = 'playerSegment';
  public static readonly offset = 0;
  public static readonly defaultSize = 0.05;

  private targetPos: Vec2;

  constructor(x: number, y: number, entities: Entities) {
    super(x, y, 1, 1, entities, SensorShapes.PLAYER);
    super.setScale(PlayerSegment.defaultSize, PlayerSegment.defaultSize);
    super.color = Palette.PLAYER;
    this.targetPos = new Vec2(x, y);

    this.entities.addObject(PlayerSegment.entityName, this); //TODO: use static value from Player class
  }

  destroy() {
    this.entities.removeObject(PlayerSegment.entityName, this);
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
