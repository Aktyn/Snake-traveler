const mipmap = true;

function powerOfTwo(n: number) {
  return (n & (n - 1)) === 0;
}

export interface ExtendedTexture {
  webglTexture: WebGLTexture;
  update(pixels: TexImageSource, linear: boolean): void;
  bind(): void;
  destroy(): void;
}

function stitchTextureObject(GL: WebGL2RenderingContext, texture: WebGLTexture): ExtendedTexture {
  return {
    webglTexture: texture,
    //fb: null,//framebuffer
    update: function(pixels, linear) {
      this.bind();

      // console.time("texture update test");
      // GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
      GL.texSubImage2D(GL.TEXTURE_2D, 0, 0, 0, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, linear ? GL.LINEAR : GL.NEAREST);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, linear ? GL.LINEAR : GL.NEAREST);
      //if(mipmap)
      //	GL.generateMipmap(GL.TEXTURE_2D);
      //
      // console.timeEnd("texture update test");
    },
    bind: function() {
      GL.bindTexture(GL.TEXTURE_2D, this.webglTexture);
    },
    destroy: function() {
      if (this.webglTexture !== null) GL.deleteTexture(this.webglTexture);
      //if(this.fb != null)
      //	GL.deleteFramebuffer(this.fb);
    }
  };
}

export default class TextureModule {
  createFrom(GL: WebGL2RenderingContext, image: ImageData | HTMLCanvasElement | HTMLImageElement, linear = true) {
    const texture = GL.createTexture();
    if (texture === null) throw new Error('Cannot create WebGLTexture');

    GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
    GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    GL.bindTexture(GL.TEXTURE_2D, texture);

    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);

    //if image width and height are powers of two
    const filter = linear ? GL.LINEAR : GL.NEAREST;
    if (powerOfTwo(image.width) && powerOfTwo(image.height)) {
      const mipmap_filter = linear ? GL.LINEAR_MIPMAP_LINEAR : GL.NEAREST_MIPMAP_NEAREST;
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, filter);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, mipmap ? mipmap_filter : filter);
    } else {
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, filter);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, filter);
    }
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

    if (mipmap) GL.generateMipmap(GL.TEXTURE_2D);

    GL.bindTexture(GL.TEXTURE_2D, null);

    return stitchTextureObject(GL, texture);
  }

  active(GL: WebGL2RenderingContext, number = 0) {
    GL.activeTexture(GL.TEXTURE0 + number);
  }

  /*unbind: function() {
		GL.bindTexture(GL.TEXTURE_2D, null);
	}*/
}
