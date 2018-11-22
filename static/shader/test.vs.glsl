#version 300 es

in vec3 POSITION;
in vec3 NORMAL;
in vec2 TEXCOORD_0;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

out vec3 normal;
out vec2 uv;
out vec4 pos;

void main() {
  uv = TEXCOORD_0;
  vec4 position = vec4(POSITION, 1);
  pos = position;
  normal = normalize(NORMAL);
  gl_Position = P * V * M * position;
}