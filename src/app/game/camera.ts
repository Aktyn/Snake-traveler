import Vec2 from '../common/math/vec2';
import scene from '../graphics/scene';
import { Updatable } from './updatable';

const MIN_CAMERA_HEIGHT = 4;
const MAX_CAMERA_HEIGHT = 32; //16
const DIFF_TOLERANCE = 0.001;
const CAMERA_SPEED = 10;
const POSITION_SPEED = 10;

export default class Camera extends Vec2 implements Updatable {
  private cameraHeight = 10;
  private targetCameraHeight = 32; //10
  private visiblePos = new Vec2(); //for smoothness

  constructor() {
    super(0, 0);
  }

  private updateSceneCamera() {
    scene.setCameraPos(this.visiblePos, this.cameraHeight);
  }

  setPos(x: number, y: number, smooth = true) {
    this.set(x, y);
    if (!smooth) {
      this.visiblePos.set(x, y);
      this.updateSceneCamera();
    }
  }

  set(x: number, y: number) {
    return super.set(x, y);
  }

  move(x: number, y: number) {
    super.add(x, y);
  }

  zoom(factor: number) {
    this.targetCameraHeight = Math.max(MIN_CAMERA_HEIGHT, Math.min(MAX_CAMERA_HEIGHT, this.cameraHeight + factor));
    // console.log(this.targetCameraHeight);
  }

  update(delta: number) {
    let needUpdate = false;

    const heightDiff = this.targetCameraHeight - this.cameraHeight;
    if (Math.abs(heightDiff) > DIFF_TOLERANCE) {
      this.cameraHeight += heightDiff * delta * CAMERA_SPEED;
      needUpdate = true;
    }

    const xDiff = this.x - this.visiblePos.x;
    const yDiff = this.y - this.visiblePos.y;
    if (Math.abs(xDiff) > DIFF_TOLERANCE || Math.abs(yDiff) > DIFF_TOLERANCE) {
      const posUpdateFactor = delta * POSITION_SPEED;
      this.visiblePos.add(xDiff * posUpdateFactor, yDiff * posUpdateFactor);

      needUpdate = true;
    }

    needUpdate && this.updateSceneCamera();
  }
}
