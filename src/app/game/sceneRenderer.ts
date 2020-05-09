import { Layers, Entity } from './entities';
import { ExtendedShader } from './graphics/shader';
import { VBO_I } from './graphics/vbo';
import RendererBase from './graphics/rendererBase';
import Assets from '../common/assets';
import WorldMap from './worldMap';
import { ExtendedFramebuffer } from './graphics/framebuffer';
import { Palette } from '../common/colors';
import Chunk from './chunk';
import TextureModule from './graphics/texture';

const rectData = {
  vertex: [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1],
  faces: [0, 1, 2, 0, 2, 3]
};

export default class SceneRenderer extends RendererBase {
  private readonly VBO_RECT: VBO_I;
  private readonly shaders: { post: ExtendedShader; main: ExtendedShader };
  private readonly framebuffers: { background: ExtendedFramebuffer; foreground: ExtendedFramebuffer };

  private shadowVector: Float32Array | null = null;

  constructor() {
    super();

    this.shaders = {
      post: this.shaderModule.create(this.GL, Assets.shaders.post),
      main: this.shaderModule.create(this.GL, Assets.shaders.main)
    };

    this.framebuffers = {
      background: this.framebufferModule.create(this.GL, { fullscreen: true, linear: true }),
      foreground: this.framebufferModule.create(this.GL, { fullscreen: true, linear: true })
    };

    this.VBO_RECT = this.vboModule.create(this.GL, rectData);

    this.updateShadowVector();
  }

  //TODO: allow user to control shadow angle
  private updateShadowVector(w = window.innerWidth, h = window.innerHeight) {
    const len = Math.sqrt(w * w + h * h);
    const normalized = [-h / len, w / len];

    if (!this.shadowVector) {
      this.shadowVector = new Float32Array(normalized);
    }
    this.shadowVector.set(normalized);
  }

  protected resize(w = window.innerWidth, h = window.innerHeight) {
    super.resize(w, h);
    this.updateShadowVector(w, h);
  }

  private prepareSceneFramebuffer(map: WorldMap) {
    super.clear(0, 0, 0);
    this.shaders.main.bind();
    this.VBO_RECT.bind();

    TextureModule.active(this.GL, 0);
    this.shaderModule.uniformInt(this.GL, 'sampler', 0);

    this.shaderModule.uniformFloat(this.GL, 'aspect', this.aspect);
    this.shaderModule.uniformVec3(this.GL, 'camera', map.camera.buffer);
  }

  private synchronizeChunkTextures(chunk: Chunk) {
    if (chunk.needTextureUpdate()) {
      //updating webgl texture
      //console.log('updating chunk:', chunk_ref);

      if (!chunk.hasWebGLTexturesGenerated) {
        chunk.setTextures(
          TextureModule.createFrom(this.GL, chunk.canvases.background, true),
          TextureModule.createFrom(this.GL, chunk.canvases.foreground, true)
        );
      } else {
        chunk.updateTexture();
      }
    }
  }

  private renderEntities(layer: { [_: string]: Entity }) {
    for (const entityName in layer) {
      if (!layer[entityName].objects.length) {
        continue; //skip empty entity
      }

      layer[entityName].bindTexture(this.GL);

      for (const object of layer[entityName].objects) {
        this.shaderModule.uniformVec4(this.GL, 'color', object.color.buffer);
        this.shaderModule.uniformMat3(this.GL, 'u_matrix', object.buffer);
        this.VBO_RECT.draw();
      }
    }
  }

  private renderBackgroundPass(map: WorldMap) {
    this.framebuffers.background.renderToTexture();
    this.prepareSceneFramebuffer(map);
    this.shaderModule.uniformVec4(this.GL, 'color', Palette.WHITE.buffer);

    for (const column of map.chunks) {
      for (const chunk of column) {
        if (!chunk?.isLoaded()) {
          continue;
        }

        this.synchronizeChunkTextures(chunk);

        chunk.bindBackgroundTexture();

        this.shaderModule.uniformMat3(this.GL, 'u_matrix', chunk.matrix.buffer);
        this.VBO_RECT.draw();
      }
    }
    this.renderEntities(map.entities.getLayer(Layers.BACKGROUND));

    this.framebuffers.background.stopRenderingToTexture();
  }

  private renderForegroundPass(map: WorldMap) {
    this.framebuffers.foreground.renderToTexture();
    this.prepareSceneFramebuffer(map);
    this.shaderModule.uniformVec4(this.GL, 'color', Palette.WHITE.buffer);

    for (const column of map.chunks) {
      for (const chunk of column) {
        if (!chunk?.isLoaded()) {
          continue;
        }

        this.synchronizeChunkTextures(chunk);

        chunk.bindForegroundTexture();

        this.shaderModule.uniformMat3(this.GL, 'u_matrix', chunk.matrix.buffer);
        this.VBO_RECT.draw();
      }
    }
    this.renderEntities(map.entities.getLayer(Layers.FOREGROUND));

    this.framebuffers.foreground.stopRenderingToTexture();
  }

  render(map: WorldMap) {
    this.renderBackgroundPass(map);
    this.renderForegroundPass(map);

    this.shaders.post.bind();
    this.VBO_RECT.bind();

    TextureModule.active(this.GL, 0);
    this.shaderModule.uniformInt(this.GL, 'background_pass', 0);
    this.framebuffers.background.bindTexture();

    TextureModule.active(this.GL, 1);
    this.shaderModule.uniformInt(this.GL, 'foreground_pass', 1);
    this.framebuffers.foreground.bindTexture();

    this.shadowVector && this.shaderModule.uniformVec2(this.GL, 'offset', this.shadowVector);
    this.shaderModule.uniformVec3(this.GL, 'camera', map.camera.buffer);
    this.shaderModule.uniformFloat(this.GL, 'aspect', this.aspect);

    this.VBO_RECT.draw();
  }
}
