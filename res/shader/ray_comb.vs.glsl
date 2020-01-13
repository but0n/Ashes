#version 300 es
#include <macros>

in vec3 POSITION;

void main() {
    gl_Position = vec4(POSITION, 1);
}