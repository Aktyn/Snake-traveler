import Config from './config';

const BASE_URL = `http://localhost:${Config.SERVER_PORT}`;

interface ChunkI {
  x: number;
  y: number;
  size: number;
  blocks: { x: number; y: number; z: number; type: number }[];
}

const API = {
  fetchChunk: (x: number, y: number): Promise<ChunkI> => {
    return fetch(`${BASE_URL}/chunk/${x}/${y}`, {
      method: 'GET',
      mode: 'cors'
    }).then(res => res.json());
  }
};

export default API;
