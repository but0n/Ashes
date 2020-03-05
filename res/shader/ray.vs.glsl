#version 300 es
#include <macros>

#define SHADER_NAME ray_vs

in vec3 POSITION;



// uniform mat4 M;

// out mat4 camMat;


// out vec3 normal;
// out vec2 uv;
// out vec2 uv1;
// out vec3 pos;
// out vec4 vColor;
// out mat3 TBN;


void main() {
    gl_Position = vec4(POSITION, 1);
}