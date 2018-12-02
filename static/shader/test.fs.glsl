#version 300 es
precision mediump float;

in vec3 normal;
in vec2 uv;
in vec4 pos;
in vec3 color;


out vec4 outColor;

void main() {
    vec3 lightDir = normalize(vec3(-10, -10, 10) - pos.xyz);
    float LoN = dot(normal, lightDir);
    // outColor = vec4(uv, 1, 1);
    outColor = vec4(vec3(1) * max(LoN, 0.0) + vec3(0.3), 1);
    // outColor = vec4(normal, 1);
}