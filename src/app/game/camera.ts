import Vec2 from '../common/math/vec2';
import scene from '../graphics/scene';
import { Updatable } from './updatable';
import Vec3 from '../common/math/vec3';

const MIN_CAMERA_HEIGHT = 4;
const MAX_CAMERA_HEIGHT = 12; //set 32 for testing
const DIFF_TOLERANCE = 0.001;
const CAMERA_SPEED = 10;
const POSITION_SPEED = 2;

export default class Camera extends Vec2 implements Updatable {
  private cameraHeight = 10;
  private targetCameraHeight = 10; //set 32 for testing
  private visiblePos = new Vec2(); //for smoothness
  private followTargetPos = new Vec3();
  private visibleTargetPos = new Vec3();

  private updateSceneCameraPos() {
    scene.setCameraPos(this.visiblePos, this.cameraHeight);
  }

  setPos(x: number, y: number, smooth = true) {
    this.setXY(x, y);
    if (!smooth) {
      this.visiblePos.setXY(x, y);
      this.updateSceneCameraPos();
    }
  }

  setXY(x: number, y: number) {
    return super.setXY(x, y);
  }

  move(x: number, y: number) {
    super.addXY(x, y);
  }

  zoom(factor: number) {
    this.targetCameraHeight = Math.max(MIN_CAMERA_HEIGHT, Math.min(MAX_CAMERA_HEIGHT, this.cameraHeight + factor));
  }

  follow(pos: Vec3, angle: number, smooth = true) {
    const shiftFactor = this.cameraHeight / 2;
    this.setPos(
      pos.x + Math.cos(angle + Math.PI) * shiftFactor,
      pos.y + Math.sin(angle + Math.PI) * shiftFactor,
      smooth
    );

    this.followTargetPos.setXYZ(pos.x, pos.y, pos.z);
    if (!smooth) {
      this.visibleTargetPos.setXYZ(pos.x, pos.y, pos.z);
    }
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
      this.visiblePos.addXY(xDiff * posUpdateFactor, yDiff * posUpdateFactor);

      needPositionUpdate = true;
    }

    needPositionUpdate && this.updateSceneCameraPos();

    const targetPosDiffs = [
      this.followTargetPos.x - this.visibleTargetPos.x,
      this.followTargetPos.y - this.visibleTargetPos.y,
      this.followTargetPos.z - this.visibleTargetPos.z
    ];
    if (targetPosDiffs.some(posDiff => Math.abs(posDiff) > DIFF_TOLERANCE)) {
      const updateFactor = delta * POSITION_SPEED;
      const addPositions = targetPosDiffs.map(diff => diff * updateFactor);

      this.visibleTargetPos.addXYZ(addPositions[0], addPositions[1], addPositions[2]);

      scene.pointCameraAt(this.visibleTargetPos.x, this.visibleTargetPos.y, this.visibleTargetPos.z);
    }
  }
}
