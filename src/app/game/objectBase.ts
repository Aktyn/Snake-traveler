import { Color, Palette } from './../common/colors';
import Entities from './entities';
import Matrix2D from '../common/math/matrix2d';

export default abstract class ObjectBase extends Matrix2D {
  private _color: Color = Palette.WHITE;
  protected readonly entities: Entities;
  public deleted = false;

  constructor(x: number, y: number, width: number, height: number, entities: Entities) {
    super();
    super.setPos(x, y);
    super.setScale(width, height);
    this.entities = entities;
  }

  abstract destroy(): void;

  //handles difference between graphics and physics coordinates system
  get fixedRot() {
    return -this.rot + Math.PI / 2;
  }

  get color() {
    return this._color;
  }

  set color(color: Color) {
    this._color = color;
  }
}
