import Vec2 from '../common/math/vec2';
import scene from '../graphics/scene';

export default class Camera extends Vec2 {
  constructor() {
    super(0, 0);
  }

  public setPos(x: number, y: number) {
    this.set(x, y);
  }

  public set(x: number, y: number) {
    super.set(x, y);
    scene.setCameraPos(this);
  }
}
