import ObjectBase from './objectBase';
import { Updatable } from '../updatable';
import Entities from '../entities';
import { Palette } from '../../common/colors';

const BAR_HEIGHT = 0.0075;
const BAR_WIDTH = 0.1;

export default class HealthBar extends ObjectBase implements Updatable {
  private static readonly entityName = 'block';

  private _value = 1;
  private readonly target: ObjectBase;

  constructor(target: ObjectBase, entities: Entities) {
    super(target.x, target.y, 0, BAR_HEIGHT, entities);
    super.color = Palette.HEALTH_BAR;
    this.target = target;

    this.entities.addObject(HealthBar.entityName, this);
  }

  destroy() {
    this.entities.removeObject(HealthBar.entityName, this);
  }

  get value() {
    return this._value;
  }

  set value(_v: number) {
    this._value = Math.max(0, _v);
    this.setScale(BAR_WIDTH * _v, BAR_HEIGHT);
  }

  update(delta: number) {
    this.setPos(this.target.x, this.target.y + this.target.height + BAR_HEIGHT / 2);
  }
}
