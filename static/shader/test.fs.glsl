#version 300 es
precision mediump float;

in vec3 normal;
in vec2 uv;


out vec4 outColor;

void main() {
    outColor = vec4(0, 1, 0, 1);
    // outColor = vec4(uv, 1, 1);
    // outColor = vec4(normal, 1);
}