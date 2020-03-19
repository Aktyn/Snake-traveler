import FramebufferModule from './framebuffer';
import TextureModule from './texture';
import ShaderModule from './shader';
import VBOModule from './vbo';

//TODO: refactor
function loadContext(canvas: HTMLCanvasElement) {
  const noSupportMessage = 'No WebGL support. You are not able to play in this browser.';

  let GL: WebGLRenderingContext;
  try {
    //premultipliedAlpha
    GL = canvas.getContext('webgl', { antialias: true, alpha: false }) as WebGLRenderingContext;

    /*EXT = 	GL.getExtension('WEBGL_draw_buffers') ||
				GL.getExtension("OES_draw_buffer") ||
					GL.getExtension("MOZ_OES_draw_buffer") ||
				GL.getExtension("WEBKIT_OES_draw_buffer");*/
    if (!GL) throw new Error(noSupportMessage);
    //if(!EXT)
    //	throw new Error('Browser does not support "draw buffers" webgl extension');
  } catch (e) {
    console.error(e);

    alert(noSupportMessage);
    throw new Error(noSupportMessage);
  }

  GL.colorMask(true, true, true, true);

  GL.enable(GL.BLEND);
  GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
  GL.viewport(0, 0, canvas.width, canvas.height);

  return GL;
}

export default class RendererBase {
  private CANVAS: HTMLCanvasElement;
  protected GL: WebGLRenderingContext;
  private aspect = 1;

  protected framebufferModule = new FramebufferModule();
  protected textureModule = new TextureModule();
  protected shaderModule = new ShaderModule();
  protected vboModule = new VBOModule(this.shaderModule);

  constructor() {
    this.CANVAS = document.createElement('canvas');
    this.GL = loadContext(this.CANVAS);

    this.initListeners();
    this.resize();
  }

  private resize() {
    this.aspect = window.innerWidth / window.innerHeight;

    this.CANVAS.width = window.innerWidth;
    this.CANVAS.height = window.innerHeight;
    this.GL = loadContext(this.CANVAS); //TODO: optimize by not reloading context every time

    for (const fb of this.framebufferModule.getFullscreenFramebuffers()) {
      fb.updateTextureResolution(this.CANVAS.width, this.CANVAS.height);
    }

    this.GL.viewport(0, 0, this.CANVAS.width, this.CANVAS.height);
  }

  private initListeners() {
    window.addEventListener('resize', event => {
      this.resize();
    });
  }

  initDisplay(targetElement: HTMLElement) {
    this.CANVAS.setAttribute('moz-opaque', '');
    Object.assign(this.CANVAS.style, {
      //background: 'none',
      'user-select': 'none',
      pointerEvents: 'none'
    });

    this.GL = loadContext(this.CANVAS);
    targetElement.appendChild(this.CANVAS);
  }

  enableAdditiveBlending(enable: boolean) {
    if (enable) {
      this.GL.blendFunc(this.GL.SRC_ALPHA, this.GL.ONE);
    } else {
      this.GL.blendFunc(this.GL.SRC_ALPHA, this.GL.ONE_MINUS_SRC_ALPHA);
    }
  }

  clear(r: number, g: number, b: number) {
    this.GL.clearColor(r, g, b, 0);
    this.GL.clear(this.GL.COLOR_BUFFER_BIT);
  }
}