#version 300 es
precision lowp float;

in vec2 position;
in vec2 uv;//uv texture coordinates

out vec2 vUV;

void main() {
	gl_Position = vec4(position.x, position.y, 0.0, 1.0);
	vUV = uv;
}