import * as SimplexNoise from 'simplex-noise';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { dataFolder } from './external';
import Generator from './generator';

interface WorldSchema {
  id: string;
  name: string;
  seed: string;
}

class World {
  public readonly id: string;
  private readonly name: string;
  private readonly seed: string;
  private readonly simplex: SimplexNoise;

  constructor(name: string, seed: string, id = uuid()) {
    this.id = id;
    this.name = name;
    this.seed = seed;
    this.simplex = new SimplexNoise(seed);
  }

  getSchema(): WorldSchema {
    return {
      id: this.id,
      name: this.name,
      seed: this.seed
    };
  }

  generateChunk(x: number, y: number, size: number, biomes: number) {
    return Generator.generateChunk(this.simplex, x, y, size, biomes);
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
      worldsMap.set(world.id, new World(world.name, world.seed, world.id));
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
  //TODO: maximum number of worlds

  const world = new World(name, seed);
  worlds.set(world.id, world);
  updateWorldsList(worlds);
  return world;
}

export function deleteWorld(worldId: string) {
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
