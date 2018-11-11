#version 300 es

in vec3 POSITION;
in vec3 NORMAL;

uniform mat4 u_matrix;

out vec3 normal;

void main() {
  vec4 pos = vec4(POSITION, 1);
  normal = NORMAL;
  gl_Position = u_matrix * pos;
}