import Vec2 from '../common/math/vec2';

export default class Chunk extends Vec2 {
  public static DEFAULT_RESOLUTION = 256;

  //objects: ObjectBase[] = [];
  loaded = false;
  data: Uint8ClampedArray | null = null;

  destroy() {
    //this.objects.forEach(obj => obj.destroy());
    //this.objects = [];
  }

  static clampPos(pos: Vec2) {
    const xInt = pos.x | 0;
    const yInt = pos.y | 0;

    return new Vec2(xInt - (xInt % Chunk.DEFAULT_RESOLUTION), yInt - (yInt % Chunk.DEFAULT_RESOLUTION));
  }
}
