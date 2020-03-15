import predefinedObjects, { ObjectType } from './../graphics/predefined';
import ObjectBase from './objectBase';
import { Updatable } from './updatable';

export default class Player extends ObjectBase implements Updatable {
  private angle = Math.PI / 2;
  private speed = 3;
  private rotationSpeed = Math.PI;

  steering = {
    left: false,
    right: false
  };

  constructor(x: number, y: number, z: number) {
    super(x, y, z, predefinedObjects[ObjectType.SNAKE_SEGMENT].clone());
  }

  getAngle() {
    return this.angle;
  }

  update(delta: number): void {
    if (this.steering.left) {
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
    );
  }
}
