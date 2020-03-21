#version 300 es
precision mediump float;

in mediump vec2 vUV;

uniform sampler2D sampler;
uniform vec4 color; //TODO: remove after using this shader only for chunks rendering 
// layout(location = 0) out vec4 outColor0;
// layout(location = 1) out vec4 outColor1;
out vec4 outColor;

void main() {
    vec4 texture = texture(sampler, vUV);
	outColor = texture * color; //foreground layer
    //texture.a = 1.;
    //outColor0 = texture; //background (without alpha)
}