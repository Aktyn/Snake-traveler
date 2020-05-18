#version 300 es
precision mediump float;

in mediump vec2 vUV;

uniform sampler2D sampler;
uniform vec4 color;

out vec4 outColor;

void main() {
    vec4 texture = texture(sampler, vUV);
	outColor = texture * color;
}