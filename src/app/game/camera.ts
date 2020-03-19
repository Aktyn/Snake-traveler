import Vec2 from '../common/math/vec2';
import { Updatable } from './updatable';

const DIFF_TOLERANCE = 0.001;
const POSITION_SPEED = 2;

export default class Camera extends Vec2 implements Updatable {
  private visiblePos = new Vec2(); //for smoothness

  zoom(factor: number) {}

  follow(pos: Vec2, angle: number, smooth = true) {}

  update(delta: number) {}
}
