#version 300 es
#extension GL_OES_texture_float : enable
#extension GL_OES_texture_float_linear : enable

precision highp float;

uniform sampler2D base;
uniform sampler2D test;

#include <macros>

#define PI 3.14159265358979
#define GAMMA 2.2

out vec4 outColor;


// Tone map
vec3 toneMapACES(vec3 color) {
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return pow(clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0), vec3(1.0/GAMMA));
}

#define EXPOSURE 1.2

void main() {

    vec4 data = texelFetch(test, ivec2(gl_FragCoord), 0);

    outColor = vec4(toneMapACES(data.rgb / data.w * EXPOSURE), 1);
}