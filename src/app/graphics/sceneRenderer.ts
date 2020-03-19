import { ExtendedShader } from './shader';
import { VBO_I } from './vbo';
import RendererBase from './rendererBase';
import { onAssetsLoaded } from './assets';
import { assert } from '../common/utils';

const rectData = {
  vertex: [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1],
  faces: [0, 1, 2, 0, 2, 3]
};

class SceneRenderer extends RendererBase {
  private readonly VBO_RECT: VBO_I;
  private shaders: { post: ExtendedShader } | null = null;

  constructor() {
    super();

    onAssetsLoaded(Assets => {
      this.shaders = {
        post: this.shaderModule.create(this.GL, Assets.shaders.post)
      };
    });

    const rect = this.vboModule.create(this.GL, rectData);
    this.VBO_RECT = rect;
  }

  render() {
    assert(this.shaders, 'Shaders are not loaded');
    //TODO
    //this.renderer.render(this.scene, this.camera);
    super.clear(0.05, 0.1, 0.15);

    this.shaders.post.bind();
    this.VBO_RECT.bind();

    //TODO

    this.VBO_RECT.draw();
  }
}

const sceneRenderer = new SceneRenderer();
export default sceneRenderer;
