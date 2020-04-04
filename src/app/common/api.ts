import { Biomes } from './colors';
import Config from './config';
import { WorldSchema } from './schemas';

const BASE_URL = `http://localhost:${Config.SERVER_PORT}`;

const METHOD = {
  GET: {
    method: 'GET',
    mode: 'cors'
  } as RequestInit,
  DELETE: {
    method: 'DELETE',
    mode: 'cors'
  } as RequestInit,
  POST: {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  } as RequestInit,
  PUT: {
    method: 'PUT',
    mode: 'cors'
  } as RequestInit
};

const API = {
  fetchChunk(worldId: string, x: number, y: number, size: number): Promise<ArrayBuffer> {
    return fetch(`${BASE_URL}/worlds/${worldId}/chunks/${x}/${y}/${size}/${Biomes.length}`, METHOD.GET).then(res =>
      res.arrayBuffer()
    );
  },

  updateChunk(worldId: string, x: number, y: number, data: Blob) {
    const fd = new FormData();
    fd.append('data', data, 'chunk.png'); //TODO: check if filename is necessary

    return fetch(`${BASE_URL}/worlds/${worldId}/chunks/${x}/${y}`, {
      ...METHOD.PUT,
      body: data //JSON.stringify({ x, y })
    }).then(res => res.json());
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
