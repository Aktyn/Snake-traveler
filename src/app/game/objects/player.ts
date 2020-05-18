import { SensorShapes } from '../physics/sensor';
import { Updatable } from '../updatable';
import { debugLine } from '../../debugger';
import DynamicObject from './dynamicObject';
import { Palette } from '../../common/colors';
import PlayerSegment from './playerSegment';
import WorldMap from '../worldMap';
import WeaponBase from './weaponBase';
import DoubleGun from './doubleGun';
import Config from '../../common/config';

export const MAX_PLAYER_SPEED = 0.33;
const ACCELERATION = MAX_PLAYER_SPEED; //speed to maximum in a second

export default class Player extends DynamicObject implements Updatable {
  private static readonly entityName = 'player';
  private readonly map: WorldMap;
  private health = 1;
  private speed = 0;
  private rotationSpeed = Math.PI;

  private segments: PlayerSegment[] = [];
  private weapon: WeaponBase;

  constructor(x: number, y: number, rot: number, map: WorldMap) {
    super(x, y, 1, 1, map.entities, SensorShapes.PLAYER);
    super.setScale(PlayerSegment.defaultSize, PlayerSegment.defaultSize);
    super.setRot(rot);
    super.color = Palette.PLAYER;
    this.map = map;
    this.health = map.context.playerHealth[0] ?? 1;

    for (let i = 1; i <= Config.PLAYER_SEGMENTS - 1; i++) {
      if (map.context.playerHealth[i] >= 1e-8) {
        const offsetX = Math.cos(-this.rot - Math.PI / 2) * PlayerSegment.defaultSize * 2 * i * 1.1;
        const offsetY = Math.sin(-this.rot - Math.PI / 2) * PlayerSegment.defaultSize * 2 * i * 1.1;
        const segment = new PlayerSegment(x + offsetX, y + offsetY, map, i);
        segment.setHealth(map.context.playerHealth[i]);
        this.segments.push(segment);
        map.addObject(segment);

        if (this.segments.length > 1) {
          this.segments[this.segments.length - 2].nextSegment = segment;
        }
      }
    }
    console.log(this.x, this.y, this.rot);

    this.weapon = new DoubleGun(x, y, map);
    this.weapon.color = this.color;
    //this.weapon.color.alpha = 0.95;

    this.entities.addObject(Player.entityName, this);
  }

  destroy() {
    this.entities.removeObject(Player.entityName, this);
    this.weapon.destroy();
  }

  onHit(damage: number) {
    if (this.segments[0]?.getHeath()) {
      this.segments[0].onHit(damage);
      this.segments = this.segments.filter(({ deleted }) => !deleted);
    } else {
      this.health = Math.max(0, this.health - damage);
      this.map.context.setPlayerHealth(0, this.health);
    }

    if (this.health < 1e-8) {
      this.health = 0;
      //TODO: player is dead - game over
    }
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

  private updateSpeed(speed: number) {
    this.speed = speed;
    this.map.context.setPlayerSpeed(this.speed);
  }

  update(delta: number) {
    console.log(this.x, this.y, this.rot);
    if (this.steering.up) {
      this.updateSpeed(Math.min(MAX_PLAYER_SPEED, this.speed + delta * ACCELERATION));
    }
    if (this.steering.down) {
      this.updateSpeed(Math.max(0, this.speed - delta * ACCELERATION));
    }
    if (this.steering.left) {
      this.rot -= delta * this.rotationSpeed;
    }
    if (this.steering.right) {
      this.rot += delta * this.rotationSpeed;
    }

    super.moveForward(this.speed * delta);

    this.updateDataForSegments();

    //TODO: slow health regeneration over time

    this.weapon.setPos(this.x, this.y);
    this.weapon.setRot(this.rot);
    if (this.steering.shooting) {
      this.weapon.shoot();
    }
    this.weapon.update(delta);

    debugLine(`Player pos: ${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
  }
}
