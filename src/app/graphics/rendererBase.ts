import FramebufferModule from './framebuffer';
import ShaderModule from './shader';
import VBOModule from './vbo';

function loadContext(canvas: HTMLCanvasElement) {
  const noSupportMessage = 'No WebGL support. You are not able to play in this browser.';

  let GL: WebGL2RenderingContext;
  try {
    GL = canvas.getContext('webgl2', { antialias: false, alpha: false }) as WebGL2RenderingContext;

    if (!GL) throw new Error(noSupportMessage);
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
  protected GL: WebGL2RenderingContext;
  protected aspect = 1;

  protected framebufferModule = new FramebufferModule();
  protected shaderModule = new ShaderModule();
  protected vboModule = new VBOModule(this.shaderModule);

  constructor() {
    this.CANVAS = document.createElement('canvas');
    this.GL = loadContext(this.CANVAS);

    this.initListeners();
    this.resize();
  }

  destroy() {}

  protected resize(w = window.innerWidth, h = window.innerHeight) {
    this.aspect = w / h;

    this.CANVAS.width = w;
    this.CANVAS.height = h;
    this.GL = loadContext(this.CANVAS); //TODO: optimize by not reloading context every time

    for (const fb of this.framebufferModule.getFullscreenFramebuffers()) {
      fb.updateTextureResolution(w, h);
    }

    this.GL.viewport(0, 0, w, h);
  }

  private initListeners() {
    window.addEventListener('resize', event => {
      this.resize((event.target as Window)?.innerWidth, (event.target as Window)?.innerHeight);
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
