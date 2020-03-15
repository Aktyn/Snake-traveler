import { Object3D } from 'three';
import scene from '../graphics/scene';
import Vec3 from '../common/math/vec3';

export default class ObjectBase extends Vec3 {
  private readonly renderingObject: Object3D | null;

  constructor(x: number, y: number, z: number, renderingObject?: Object3D) {
    super(x, y, z);

    if (renderingObject) {
      renderingObject.position.set(x, y, z);
      scene.addObject(renderingObject);
      this.renderingObject = renderingObject;
    } else {
      this.renderingObject = null;
    }
  }

  destroy() {
    if (this.renderingObject) {
      scene.removeObject(this.renderingObject);
    }
  }

  setPos(x: number, y: number, z: number) {
    this.set(x, y, z);
  }

  set(x: number, y: number, z: number) {
    this.renderingObject?.position.set(x, y, z);
    return super.set(x, y, z);
  }

  setRotZ(value: number) {
    this.setRot(this.renderingObject?.rotation.x || 0, this.renderingObject?.rotation.y || 0, value);
  }

  setRot(x: number, y: number, z: number) {
    this.renderingObject?.rotation.set(x, y, z);
  }
}
