precision highp float;

#include <macros>

#define PI 3.14159265358979
#define GAMMA 2.2

varying vec3 normal;
varying vec2 uv;
varying vec2 uv1;
varying vec3 pos;
varying vec4 vColor;
varying mat3 TBN;


uniform sampler2D brdfLUT;

#ifdef HAS_EMISSIVE_MAP
#ifndef emissiveTexture_uv
#define emissiveTexture_uv uv
#endif
uniform sampler2D emissiveTexture;
#endif

#ifdef HAS_NORMAL_MAP
#ifndef normalTexture_uv
#define normalTexture_uv uv
#endif
uniform sampler2D normalTexture;
#endif

#ifdef HAS_BASECOLOR_MAP
#ifndef baseColorTexture_uv
#define baseColorTexture_uv uv
#endif
uniform sampler2D baseColorTexture;
#endif

#ifdef HAS_METALLIC_ROUGHNESS_MAP
#ifndef metallicRoughnessTexture_uv
#define metallicRoughnessTexture_uv uv
#endif
uniform sampler2D metallicRoughnessTexture;
#endif

#ifdef HAS_AO_MAP
#ifndef occlusionTexture_uv
#define occlusionTexture_uv uv
#endif
uniform sampler2D occlusionTexture;
#endif

#ifdef HAS_ENV_MAP
uniform samplerCube env;
#endif

uniform vec3 u_Camera;

// texture stuff
vec4 sRGBtoLINEAR(vec4 color) {
    return vec4(pow(color.rgb, vec3(GAMMA)), color.a);
}
vec4 LINEARtoSRGB(vec4 color) {
    return vec4(pow(color.rgb, vec3(1.0/GAMMA)), color.a);
}

void main() {
    gl_FragColor = vec4(0, 1, 0.2, 0.23);
}