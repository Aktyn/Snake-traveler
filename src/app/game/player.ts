import ObjectBase from './objectBase';
import { Updatable } from './updatable';
import { debugLine } from '../debugger';
import Entities from './entities';

const MAX_PLAYER_SPEED = 0.33;
const ACCELERATION = MAX_PLAYER_SPEED; //speed to maximum in a second

export default class Player extends ObjectBase implements Updatable {
  private static readonly entityName = 'playerSegment';
  private speed = 0;
  private rotationSpeed = Math.PI;

  constructor(x: number, y: number, entities: Entities) {
    super(x, y, 1, 1, entities);
    super.setScale(0.05, 0.05);

    this.entities.addObject(Player.entityName, this);
  }

  destroy(): void {
    this.entities.removeObject(Player.entityName, this);
  }

  steering = {
    left: false,
    right: false,
    up: false,
    down: false
  };

  update(delta: number) {
    if (this.steering.up) {
      this.speed = Math.min(MAX_PLAYER_SPEED, this.speed + delta * ACCELERATION);
    }
    if (this.steering.down) {
      this.speed = Math.max(0, this.speed - delta * ACCELERATION);
    }
    if (this.steering.left) {
      this.rot -= delta * this.rotationSpeed;
    }
    if (this.steering.right) {
      this.rot += delta * this.rotationSpeed;
    }

    /*super.setRotZ(this.rot - Math.PI / 2);
    super.setPos(
      this.x + Math.cos(this.angle) * this.speed * delta,
      this.y + Math.sin(this.angle) * this.speed * delta,
      this.z
    );*/
    super.move(
      Math.cos(-this.rot + Math.PI / 2) * this.speed * delta,
      Math.sin(-this.rot + Math.PI / 2) * this.speed * delta
    );

    debugLine(`Player pos: ${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
  }
}
