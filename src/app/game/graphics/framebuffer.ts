interface FramebufferOptions {
  linear: boolean;
  width?: number;
  height?: number;
  fullscreen?: boolean;
}

export interface ExtendedFramebuffer {
  framebuffer: WebGLFramebuffer;
  webglTexture: WebGLTexture;
  linear: boolean;
  updateTextureResolution(w: number, h: number): void;
  renderToTexture(): void;
  stopRenderingToTexture(): void;
  bindTexture(): void;
  destroy(): void;
}

export interface FramebufferMultiOptions extends FramebufferOptions {
  texturesCount?: number;
}

export default class FramebufferModule {
  private fullscreenFramebuffers: ExtendedFramebuffer[] = [];
  private current: WebGLFramebuffer | null = null;

  createMulti(GL: WebGL2RenderingContext, options: FramebufferMultiOptions): ExtendedFramebuffer {
    const linear = options.linear === undefined ? true : options.linear; //default
    const width = options.fullscreen ? window.innerWidth : options.width || 0;
    const height = options.fullscreen ? window.innerHeight : options.height || 0;
    const texturesCount = options.texturesCount ?? 1;

    GL.activeTexture(GL.TEXTURE0);
    const webglTexture = GL.createTexture();
    if (webglTexture === null) throw new Error('Cannot create WebGLTexture');
    GL.bindTexture(GL.TEXTURE_2D_ARRAY, webglTexture);
    GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_BASE_LEVEL, 0);
    GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_MAX_LEVEL, 0);
    GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.texImage3D(GL.TEXTURE_2D_ARRAY, 0, GL.RGBA8, width, height, texturesCount, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

    const fb = GL.createFramebuffer();
    if (fb === null) throw new Error('Cannot create FrameBuffer');

    GL.bindFramebuffer(GL.DRAW_FRAMEBUFFER, fb);
    const drawBuffers = new Array(texturesCount);

    for (let t = 0; t < texturesCount; t++) {
      drawBuffers[t] = GL.COLOR_ATTACHMENT0 + t;
      GL.framebufferTextureLayer(GL.DRAW_FRAMEBUFFER, GL.COLOR_ATTACHMENT0 + t, webglTexture, 0, t);
    }

    const status = GL.checkFramebufferStatus(GL.DRAW_FRAMEBUFFER);
    if (status !== GL.FRAMEBUFFER_COMPLETE) {
      console.error('fb status: ' + status.toString(16));
    }

    GL.drawBuffers(drawBuffers);
    GL.bindFramebuffer(GL.DRAW_FRAMEBUFFER, null);
    GL.bindTexture(GL.TEXTURE_2D, null);

    const self = this;

    const framebuffer: ExtendedFramebuffer = {
      framebuffer: fb,
      webglTexture,
      linear: linear,

      //changing framebuffer resolution
      updateTextureResolution: function(w, h) {
        GL.bindTexture(GL.TEXTURE_2D_ARRAY, webglTexture);
        GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_BASE_LEVEL, 0);
        GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_MAX_LEVEL, 0);
        GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D_ARRAY, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
        GL.texImage3D(GL.TEXTURE_2D_ARRAY, 0, GL.RGBA8, w, h, texturesCount, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
      },
      renderToTexture: function() {
        self.current = this.framebuffer;
        GL.bindFramebuffer(GL.DRAW_FRAMEBUFFER, this.framebuffer);
      },

      stopRenderingToTexture: function() {
        self.current = null;
        GL.bindFramebuffer(GL.DRAW_FRAMEBUFFER, null);
      },

      bindTexture: function() {
        GL.bindTexture(GL.TEXTURE_2D_ARRAY, this.webglTexture);
      },

      destroy: function() {
        GL.deleteFramebuffer(this.framebuffer);
        GL.deleteTexture(this.webglTexture);

        const index = self.fullscreenFramebuffers.indexOf(this);
        if (index !== -1) self.fullscreenFramebuffers.splice(index, 1);
      }
    };

    if (options.fullscreen) this.fullscreenFramebuffers.push(framebuffer);

    return framebuffer;
  }

  create(GL: WebGLRenderingContext, options: FramebufferOptions): ExtendedFramebuffer {
    const linear = options.linear === undefined ? true : options.linear; //default
    const width = options.fullscreen ? window.innerWidth : options.width || 0;
    const height = options.fullscreen ? window.innerHeight : options.height || 0;

    const fb = GL.createFramebuffer();
    if (fb === null) throw new Error('Cannot create FrameBuffer');

    GL.bindFramebuffer(GL.FRAMEBUFFER, fb);

    const texture = GL.createTexture();
    if (texture === null) throw new Error('Cannot create WebGLTexture');

    GL.bindTexture(GL.TEXTURE_2D, texture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, linear ? GL.LINEAR : GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, linear ? GL.LINEAR : GL.NEAREST);

    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);

    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);

    const self = this;

    const framebuffer: ExtendedFramebuffer = {
      framebuffer: fb,
      webglTexture: texture,
      linear: linear,

      //changing framebuffer resolution
      updateTextureResolution: function(w, h) {
        GL.bindTexture(GL.TEXTURE_2D, this.webglTexture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, w, h, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, this.linear ? GL.LINEAR : GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, this.linear ? GL.LINEAR : GL.NEAREST);

        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
      },
      renderToTexture: function() {
        self.current = this.framebuffer;
        GL.bindFramebuffer(GL.FRAMEBUFFER, this.framebuffer);
      },
      stopRenderingToTexture: function() {
        self.current = null;
        GL.bindFramebuffer(GL.FRAMEBUFFER, null);
      },
      bindTexture: function() {
        GL.bindTexture(GL.TEXTURE_2D, this.webglTexture);
      },

      destroy: function() {
        GL.deleteFramebuffer(this.framebuffer);
        GL.deleteTexture(this.webglTexture);

        const index = self.fullscreenFramebuffers.indexOf(this);
        if (index !== -1) self.fullscreenFramebuffers.splice(index, 1);
      }
    };

    if (options.fullscreen) this.fullscreenFramebuffers.push(framebuffer);

    return framebuffer;
  }

  getFullscreenFramebuffers() {
    return this.fullscreenFramebuffers;
  }

  getCurrent() {
    return this.current;
  }
}
