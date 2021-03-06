#version 300 es
precision mediump float;

in vec2 position;
in vec2 uv;//uv texture coordinates

uniform mat3 u_matrix;
uniform float aspect;

uniform vec3 camera;

out vec2 vUV;

void main() {
  vec2 pos = ( (u_matrix * vec3(position.x, position.y, 1.)).xy - camera.xy ) * camera.z;
	gl_Position = vec4(pos.x / aspect, pos.y, 0., 1.);
	vUV = uv;
}