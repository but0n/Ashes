#version 300 es
#define USE_HDR
#ifdef USE_HDR
#extension GL_OES_texture_float : enable
#extension GL_OES_texture_float_linear : enable
#endif
precision highp float;

#include <macros>

#define PI 3.14159265358979
#define GAMMA 2.2

out vec4 outColor;

in vec3 normal;
in vec2 uv;
in vec2 uv1;
in vec3 pos;
in vec4 vColor;
in mat3 TBN;

uniform vec3 u_irrSH[9];

#ifdef HAS_ENV_MAP
uniform samplerCube env;
#endif

uniform vec3 u_Camera;

#ifdef USE_HDR
#ifdef HAS_EXPUSRE
uniform float u_Exposure;
#else
#define u_Exposure 1.
#endif
#endif

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




// spherical harmonics
vec3 diffuseSH(const in vec3 n) {
    return max(vec3(0),
        u_irrSH[0] +
        u_irrSH[1] * n.y +
        u_irrSH[2] * n.z +
        u_irrSH[3] * n.x +
        u_irrSH[4] * n.y * n.x +
        u_irrSH[5] * n.y * n.z +
        u_irrSH[6] * (3.0 * n.z * n.z - 1.0) +
        u_irrSH[7] * (n.z * n.x) +
        u_irrSH[8] * (n.x * n.x - n.y * n.y));
}

// decode RGBE data after LOD due to RGB32F mipmap issue
vec3 decoRGBE(vec4 r) {
    if(r.a != 0.) {
        r *= 255.;
        float e = pow(2., r.a - 128. - 8.);
        return vec3(
            r.r * e,
            r.g * e,
            r.b * e
        );
    }
    return vec3(0);
}


void main() {
    vec3 sh = diffuseSH(normalize(pos)) * .05;
    outColor = vec4(toneMapACES(sh), 1);
    // outColor = LINEARtoSRGB(vec4(sh, 1));
    // outColor = vec4(diffuseSH(normalize(pos) * .1), 1);
#ifdef HAS_ENV_MAP
    outColor = vec4(toneMapACES(decoRGBE(texture(env, pos, 0.)) * 1.5), 1);
#endif
}
