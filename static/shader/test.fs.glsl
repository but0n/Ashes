#version 300 es
precision mediump float;

in vec3 normal;


out vec4 outColor;

void main() {
    outColor = vec4(0, 1, 1, 1);
    // outColor = vec4(normal, 1);
}