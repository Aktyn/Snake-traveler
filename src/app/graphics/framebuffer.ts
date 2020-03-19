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

export default class FramebufferModule {
  private fullscreenFramebuffers: ExtendedFramebuffer[] = [];
  private current: WebGLFramebuffer | null = null;

  create(GL: WebGLRenderingContext, options: FramebufferOptions): ExtendedFramebuffer {
    const linear = options.linear === undefined ? true : options.linear; //default
    const width = options.width || 0;
    const height = options.height || 0;

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

    //GL.generateMipmap(GL.TEXTURE_2D);
    //var buffers = [];
    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
    //buffers.push(EXT.COLOR_ATTACHMENT0_WEBGL);

    //EXT.drawBuffersWEBGL(buffers);//... [EXT.COLOR_ATTACHMENT0_WEBGL] instead of buffers
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
