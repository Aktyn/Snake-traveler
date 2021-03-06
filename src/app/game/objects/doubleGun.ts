import WeaponBase from './weaponBase';
import WorldMap from '../worldMap';
import PlayerBullet from './playerBullet';

const SHOOTING_FREQUENCY = 0.2; //shoot every x seconds

export default class DoubleGun extends WeaponBase {
  private static readonly entityName = 'doubleGun';
  private readonly map: WorldMap;

  constructor(x: number, y: number, map: WorldMap) {
    super(x, y, map.entities, SHOOTING_FREQUENCY);
    this.map = map;

    map.entities.addObject(DoubleGun.entityName, this);
  }

  destroy() {
    this.entities.removeObject(DoubleGun.entityName, this);
    super.destroy();
  }

  shoot() {
    if (this.cooldown > 0) {
      return;
    }
    this.cooldown = this.frequency;

    const offForwardX = Math.cos(this.fixedRot) * this.width;
    const offForwardY = Math.sin(this.fixedRot) * this.height;

    const sideOffset = 0.55;

    const offSideX = Math.cos(this.fixedRot + Math.PI / 2) * this.width * sideOffset;
    const offSideY = Math.sin(this.fixedRot + Math.PI / 2) * this.height * sideOffset;

    this.map.addObject(
      new PlayerBullet(this.x + offForwardX + offSideX, this.y + offForwardY + offSideY, this.rot, this.map.entities)
    );
    this.map.addObject(
      new PlayerBullet(this.x + offForwardX - offSideX, this.y + offForwardY - offSideY, this.rot, this.map.entities)
    );
  }
}
