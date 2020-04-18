import ObjectBase from './objectBase';
import Entities from '../entities';
import PlayerSegment from './playerSegment';
import { Updatable } from '../updatable';

const WEAPON_BASE_RELATIVE_SIZE = 1.333333;

export default abstract class WeaponBase extends ObjectBase implements Updatable {
  protected readonly frequency: number;
  protected cooldown = 0;

  constructor(x: number, y: number, entities: Entities, frequency: number) {
    super(
      x,
      y,
      PlayerSegment.defaultSize * WEAPON_BASE_RELATIVE_SIZE,
      PlayerSegment.defaultSize * WEAPON_BASE_RELATIVE_SIZE,
      entities
    );

    this.frequency = frequency;
  }

  destroy() {}

  abstract shoot(): void;

  update(delta: number) {
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }
  }
}
