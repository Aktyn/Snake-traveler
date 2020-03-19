//CREATE GL OBJECT SHADER BY SHADER TYPE AND ITS SOURCE
function getShader(GL: WebGLRenderingContext, source: string, type: number) {
  const shader = GL.createShader(type);
  if (shader === null) throw new Error('Cannot create WebGLShader');

  GL.shaderSource(shader, source);
  GL.compileShader(shader);
  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.error(
      'ERROR IN ' + (type === GL.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT') + ' SHADER : ' + GL.getShaderInfoLog(shader)
    );
    return false;
  }
  return shader;
}

//CREATE GL OBJECT SHADER FROM GIVEN SHADER SOURCES
function compileShader(GL: WebGLRenderingContext, vertex_source: string, fragment_source: string) {
  const shader_vertex = getShader(GL, vertex_source, GL.VERTEX_SHADER);
  const shader_fragment = getShader(GL, fragment_source, GL.FRAGMENT_SHADER);

  if (!shader_vertex || !shader_fragment) return false;

  const SHADER_PROGRAM = GL.createProgram();
  if (SHADER_PROGRAM === null) throw new Error('Cannot create SHADER PROGRAM');

  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);

  GL.linkProgram(SHADER_PROGRAM);

  const _uv = GL.getAttribLocation(SHADER_PROGRAM, 'uv');
  const _position = GL.getAttribLocation(SHADER_PROGRAM, 'position');
  const _color = GL.getAttribLocation(SHADER_PROGRAM, 'color');
  if (_uv !== -1) GL.enableVertexAttribArray(_uv);
  if (_color !== -1) GL.enableVertexAttribArray(_color);
  GL.enableVertexAttribArray(_position);

  GL.useProgram(SHADER_PROGRAM);
  return SHADER_PROGRAM;
}

export interface ExtendedShader {
  program: WebGLProgram;
  bind(): void;
  destroy(): void;
}

export default class ShaderModule {
  private currentShaderProgram: WebGLProgram | null = null;

  create(GL: WebGLRenderingContext, sources: { vertex: string; fragment: string }): ExtendedShader {
    if (GL === undefined) throw new Error('GL context required');

    const compiled_program = compileShader(GL, sources.vertex, sources.fragment);

    const self = this;

    return {
      program: compiled_program,
      bind: function() {
        GL.useProgram(this.program);
        self.currentShaderProgram = this.program;
      },
      destroy: function() {
        GL.deleteProgram(this.program);
      }
    };
  }

  getCurrent() {
    return this.currentShaderProgram;
  }

  private uniformLoc(GL: WebGLRenderingContext, name: string) {
    return GL.getUniformLocation(this.currentShaderProgram as WebGLProgram, name);
  }

  //UNIFORMS
  uniformInt(GL: WebGLRenderingContext, name: string, value: number) {
    GL.uniform1i(this.uniformLoc(GL, name), value);
  }
  uniformFloat(GL: WebGLRenderingContext, name: string, value: number) {
    GL.uniform1f(this.uniformLoc(GL, name), value);
  }

  //accepts Float32Array
  uniformVec4(GL: WebGLRenderingContext, name: string, value: Float32Array) {
    GL.uniform4fv(this.uniformLoc(GL, name), value);
  }
  uniformVec3(GL: WebGLRenderingContext, name: string, value: Float32Array) {
    GL.uniform3fv(this.uniformLoc(GL, name), value);
  }
  uniformVec2(GL: WebGLRenderingContext, name: string, value: Float32Array) {
    GL.uniform2fv(this.uniformLoc(GL, name), value);
  }
  uniformMat3(GL: WebGLRenderingContext, name: string, value: Float32Array) {
    GL.uniformMatrix3fv(this.uniformLoc(GL, name), false, value);
  }
}
