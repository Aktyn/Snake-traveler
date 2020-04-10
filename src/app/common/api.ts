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

export interface ChunkUpdateData {
  worldId: string;
  x: number;
  y: number;
  foregroundData: Blob;
  //backgroundData?: Blob;
}

const API = {
  fetchChunk(worldId: string, x: number, y: number, size: number): Promise<ArrayBuffer> {
    return fetch(`${BASE_URL}/worlds/${worldId}/chunks/${x}/${y}/${size}/${Biomes.length}`, METHOD.GET).then(res =>
      res.arrayBuffer()
    );
  },

  updateChunks(data: ChunkUpdateData[]) {
    const fd = new FormData();
    fd.append(
      'data',
      JSON.stringify({
        worldId: data[0]?.worldId,
        chunksPos: data.map(dt => ({ x: dt.x, y: dt.y }))
      })
    );
    for (let i = 0; i < data.length; i++) {
      fd.append('foreground', data[i].foregroundData, i.toString());
      /*if (data[i].backgroundData) {
        fd.append('background', data[i].backgroundData as Blob, i.toString());
      }*/
    }

    return fetch(`${BASE_URL}/worlds/chunks`, {
      ...METHOD.PUT,
      body: fd
    });
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
