import { Palette } from './../../common/colors';
import { SensorShapes } from '../physics/sensor';

import Bullet from './bullet';
import Entities from '../entities';

export const SPIKE_BULLET_SIZE = 0.02;
const BULLET_SPEED = 1;
const BULLET_LIFETIME = 3;

export default class SpikeBullet extends Bullet {
  private static readonly entityName = 'spikeBullet';

  constructor(x: number, y: number, rot: number, entities: Entities, color = Palette.BULLET) {
    super(x, y, SPIKE_BULLET_SIZE, SPIKE_BULLET_SIZE, rot, entities, SensorShapes.SPIKE_BULLET, color, {
      speed: BULLET_SPEED,
      lifetime: BULLET_LIFETIME,
      explosionRadius: 0
    });

    this.entities.addObject(SpikeBullet.entityName, this);
  }

  destroy() {
    this.entities.removeObject(SpikeBullet.entityName, this);
  }
}
