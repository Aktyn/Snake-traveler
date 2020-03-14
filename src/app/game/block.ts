import ObjectBase from './objectBase';
import predefinedBlocks, { BlockTypes } from '../graphics/predefined';

export default class Block extends ObjectBase {
  constructor(x: number, y: number, z: number, type: BlockTypes) {
    const renderingObject = predefinedBlocks[type].clone();

    super(x, y, z, renderingObject);
  }
}
