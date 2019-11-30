#version 300 es
#extension GL_OES_texture_float : enable
#extension GL_OES_texture_float_linear : enable

precision highp float;

uniform int Frame;
uniform sampler2D base;
uniform sampler2D triangleTex;
uniform sampler2D LBVHTex;


#include <macros>

#define PI 3.14159265358979
#define GAMMA 2.2

out vec4 outColor;

// in vec3 normal;
// in vec2 uv;
// in vec2 uv1;
// in vec3 pos;
// in vec4 vColor;
// in mat3 TBN;



// texture stuff
vec4 sRGBtoLINEAR(vec4 color) {
    return vec4(pow(color.rgb, vec3(GAMMA)), color.a);
}
vec4 LINEARtoSRGB(vec4 color) {
    return vec4(pow(color.rgb, vec3(1.0/GAMMA)), color.a);
}

// Tone map
vec3 toneMapACES(vec3 color) {
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return pow(clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0), vec3(1.0/GAMMA));
}


void main() {
    // outColor = vec4(toneMapACES(color), 1);
    // outColor = vec4(0,0,0,1) + texture(base, gl_FragCoord.xy);
    vec2 uv = gl_FragCoord.xy * iResolution;

    vec3 col = vec3(1);


    vec3 ro = vec3(0,1,0); // Ray Origin Position

    vec3 ta = vec3(0,.2,0); // Target




    outColor = vec4(gl_FragCoord.xy * iResolution, 0, 1);
    // outColor = texture(triangleTex, uv);
    // outColor = texelFetch(LBVHTex, ivec2(gl_FragCoord.xy), 0);
}