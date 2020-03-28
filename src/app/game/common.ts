import Chunk from './chunk';
import Vec2 from '../common/math/vec2';

export function getChunkAtPosition(x: number, y: number, chunks: Chunk[][], centerChunkPos: Vec2) {
  const left = (centerChunkPos.x - Chunk.GRID_SIZE_X) * Chunk.SIZE * 2 - Chunk.SIZE;
  const bottom = -(centerChunkPos.y - Chunk.GRID_SIZE_Y) * Chunk.SIZE * 2 + Chunk.SIZE;

  const chunkX = ((x - left) / (Chunk.SIZE * 2)) | 0;
  const chunkY = (-(y - bottom) / (Chunk.SIZE * 2)) | 0;

  return chunks[chunkX]?.[chunkY];
}
