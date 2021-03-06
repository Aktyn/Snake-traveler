import { SensorShapes } from '../physics/sensor';
import { Palette, mixColors } from '../../common/colors';
import WorldMap from '../worldMap';
import EnemyBase from './enemyBase';
import SpikeBullet, { SPIKE_BULLET_SIZE } from './spikeBullet';

const SPAWN_OFFSET = 0.001;
const ROTATION_SPEED = Math.PI;
const GROW_DURATION = 1;

const MIN_SIZE = 0.05;
const MAX_SIZE = 0.15;

const MIN_SPEED = 0.2;
const MAX_SPEED = 0.6;

const MINIMUM_SHOOT_FREQUENCY = 5;
const MAXIMUM_SHOOT_FREQUENCY = 30;
const SPIKES = 8;

const randWithinRange = (min: number, max: number) => min + Math.random() * (max - min);

const getNextShootTimer = () => randWithinRange(MINIMUM_SHOOT_FREQUENCY, MAXIMUM_SHOOT_FREQUENCY);

export default class SpikyEnemy extends EnemyBase {
  private static readonly entityName = 'spikyEnemy';

  private readonly size = randWithinRange(MIN_SIZE, MAX_SIZE);
  private readonly speed = randWithinRange(MIN_SPEED, MAX_SPEED);

  private spinAngle = 0;
  private shootTimer = getNextShootTimer();
  private growTimer = 0;

  public readonly strength = 0.2;

  constructor(x: number, y: number, map: WorldMap) {
    super(0, 0, 0, 0, map, SensorShapes.CIRCLE);

    const randomInitialAngle = Math.random() * Math.PI * 2.0;
    super.setPos(x + Math.cos(randomInitialAngle) * SPAWN_OFFSET, y + Math.sin(randomInitialAngle) * SPAWN_OFFSET);
    super.setScale(0, 0);
    super.setRot(randomInitialAngle);

    super.color = mixColors(Palette.SPIKY_ENEMY_ORANGE, Palette.SPIKY_ENEMY_RED, Math.random());

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
    if ((this.growTimer += delta) < GROW_DURATION) {
      const scale = Math.min(1, (this.size * this.growTimer) / GROW_DURATION);
      super.setScale(scale, scale);
    }

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

    if ((this.shootTimer -= delta) <= 0) {
      this.shootTimer = getNextShootTimer();

      for (let i = 0; i < SPIKES; i++) {
        const rot = ((Math.PI * 2) / SPIKES) * i;
        const x = this.x + Math.cos(rot) * (this.width + SPIKE_BULLET_SIZE);
        const y = this.y + Math.sin(rot) * (this.width + SPIKE_BULLET_SIZE);

        this.map.addObject(new SpikeBullet(x, y, -rot + Math.PI / 2, this.map.entities, super.color));
      }
    }

    super.update(delta);
  }
}
