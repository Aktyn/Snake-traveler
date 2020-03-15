import ObjectBase from './objectBase';
import predefinedObjects, { ObjectType } from '../graphics/predefined';

const blockTypes = [ObjectType.METAL_CRATE, ObjectType.GRASS_BLOCK, ObjectType.LAVA_BLOCK];

export default class Block extends ObjectBase {
  constructor(x: number, y: number, z: number, type: ObjectType) {
    const renderingObject = predefinedObjects[blockTypes[type]].clone();

    super(x, y, z, renderingObject);
  }
}
