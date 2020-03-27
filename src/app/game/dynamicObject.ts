import ObjectBase from './objectBase';
import Sensor, { SensorShapes } from '../physics/sensor';
import Entities from './entities';

export default abstract class DynamicObject extends ObjectBase {
  private readonly _sensor: Sensor;

  constructor(x: number, y: number, width: number, height: number, entities: Entities, shape = SensorShapes.CIRCLE) {
    super(x, y, width, height, entities);
    this._sensor = new Sensor(shape);
  }

  get sensor() {
    return this._sensor;
  }
}
