import ShaderModule from './shader';
import { assert } from '../common/utils';

interface VertexBufferI {
  updateData(data: BufferSource): void;
  enableAttribute(attribName: string, size: number, stride: number, offset: number): void;
  bind(): void;
  destroy(): void;
  draw(count: number): void;
}

export interface VBO_I {
  facesLen: number;
  bind(): void;
  draw(): void;
  destroy(): void;
}

export default class VBOModule {
  private readonly shaderModule: ShaderModule;

  constructor(shaderModule: ShaderModule) {
    this.shaderModule = shaderModule;
  }

  create(GL: WebGLRenderingContext, data: { vertex: number[]; faces: number[] }): VBO_I {
    const vertex_buff = GL.createBuffer();
    const faces_buff = GL.createBuffer();

    //VERTEXES:
    GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(data.vertex), GL.STATIC_DRAW);

    //FACES:
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.faces), GL.STATIC_DRAW);

    const shaderModule = this.shaderModule;

    return {
      facesLen: data.faces.length,

      bind: function() {
        //binding
        GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);

        const currentShader = shaderModule.getCurrent();
        assert(currentShader !== null, 'No shader is currently bind');

        const _uv = GL.getAttribLocation(currentShader, 'uv');
        const _position = GL.getAttribLocation(currentShader, 'position');

        /*bytes(float) * 2values per vertex + 2 offset for uv coords*/
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4 * (2 + 2), 0);
        if (_uv !== -1) GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4 * (2 + 2), 4 * 2);
      },

      draw: function() {
        GL.drawElements(GL.TRIANGLE_FAN, this.facesLen, GL.UNSIGNED_SHORT, 0);
      },

      destroy: function() {
        GL.deleteBuffer(vertex_buff);
        GL.deleteBuffer(faces_buff);
      }
    };
    //return vbo;
  }

  //@count - number of values (size of buffer in floats)
  createVertexBuffer(GL: WebGLRenderingContext, count: number): VertexBufferI {
    const vertex_buff = GL.createBuffer();

    GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
    GL.bufferData(GL.ARRAY_BUFFER, count * 4, GL.STATIC_DRAW);

    //glBindBuffer(GL_ARRAY_BUFFER, 0);//unbind
    const shaderModule = this.shaderModule;

    return {
      updateData: function(data) {
        //@data - Float32Array
        GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
        //4 - bytes for float
        //GL.bufferData(GL.ARRAY_BUFFER, count, GL.STATIC_DRAW);
        GL.bufferSubData(GL.ARRAY_BUFFER, 0, data);
      },

      enableAttribute: function(attrib_name, size, stride, offset) {
        const currentShader = shaderModule.getCurrent();
        assert(currentShader !== null, 'No shader is currently bind');

        const attrib = GL.getAttribLocation(currentShader, attrib_name);
        if (attrib !== -1) GL.enableVertexAttribArray(attrib);
        GL.vertexAttribPointer(attrib, size, GL.FLOAT, false, 4 * stride, 4 * offset);
      },

      bind: function() {
        GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
      },

      destroy: function() {
        GL.deleteBuffer(vertex_buff);
      },

      draw: function(count) {
        GL.drawArrays(GL.POINTS, 0, count);
      }
    };
  }
}
