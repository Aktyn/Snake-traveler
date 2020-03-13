import { Object3D } from 'three';
import Vec2 from '../common/math/vec2';
import scene from '../graphics/scene';

export default class ObjectBase extends Vec2 {
  private _z: number;
  private readonly renderingObject: Object3D | null;

  constructor(x: number, y: number, z: number, renderingObject?: Object3D) {
    super(x, y);
    this._z = z;

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
}
