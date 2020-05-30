import { Biomes } from './colors';
import Config from './config';
import { WorldSchema } from './schemas';

const BASE_URL = `${window.location.protocol}//${window.location.hostname}:${Config.SERVER_PORT}`;

export enum CustomError {
  TIMEOUT
}

const METHOD = {
  GET: {
    method: 'GET'
  } as RequestInit,
  DELETE: {
    method: 'DELETE'
  } as RequestInit,
  POST: {
    method: 'POST'
  } as RequestInit,
  PUT: {
    method: 'PUT'
  } as RequestInit,
  PATCH: {
    method: 'PATCH'
  } as RequestInit
};

for (const methodName in METHOD) {
  Object.assign(METHOD[methodName as keyof typeof METHOD], {
    mode: 'cors'
  } as RequestInit);
}

export interface ChunkUpdateData {
  worldId: string;
  x: number;
  y: number;
  foregroundData: Blob;
}

const request = (
  url: string,
  method: RequestInit,
  options?: { body?: string | FormData; headers?: Headers | Record<string, string> }
) =>
  new Promise<Response>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(CustomError.TIMEOUT);
    }, 45 * 1000);

    fetch(`${BASE_URL}${url}`, options ? { ...method, ...options } : method)
      .then(res => {
        clearTimeout(timeout);
        resolve(res);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });

const API = {
  ping() {
    return request('/ping', METHOD.GET).then(res => res.text);
  },

  fetchChunk(worldId: string, x: number, y: number, size: number): Promise<ArrayBuffer> {
    return request(`/worlds/${worldId}/chunks/${x}/${y}/${size}/${Biomes.length}`, METHOD.GET).then(res =>
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

    return request(`/worlds/chunks`, METHOD.PUT, { body: fd });
  },

  updateWorldData(worldId: string, { data }: WorldSchema) {
    return request(`/worlds/${worldId}/playerPos`, METHOD.PATCH, {
      body: JSON.stringify({ data }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  getWorlds(): Promise<WorldSchema[]> {
    return request('/worlds', METHOD.GET).then(res => res.json());
  },

  deleteWorld(worldId: string) {
    return request(`/worlds/${worldId}`, METHOD.DELETE).then(res => res.text());
  },

  resetWorld(worldId: string) {
    return request(`/worlds/${worldId}/reset`, METHOD.POST).then(res => res.json());
  },

  generateWorld(name: string, seed: string) {
    return request(`/worlds`, METHOD.POST, {
      body: JSON.stringify({ name, seed }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  }
};

export default API;
