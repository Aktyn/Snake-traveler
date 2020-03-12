import ObjectBase from './objectBase';
import Vec2 from '../common/math/vec2';

export default class Chunk extends Vec2 {
  public objects: ObjectBase[] = [];
  public readonly size: number;

  constructor(x: number, y: number, size: number) {
    super(x, y);
    this.size = size;
  }
}
