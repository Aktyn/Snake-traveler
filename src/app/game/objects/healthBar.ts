import ObjectBase from './objectBase';
import { Updatable } from '../updatable';
import Entities from '../entities';
import { Palette, mixColors } from '../../common/colors';

const BAR_HEIGHT = 0.0075;

export default class HealthBar extends ObjectBase implements Updatable {
  private static readonly entityName = 'block';

  private _value = 1;
  private readonly target: ObjectBase;

  constructor(target: ObjectBase, entities: Entities) {
    super(target.x, target.y, 0, BAR_HEIGHT, entities);
    super.color = Palette.HEALTH_BAR_GREEN;
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
    this.setScale(this.target.width * _v, BAR_HEIGHT);
    super.color = mixColors(Palette.HEALTH_BAR_RED, Palette.HEALTH_BAR_GREEN, _v);
  }

  update(delta: number) {
    this.setPos(this.target.x, this.target.y + this.target.height + BAR_HEIGHT / 2);
  }
}
