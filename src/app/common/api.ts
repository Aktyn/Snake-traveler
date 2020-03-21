import { Biomes } from './colors';
import Config from './config';

const BASE_URL = `http://localhost:${Config.SERVER_PORT}`;

const API = {
  fetchChunk: (x: number, y: number, size: number): Promise<ArrayBuffer> => {
    return fetch(`${BASE_URL}/chunk/${x}/${y}/${size}/${Biomes.length}`, {
      method: 'GET',
      mode: 'cors'
    }).then(res => res.arrayBuffer());
  }
};

export default API;
