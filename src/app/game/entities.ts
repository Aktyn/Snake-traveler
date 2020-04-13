import { ExtendedTexture } from './graphics/texture';
import ObjectBase from './objects/objectBase';
import TextureModule from './graphics/texture';
import Assets from '../common/assets';

export enum Layers {
  BACKGROUND,
  FOREGROUND
}

const DEFAULT_TEXTURE_FILTERING = true;

interface Schema {
  layer: Layers;
  texture: string;
  linear?: boolean;
}

const Predefined = {
  doubleGun: {
    layer: Layers.FOREGROUND,
    texture: 'double_gun.png'
  },
  bullet: {
    layer: Layers.FOREGROUND,
    texture: 'bullet.png'
  },
  player: {
    layer: Layers.FOREGROUND,
    texture: 'player.png'
  },
  playerSegment: {
    layer: Layers.FOREGROUND,
    texture: 'player_segment.png'
  }
};

type EntityName = keyof typeof Predefined;

export class Entity {
  readonly objects: ObjectBase[] = [];
  private readonly schema: Schema;
  private texture: ExtendedTexture | null = null;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  bindTexture(GL: WebGL2RenderingContext) {
    if (!this.texture) {
      this.texture = TextureModule.createFrom(
        GL,
        Assets.textures[this.schema.texture] || Assets.emptyTexture,
        this.schema.linear ?? DEFAULT_TEXTURE_FILTERING
      );
    }
    this.texture?.bind();
  }
}

function generateFromPredefinedSchema<T extends object>(predefined: T, layer: Layers) {
  return Object.entries(predefined).reduce((acc, [key, value]) => {
    acc[key as EntityName] = new Entity(value);
    return acc;
  }, {} as { [key in EntityName]: Entity });
}

export default class Entities {
  private readonly layers = {
    [Layers.BACKGROUND]: generateFromPredefinedSchema(Predefined, Layers.BACKGROUND),
    [Layers.FOREGROUND]: generateFromPredefinedSchema(Predefined, Layers.FOREGROUND)
  };

  addObject(entityName: EntityName, object: ObjectBase) {
    const layer = Predefined[entityName].layer;
    this.layers[layer][entityName].objects.push(object);
  }

  removeObject(entityName: EntityName, object: ObjectBase) {
    const layer = Predefined[entityName].layer;
    const index = this.layers[layer][entityName].objects.indexOf(object);
    if (index !== -1) {
      this.layers[layer][entityName].objects.splice(index, 1);
    }
  }

  getLayer(layer: Layers) {
    return this.layers[layer];
  }
}
