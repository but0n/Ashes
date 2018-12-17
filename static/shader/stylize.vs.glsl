attribute vec3 POSITION;
attribute vec3 NORMAL;
attribute vec2 TEXCOORD_0;
attribute vec3 TANGENT;
attribute vec3 COLOR_0;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform mat4 nM;

varying vec3 normal;
varying vec2 uv;
varying vec4 pos;
varying vec3 color;


void main() {
  uv = TEXCOORD_0;
  vec4 position = vec4(POSITION, 1);
  pos = position;
  normal = normalize((nM * vec4(NORMAL, 1)).xyz);
  gl_Position = P * V * M * position;
}