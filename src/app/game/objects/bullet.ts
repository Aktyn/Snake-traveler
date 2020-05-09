import { SensorShapes } from '../physics/sensor';
import DynamicObject from './dynamicObject';
import { Updatable } from '../updatable';
import Entities from '../entities';
import { Palette } from '../../common/colors';

const defaultParams = {
  speed: 1,
  lifetime: 5,
  power: 0.2,
  explosionRadius: 0
};

export default abstract class Bullet extends DynamicObject implements Updatable {
  private timer = 0;
  public readonly params: typeof defaultParams;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    rot: number,
    entities: Entities,
    shape = SensorShapes.BULLET,
    color = Palette.BULLET,
    params: Partial<typeof defaultParams> = defaultParams
  ) {
    super(x, y, width, height, entities, shape);
    super.setRot(rot);
    this.color = color;
    this.params = Object.assign({ ...defaultParams }, params);
  }

  update(delta: number) {
    super.moveForward(delta * this.params.speed);

    if ((this.timer += delta) > this.params.lifetime) {
      this.deleted = true;
    }
  }
}
