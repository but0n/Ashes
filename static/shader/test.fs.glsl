#version 300 es
precision mediump float;

in vec3 normal;
in vec2 uv;
in vec4 pos;


out vec4 outColor;

void main() {
    vec3 lightDir = normalize(vec3(1, 1, 1) - pos.xyz);
    float LoN = dot(normal, lightDir);
    // outColor = vec4(0, 1, 1, 1);
    // outColor = vec4(uv, 1, 1);
    outColor = vec4(vec3(1, 1, 1) * max(LoN, 0.1), 1);
}