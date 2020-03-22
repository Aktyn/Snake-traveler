import { ColorI, Palette } from './../common/colors';
import Entities from './entities';
import Matrix2D from '../common/math/matrix2d';

export default abstract class ObjectBase extends Matrix2D {
  private _color: ColorI = Palette.WHITE;
  protected readonly entities: Entities;

  constructor(x: number, y: number, width: number, height: number, entities: Entities) {
    super();
    super.setPos(x, y);
    this.entities = entities;
  }

  abstract destroy(): void;

  get color() {
    return this._color;
  }
}
