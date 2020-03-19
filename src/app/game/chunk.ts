import ObjectBase from './objectBase';
import Vec2 from '../common/math/vec2';

export default class Chunk extends Vec2 {
  public static DEFAULT_SIZE = 16; //should be defined with same value as in server

  objects: ObjectBase[] = [];
  readonly size: number;
  loaded = false;

  constructor(x: number, y: number, size = Chunk.DEFAULT_SIZE) {
    super(x, y);
    this.size = size;
  }

  destroy() {
    //this.objects.forEach(obj => obj.destroy());
    this.objects = [];
  }

  static clampPos(pos: Vec2) {
    const xInt = pos.x | 0;
    const yInt = pos.y | 0;

    return new Vec2(xInt - (xInt % Chunk.DEFAULT_SIZE), yInt - (yInt % Chunk.DEFAULT_SIZE));
  }
}
