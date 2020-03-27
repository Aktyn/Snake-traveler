import Vec2 from '../common/math/vec2';
import { Updatable } from './updatable';
import ObjectBase from './objectBase';

const DIFF_TOLERANCE = 0.001;
const POSITION_SPEED = 2;

export default class Camera extends Vec2 implements Updatable {
  public readonly buffer = new Float32Array([0, 0, 1]);
  private visiblePos = new Vec2(); //for smoothness

  constructor(x: number, y: number) {
    super(x, y);
    this.visiblePos.set(x, y);
  }

  private updateBuffer() {
    this.buffer[0] = this.visiblePos.x;
    this.buffer[1] = this.visiblePos.y;
  }

  zoom(factor: number) {}

  follow(target: ObjectBase | Vec2) {
    super.set(target.x, target.y);
  }

  update(delta: number) {
    const diffX = this.x - this.visiblePos.x;
    const diffY = this.y - this.visiblePos.y;
    if (Math.abs(diffX) > DIFF_TOLERANCE || Math.abs(diffY) > DIFF_TOLERANCE) {
      this.visiblePos.add(diffX * delta * POSITION_SPEED, diffY * delta * POSITION_SPEED);
    }

    this.updateBuffer();
  }
}
