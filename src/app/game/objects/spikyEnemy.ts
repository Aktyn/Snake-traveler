import { SensorShapes } from '../physics/sensor';
import { Palette } from '../../common/colors';
import WorldMap from '../worldMap';
import EnemyBase from './enemyBase';

const SPAWN_OFFSET = 0.001;
const ROTATION_SPEED = Math.PI;

const MIN_SIZE = 0.05;
const MAX_SIZE = 0.1;

const MIN_SPEED = 0.2;
const MAX_SPEED = 0.5;

const randWithinRange = (min: number, max: number) => min + Math.random() * (max - min);

export default class SpikyEnemy extends EnemyBase {
  private static readonly entityName = 'spikyEnemy';

  private readonly size = randWithinRange(MIN_SIZE, MAX_SIZE);
  private readonly speed = randWithinRange(MIN_SPEED, MAX_SPEED);

  private spinAngle = 0;

  constructor(x: number, y: number, map: WorldMap) {
    super(0, 0, 1, 1, map, SensorShapes.CIRCLE);

    const randomInitialAngle = Math.random() * Math.PI * 2.0;
    super.setPos(x + Math.cos(randomInitialAngle) * SPAWN_OFFSET, y + Math.sin(randomInitialAngle) * SPAWN_OFFSET);
    super.setScale(this.size, this.size);
    super.setRot(randomInitialAngle);

    super.color = Palette.SPIKY_ENEMY;

    this.entities.addObject(SpikyEnemy.entityName, this);
  }

  destroy() {
    this.entities.removeObject(SpikyEnemy.entityName, this);
    super.destroy();
  }

  resetRotation() {
    this.rot -= this.spinAngle;
    this.spinAngle = 0;
  }

  update(delta: number) {
    const angleStep = ROTATION_SPEED * delta;
    this.rot += angleStep;
    this.spinAngle += angleStep;

    while (this.spinAngle > Math.PI * 2) {
      this.spinAngle -= Math.PI * 2;
    }

    super.move(
      Math.cos(this.fixedRot + this.spinAngle) * this.speed * delta,
      Math.sin(this.fixedRot + this.spinAngle) * this.speed * delta
    );

    //TODO: triangle bullets (spikes) shooting from spiky enemy in random intervals

    super.update(delta);
  }
}
