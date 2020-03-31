import { Biomes } from './colors';
import Config from './config';
import { WorldSchema } from './schemas';

const BASE_URL = `http://localhost:${Config.SERVER_PORT}`;

const GET_OPTIONS: RequestInit = {
  method: 'GET',
  mode: 'cors'
};

const API = {
  fetchChunk(x: number, y: number, size: number): Promise<ArrayBuffer> {
    return fetch(`${BASE_URL}/chunk/${x}/${y}/${size}/${Biomes.length}`, GET_OPTIONS).then(res => res.arrayBuffer());
  },

  getWorlds(): Promise<WorldSchema[]> {
    return fetch(`${BASE_URL}/worlds`, GET_OPTIONS).then(res => res.json());
  }
};

export default API;
