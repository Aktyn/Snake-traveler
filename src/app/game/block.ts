import ObjectBase from './objectBase';
import Assets from '../graphics/assets';
import { assert } from '../common/utils';

export default class Block extends ObjectBase {
  constructor(x: number, y: number, z: number, type: number) {
    assert(Assets.meshes.block1.mesh !== null, 'Mesh not loaded');
    const renderingObject = Assets.meshes.block1.mesh.clone();

    super(x, y, z, renderingObject);
  }
}
