import Chunk from './chunk';
import Vec2 from '../common/math/vec2';

export default class Painter {
  clearCircle(chunks: Chunk[][], centerChunkPos: Vec2, x: number, y: number, radius: number) {
    const left = (centerChunkPos.x - Chunk.GRID_SIZE_X) * Chunk.SIZE * 2 - Chunk.SIZE;
    const bottom = -(centerChunkPos.y - Chunk.GRID_SIZE_Y) * Chunk.SIZE * 2 + Chunk.SIZE;

    const chunkStartX = ((x - radius - left) / (Chunk.SIZE * 2)) | 0;
    const chunkStartY = (-(y + radius - bottom) / (Chunk.SIZE * 2)) | 0;

    const chunkEndX = ((x + radius - left) / (Chunk.SIZE * 2)) | 0;
    const chunkEndY = (-(y - radius - bottom) / (Chunk.SIZE * 2)) | 0;

    for (let xx = chunkStartX; xx <= chunkEndX; xx++) {
      for (let yy = chunkStartY; yy <= chunkEndY; yy++) {
        const chunk = chunks[xx]?.[yy];

        if (!chunk || !chunk.isLoaded()) {
          return;
        }

        const pX = (((x - (chunk.matrix.x - Chunk.SIZE)) / (Chunk.SIZE * 2)) * Chunk.RESOLUTION) | 0;
        const pY = ((1 - (y - (chunk.matrix.y - Chunk.SIZE)) / (Chunk.SIZE * 2)) * Chunk.RESOLUTION) | 0;

        chunk.context.foreground.fillStyle = '#fff';
        chunk.context.foreground.beginPath();
        chunk.context.foreground.arc(pX, pY, radius * Chunk.RESOLUTION, 0, Math.PI * 2, false);
        chunk.context.foreground.fill();

        chunk.updateFlags.needForegroundTextureUpdate = true;
        chunk.updateFlags.needForegroundImageDataUpdate = true;
      }
    }
  }
}
