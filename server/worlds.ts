import * as SimplexNoise from 'simplex-noise';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { dataFolder } from './external';
import Generator from './generator';
import WorldDatabase, { ChunkUpdateData } from './worldDatabase';

const STAMP = Buffer.from('mgdlnkczmr');

export interface WorldSchema {
  id: string;
  name: string;
  seed: string;
  data: {
    playerX: number;
    playerY: number;
    playerRot: number;
    playerHealth: number[];
    score: number;
  };
}

const getDefaultData = () =>
  ({
    playerX: 0,
    playerY: 0,
    playerRot: 0,
    playerHealth: new Array(5).fill(1), //array length must match number of player segments defined in client's config.ts file
    score: 0
  } as WorldSchema['data']);

class World {
  public readonly id: string;
  private readonly name: string;
  private readonly seed: string;
  private readonly simplex: SimplexNoise;
  //private readonly playerPos: number[];
  private readonly data: WorldSchema['data'];

  public readonly db: WorldDatabase;

  constructor(name: string, seed: string, data = getDefaultData(), id = uuid()) {
    this.id = id;
    this.name = name;
    this.seed = seed;
    this.data = data;
    this.simplex = new SimplexNoise(seed);

    this.db = new WorldDatabase(path.join(dataFolder, `${this.id}.sqlite3`));
  }

  destroy() {
    this.db.close();
  }

  getSchema(): WorldSchema {
    return {
      id: this.id,
      name: this.name,
      seed: this.seed,
      data: this.data
    };
  }

  async getChunk(x: number, y: number, size: number, biomes: number) {
    const { foreground: chunkData } = (await this.db.getForegroundLayer(x, y).catch(() => {})) || {};

    if (!chunkData) {
      return Generator.generateChunk(this.simplex, x, y, size, biomes);
      //chunkData = Generator.generateChunk(this.simplex, x, y, size, biomes);
      //setTimeout(() => this.db.saveForegroundLayer(x, y, zlib.gzipSync(chunkData as Buffer, compressionOptions)));
    } else {
      const background = Generator.generateChunk(this.simplex, x, y, size, biomes, true);
      //const sizes = Buffer.from(new Uint32Array([background.length, chunkData.length]).buffer);
      //const filler = Buffer.alloc(4 - ((STAMP.length + /*sizes.length + */background.length + chunkData.length) % 4));
      //return Buffer.concat([STAMP, sizes, background, chunkData, filler]);
      return Buffer.concat([STAMP, background, chunkData]);
    }
  }

  update(data: ChunkUpdateData[]) {
    this.db.saveLayers(data);
  }

  updateData(data: WorldSchema) {
    Object.assign(this.data, data);

    updateWorldsList(worlds);
  }
}

const worldsFile = path.join(dataFolder, 'worlds.json');

const worlds: Map<string, World> = (() => {
  if (!fs.existsSync(worldsFile)) {
    updateWorldsList(new Map());
    return new Map();
  }
  try {
    const worldsList: WorldSchema[] = JSON.parse(fs.readFileSync(worldsFile, 'utf8'));
    const worldsMap: Map<string, World> = new Map();
    for (const world of worldsList) {
      worldsMap.set(world.id, new World(world.name, world.seed, world.data, world.id));
    }
    return worldsMap;
  } catch (e) {
    console.error(e);
    return new Map();
  }
})();

console.log('Available worlds: ' + worlds.size);

function convertToArrayOfSchemas(_worlds: Map<string, World>) {
  return Array.from(_worlds).map(([, world]) => world.getSchema());
}

function updateWorldsList(_worlds: Map<string, World>) {
  const data = convertToArrayOfSchemas(_worlds);
  fs.writeFileSync(worldsFile, JSON.stringify(data, null, 4), 'utf8');
}

export function addWorld(name: string, seed: string): World {
  const world = new World(name, seed);
  worlds.set(world.id, world);
  updateWorldsList(worlds);
  return world;
}

export function deleteWorld(worldId: string) {
  const world = worlds.get(worldId);
  world?.db.close();
  world?.db.deleteFile();
  world?.destroy();
  if (worlds.delete(worldId)) {
    updateWorldsList(worlds);
  }
}

export function getWorld(id: string) {
  return worlds.get(id);
}

export function getList() {
  return convertToArrayOfSchemas(worlds);
}
