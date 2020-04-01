import { Biomes } from './colors';
import Config from './config';
import { WorldSchema } from './schemas';

const BASE_URL = `http://localhost:${Config.SERVER_PORT}`;

const METHOD: { [_: string]: RequestInit } = {
  GET: {
    method: 'GET',
    mode: 'cors'
  },
  DELETE: {
    method: 'DELETE',
    mode: 'cors'
  },
  POST: {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

const API = {
  fetchChunk(worldId: string, x: number, y: number, size: number): Promise<ArrayBuffer> {
    return fetch(`${BASE_URL}/worlds/${worldId}/chunk/${x}/${y}/${size}/${Biomes.length}`, METHOD.GET).then(res =>
      res.arrayBuffer()
    );
  },

  getWorlds(): Promise<WorldSchema[]> {
    return fetch(`${BASE_URL}/worlds`, METHOD.GET).then(res => res.json());
  },

  deleteWorld(worldId: string) {
    return fetch(`${BASE_URL}/worlds/${worldId}`, METHOD.DELETE).then(res => res.text());
  },

  generateWorld(name: string, seed: string) {
    return fetch(`${BASE_URL}/worlds`, { ...METHOD.POST, body: JSON.stringify({ name, seed }) }).then(res =>
      res.json()
    );
  }
};

export default API;
