import { SensorShapes } from '../physics/sensor';

import Bullet from './bullet';
import Entities from '../entities';
import { Palette } from '../../common/colors';

const BULLET_SIZE = 0.02;
const BULLET_SPEED = 1;
const BULLET_LIFETIME = 5;

export default class PlayerBullet extends Bullet {
  private static readonly entityName = 'bullet';

  constructor(x: number, y: number, rot: number, entities: Entities) {
    super(x, y, BULLET_SIZE, BULLET_SIZE, rot, entities, SensorShapes.BULLET, Palette.BULLET, {
      speed: BULLET_SPEED,
      lifetime: BULLET_LIFETIME,
      explosionRadius: 0.1
    });

    this.entities.addObject(PlayerBullet.entityName, this);
  }

  destroy() {
    this.entities.removeObject(PlayerBullet.entityName, this);
  }
}
