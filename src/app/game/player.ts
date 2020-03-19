import ObjectBase from './objectBase';
import { Updatable } from './updatable';
import core from './core';

export default class Player extends ObjectBase implements Updatable {
  private angle = Math.PI / 2;
  private speed = 3;
  private rotationSpeed = Math.PI;

  steering = {
    left: false,
    right: false
  };

  getAngle() {
    return this.angle;
  }

  update(delta: number) {
    /*if (this.steering.left) {
      this.angle += delta * this.rotationSpeed;
    }
    if (this.steering.right) {
      this.angle -= delta * this.rotationSpeed;
    }

    super.setRotZ(this.angle - Math.PI / 2);
    super.setPos(
      this.x + Math.cos(this.angle) * this.speed * delta,
      this.y + Math.sin(this.angle) * this.speed * delta,
      this.z
    );*/

    core.debug(`Player pos: ${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
  }
}
