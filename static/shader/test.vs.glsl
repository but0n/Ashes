#version 300 es

in vec3 POSITION;
in vec3 NORMAL;
in vec2 TEXCOORD_0;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

out vec3 normal;
out vec2 uv;

void main() {
  uv = TEXCOORD_0;
  vec4 pos = vec4(POSITION, 1);
  normal = normalize(NORMAL);
  // gl_Position = P * V * M * pos;
  gl_Position = pos;
}