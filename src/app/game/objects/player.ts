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
const HEALING_SPEED = 0.01;
const NEWLY_GROWN_SEGMENT_HEALTH = 0.01; //starts at 1 percent

export default class Player extends DynamicObject implements Updatable {
  private static readonly entityName = 'player';
  private readonly map: WorldMap;
  private health = 1;
  private speed = 0;
  private rotationSpeed = Math.PI;

  private segments: PlayerSegment[] = [];
  private weapon: WeaponBase;

  constructor(x: number, y: number, rot: number, map: WorldMap) {
    super(x || 1e-8, y || 1e-8, 1, 1, map.entities, SensorShapes.PLAYER);
    super.setScale(PlayerSegment.defaultSize, PlayerSegment.defaultSize);
    super.setRot(rot || 1e-8);
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
    if (this.segments[0]?.getHealth()) {
      const damageOverload = this.segments[0].onHit(damage);
      this.segments = this.segments.filter(({ deleted }) => !deleted);
      if (damageOverload > 0) {
        this.onHit(damageOverload);
      }
    } else {
      this.health = Math.max(0, this.health - damage);
      this.map.context.setPlayerHealth(0, this.health);
    }

    if (this.health < 1e-8) {
      this.health = 0;
      //TODO: player is dead - game over
      console.log('Game over');
    }
  }

  private growSegment(fromSegment: Player | PlayerSegment) {
    const offsetX = Math.cos(-fromSegment.rot - Math.PI / 2) * PlayerSegment.defaultSize * 2;
    const offsetY = Math.sin(-fromSegment.rot - Math.PI / 2) * PlayerSegment.defaultSize * 2;
    const segment = new PlayerSegment(
      fromSegment.x + offsetX,
      fromSegment.y + offsetY,
      this.map,
      this.segments.length + 1
    );
    segment.setHealth(NEWLY_GROWN_SEGMENT_HEALTH);
    this.segments.push(segment);
    this.map.addObject(segment);

    if (this.segments.length > 1) {
      this.segments[this.segments.length - 2].nextSegment = segment;
    }

    return segment;
  }

  private heal(factor: number) {
    if (this.segments.length) {
      const lastSegment = this.segments[this.segments.length - 1];
      if (lastSegment.deleted) {
        this.segments = this.segments.filter(({ deleted }) => !deleted);
        this.heal(factor);
        return;
      }
      if (lastSegment.getHealth() < 1) {
        lastSegment.heal(factor);
      } else {
        if (this.segments.length === Config.PLAYER_SEGMENTS - 1) {
          return; //player has full health in every segment
        } else {
          const newSegment = this.growSegment(lastSegment);
          this.map.context.setPlayerHealth(newSegment.index, newSegment.getHealth());
        }
      }
    } else {
      if (this.health < 1) {
        this.health = Math.min(1, this.health + factor);
        this.map.context.setPlayerHealth(0, this.health);
      } else {
        const newSegment = this.growSegment(this);
        this.map.context.setPlayerHealth(newSegment.index, newSegment.getHealth());
      }
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

    if (this.speed === MAX_PLAYER_SPEED) {
      this.heal(HEALING_SPEED * delta);
    }

    this.weapon.setPos(this.x, this.y);
    this.weapon.setRot(this.rot);
    if (this.steering.shooting) {
      this.weapon.shoot();
    }
    this.weapon.update(delta);

    debugLine(`Player pos: ${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
  }
}
