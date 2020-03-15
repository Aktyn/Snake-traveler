import Vec2 from '../common/math/vec2';
import scene from '../graphics/scene';
import { Updatable } from './updatable';

const MIN_CAMERA_HEIGHT = 4;
const MAX_CAMERA_HEIGHT = 16; //set 32 for testing
const DIFF_TOLERANCE = 0.001;
const CAMERA_SPEED = 10;
const CAMERA_ROTATION_SPEED = Math.PI;
const POSITION_SPEED = 10;

export default class Camera extends Vec2 implements Updatable {
  private cameraHeight = 10;
  private targetCameraHeight = 10; //set 32 for testing
  private visiblePos = new Vec2(); //for smoothness
  private angle = 0;
  private targetAngle = 0;

  constructor() {
    super(0, 0);
  }

  private updateSceneCameraPos() {
    scene.setCameraPos(this.visiblePos, this.cameraHeight);
  }

  setPos(x: number, y: number, smooth = true) {
    this.set(x, y);
    if (!smooth) {
      this.visiblePos.set(x, y);
      this.updateSceneCameraPos();
    }
  }

  set(x: number, y: number) {
    return super.set(x, y);
  }

  setRotation(z: number) {
    this.targetAngle = z;
  }

  move(x: number, y: number) {
    super.add(x, y);
  }

  zoom(factor: number) {
    this.targetCameraHeight = Math.max(MIN_CAMERA_HEIGHT, Math.min(MAX_CAMERA_HEIGHT, this.cameraHeight + factor));
  }

  update(delta: number) {
    let needPositionUpdate = false;

    const heightDiff = this.targetCameraHeight - this.cameraHeight;
    if (Math.abs(heightDiff) > DIFF_TOLERANCE) {
      this.cameraHeight += heightDiff * delta * CAMERA_SPEED;
      needPositionUpdate = true;
    }

    const xDiff = this.x - this.visiblePos.x;
    const yDiff = this.y - this.visiblePos.y;
    if (Math.abs(xDiff) > DIFF_TOLERANCE || Math.abs(yDiff) > DIFF_TOLERANCE) {
      const posUpdateFactor = delta * POSITION_SPEED;
      this.visiblePos.add(xDiff * posUpdateFactor, yDiff * posUpdateFactor);

      needPositionUpdate = true;
    }

    needPositionUpdate && this.updateSceneCameraPos();

    const angleDiff = this.targetAngle - this.angle;
    if(Math.abs(angleDiff) > DIFF_TOLERANCE) {
      this.angle += angleDiff * delta * CAMERA_ROTATION_SPEED;
      scene.setCameraRot(0, 0, this.angle);
    }
  }
}
