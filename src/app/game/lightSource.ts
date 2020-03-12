import Vec3 from '../common/math/vec3';
import { PointLight } from 'three';
import scene from '../graphics/scene';

export default class LightSource extends Vec3 {
  private readonly light: PointLight;

  constructor(x: number, y: number, z: number, color: number) {
    super(x, y, z);

    this.light = scene.addLight(x, y, z, color);
  }

  public destroy() {
    scene.removeLight(this.light);
  }
}
