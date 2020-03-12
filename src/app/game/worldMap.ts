import Camera from './camera';
import API from '../common/api';
import Chunk from './chunk';
import Block from './block';
import LightSource from './lightSource';

export default class WorldMap {
  private startX: number;
  private startY: number;

  private cam: Camera;
  private chunks: Chunk[] = [];
  private lightSources: LightSource[] = [];

  constructor(startX?: number, startY?: number) {
    this.startX = startX || 0;
    this.startY = startY || 0;

    console.log(`Map starting point: [${this.startX}, ${this.startY}]`);

    this.cam = new Camera();
    this.cam.setPos(this.startX, this.startY);

    this.loadChunk(this.startX, this.startY).catch(console.error);

    this.lightSources.push(new LightSource(this.startX, this.startY, 4, 0xffffff));
  }

  private async loadChunk(x: number, y: number) {
    const chunkData = await API.fetchChunk(x, y);
    const chunk = new Chunk(chunkData.x, chunkData.y, chunkData.size);

    chunkData.blocks.forEach((block, index) => {
      //const x = index % chunkData.size;
      //const y = (index / chunkData.size) | 0; 
      chunk.objects.push(new Block(chunkData.x + block.x, chunkData.y + block.y, block.z, block.type));
    });

    this.chunks.push(chunk);
  }
}
