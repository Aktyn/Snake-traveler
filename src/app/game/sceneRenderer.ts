import { ExtendedShader } from '../graphics/shader';
import { VBO_I } from '../graphics/vbo';
import RendererBase from '../graphics/rendererBase';
import Assets from '../graphics/assets';
import WorldMap from './worldMap';
import { ExtendedFramebuffer } from '../graphics/framebuffer';
import { Palette } from '../common/colors';
import { assert } from '../common/utils';

const rectData = {
  vertex: [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1],
  faces: [0, 1, 2, 0, 2, 3]
};

export default class SceneRenderer extends RendererBase {
  private readonly VBO_RECT: VBO_I;
  private readonly shaders: { post: ExtendedShader; main: ExtendedShader };
  private readonly framebuffers: { paint: ExtendedFramebuffer };

  private readonly cameraBuff = new Float32Array([0, 0, 1]); //TODO: make camera object

  constructor() {
    super();

    this.shaders = {
      post: this.shaderModule.create(this.GL, Assets.shaders.post),
      main: this.shaderModule.create(this.GL, Assets.shaders.main)
    };

    this.framebuffers = {
      paint: this.framebufferModule.create(this.GL, { fullscreen: true, linear: true })
    };

    const rect = this.vboModule.create(this.GL, rectData);
    this.VBO_RECT = rect;
  }

  private prepareSceneFramebuffer() {
    super.clear(0, 0, 0);
    this.shaders.main.bind();
    this.VBO_RECT.bind();

    this.textureModule.active(this.GL, 0);
    this.shaderModule.uniformInt(this.GL, 'sampler', 0);

    this.shaderModule.uniformFloat(this.GL, 'aspect', this.aspect);
    this.shaderModule.uniformVec3(this.GL, 'camera', this.cameraBuff);
  }

  render(map: WorldMap) {
    this.framebuffers.paint.renderToTexture();
    this.prepareSceneFramebuffer();
    this.shaderModule.uniformVec4(this.GL, 'color', Palette.WHITE.buffer);

    for (const chunk of map.chunks) {
      if (!chunk.isLoaded()) {
        continue;
      }

      if (chunk.needTextureUpdate) {
        //updating webgl texture
        //console.log('updating chunk:', chunk_ref);

        if (!chunk.webglTexture) {
          assert(chunk.canvas, 'There is no generated canvas for chunk');

          chunk.setTexture(this.textureModule.createFrom(this.GL, chunk.canvas, true));
        } else {
          console.log('updating canvas texture');
          chunk.updateTexture();
        }
      }

      chunk.webglTexture?.bind();

      this.shaderModule.uniformMat3(this.GL, 'u_matrix', chunk.matrix.buffer);
      this.VBO_RECT.draw();
    }
    this.framebuffers.paint.stopRenderingToTexture();

    this.shaders.post.bind();
    this.VBO_RECT.bind();

    //drawing paint layer
    this.textureModule.active(this.GL, 1);
    this.shaderModule.uniformInt(this.GL, 'curves_pass', 1);
    this.framebuffers.paint.bindTexture();

    this.VBO_RECT.draw();
  }
}
