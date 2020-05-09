import { SensorShapes } from '../physics/sensor';
import { Updatable } from '../updatable';
import { debugLine } from '../../debugger';
import DynamicObject from './dynamicObject';
import { Palette } from '../../common/colors';
import PlayerSegment from './playerSegment';
import WorldMap from '../worldMap';
import WeaponBase from './weaponBase';
import DoubleGun from './doubleGun';

const MAX_PLAYER_SPEED = 0.33;
const ACCELERATION = MAX_PLAYER_SPEED; //speed to maximum in a second

export default class Player extends DynamicObject implements Updatable {
  private static readonly entityName = 'player';
  private speed = 0;
  private rotationSpeed = Math.PI;

  private segments: PlayerSegment[] = [];
  private weapon: WeaponBase;

  constructor(x: number, y: number, map: WorldMap) {
    super(x, y, 1, 1, map.entities, SensorShapes.PLAYER);
    super.setScale(PlayerSegment.defaultSize, PlayerSegment.defaultSize);
    super.color = Palette.PLAYER;

    for (let i = 1; i <= 4; i++) {
      const segment = new PlayerSegment(x, y, map.entities);
      this.segments.push(segment);
      map.addObject(segment);
    }

    this.weapon = new DoubleGun(x, y, map);
    this.weapon.color = this.color;
    //this.weapon.color.alpha = 0.95;

    this.entities.addObject(Player.entityName, this);
  }

  destroy() {
    this.entities.removeObject(Player.entityName, this);
    this.weapon.destroy();
  }

  steering = {
    left: false,
    right: false,
    up: false,
    down: false,
    shooting: false
  };

  private updateDataForSegments() {
    let buttX = this.x - Math.cos(this.fixedRot) * (this.width + PlayerSegment.offset);
    let buttY = this.y - Math.sin(this.fixedRot) * (this.height + PlayerSegment.offset);

    this.segments.forEach(segment => {
      segment.setTargetPos(buttX, buttY);
      buttX = segment.x - Math.cos(segment.fixedRot) * (segment.width + PlayerSegment.offset);
      buttY = segment.y - Math.sin(segment.fixedRot) * (segment.width + PlayerSegment.offset);
    });
  }

  update(delta: number) {
    if (this.steering.up) {
      this.speed = Math.min(MAX_PLAYER_SPEED, this.speed + delta * ACCELERATION);
    }
    if (this.steering.down) {
      this.speed = Math.max(0, this.speed - delta * ACCELERATION);
    }
    if (this.steering.left) {
      this.rot -= delta * this.rotationSpeed; //TODO: verify this * (this.speed / MAX_PLAYER_SPEED);
    }
    if (this.steering.right) {
      this.rot += delta * this.rotationSpeed; //TODO: verify this * (this.speed / MAX_PLAYER_SPEED);
    }

    super.moveForward(this.speed * delta);

    this.updateDataForSegments();

    this.weapon.setPos(this.x, this.y);
    this.weapon.setRot(this.rot);
    if (this.steering.shooting) {
      this.weapon.shoot();
    }
    this.weapon.update(delta);

    debugLine(`Player pos: ${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
  }
}
