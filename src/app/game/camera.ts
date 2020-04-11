import Vec2 from '../common/math/vec2';
import { Updatable } from './updatable';
import ObjectBase from './objectBase';

const DIFF_TOLERANCE = 0.001;
const POSITION_SPEED = 2;
const ZOOM_SCALE = 0.1;
const ZOOM_SPEED = 2;
const MAX_ZOOM = 1.5;
const MIN_ZOOM = -2; //TODO: adjust it

export default class Camera extends Vec2 implements Updatable {
  public readonly buffer = new Float32Array([0, 0, 1]);
  private readonly visiblePos = new Vec2(); //for smoothness
  private _zoom = 0;
  private visibleZoom = 0;

  constructor(x: number, y: number) {
    super(x, y);
    this.visiblePos.set(x, y);
  }

  private updateBuffer() {
    this.buffer[0] = this.visiblePos.x;
    this.buffer[1] = this.visiblePos.y;
  }

  get visibleX() {
    return this.visiblePos.x;
  }

  get visibleY() {
    return this.visiblePos.y;
  }

  zoom(factor: number) {
    this._zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this._zoom - factor * ZOOM_SCALE));
  }

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

    const zoomDiff = this._zoom - this.visibleZoom;
    if (Math.abs(zoomDiff) > DIFF_TOLERANCE) {
      this.visibleZoom += zoomDiff * delta * ZOOM_SPEED;
    }
    this.buffer[2] = 2 ** this.visibleZoom;
  }
}
