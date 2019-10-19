#version 300 es
// #define USE_HDR
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

#ifdef USE_HDR
uniform float u_Exposure;
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

// Fresnel - F0 = Metalness
vec3 F_Schlick(float VoH, vec3 F0) {
    return F0 + (vec3(1) - F0) * pow(1.0 - VoH, 5.0);
}
// vec3 Fresnel_CookTorrance(float VoH, vec3 F0) {
// }
vec3 F_UE4(float VoH, vec3 F0) {
    return F0 + (vec3(1.0) - F0) * pow(2.0, (-5.55473 * VoH - 6.98316) * VoH);
}


// Geometric
float G_CookTorrance(float NoV, float NoH, float VoH, float NoL) {
    return min(min(2.0 * NoV * NoH / VoH, 2.0 * NoL * NoH / VoH), 1.0);
}
// >    Schlick with k = α/2 matches Smith very closely
float G_UE4(float NoV, float NoH, float VoH, float NoL, float roughness) {
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    float l = NoL / (NoL * (1.0 - k) + k);  // There are another version which use NoH & LoH
    float v = NoV / (NoV * (1.0 - k) + k);
    return l * v;
}


// a (alphaRoughness) = Roughness
// Distribution AKA normal distribution function (NDF)
// Trowbridge-Reitz
float D_GGX(float a, float NoH) {
    a = a * a;
    // float f = (NoH * a - NoH) * NoH + 1.0;  // NoH * NoH * (a - 1.0) + 1.0;
    float f = NoH * NoH * (a - 1.0) + 1.0;
    return a / (PI * f * f);
}


struct coreData {
    vec3 diffuse;
    vec3 f0;
    vec3 N;
    vec3 V;
    vec3 R;
    float NoV;
    float metallic;
    float roughness;
    float alphaRoughness;
};

vec3 lightContrib(vec3 lightDir, coreData core) {

    vec3 L = normalize(lightDir);
    vec3 H = normalize(core.V + L);

    float NoL = clamp(dot(core.N, L), 0.001, 1.0);
    float NoH = clamp(dot(core.N, H), 0.0, 1.0);
    float LoH = clamp(dot(L, H), 0.0, 1.0);
    float VoH = clamp(dot(core.V, H), 0.0, 1.0);

    vec3 F = F_Schlick(VoH, core.f0);
    float G = G_UE4(core.NoV, NoH, VoH, NoL, core.roughness);
    float D = D_GGX(core.alphaRoughness, NoH);

    vec3 specContrib = F * G * D / (4.0 * NoL * core.NoV);
    vec3 diffuseContrib = (1.0 - F) * core.diffuse * (1.0 - core.metallic);
    vec3 color = NoL * (diffuseContrib + specContrib);
    return color;
}

void main() {
#ifdef HAS_EMISSIVE_MAP
    vec4 em = sRGBtoLINEAR(texture(emissiveTexture, emissiveTexture_uv));
#endif

#ifdef HAS_BASECOLOR_MAP
    vec4 base = sRGBtoLINEAR(texture(baseColorTexture, baseColorTexture_uv));
#else
    vec4 base = vec4(1);
#endif

#if defined(COLOR_0_SIZE_3) || defined(COLOR_0_SIZE_4)
    base *= vColor;
#endif

#ifdef BASECOLOR_FACTOR
    base *= BASECOLOR_FACTOR;
#endif

#ifdef HAS_METALLIC_ROUGHNESS_MAP
    vec3 rm = texture(metallicRoughnessTexture, metallicRoughnessTexture_uv).rgb;
#else
    vec3 rm = vec3(0, 0.7, 0);
#endif

#ifdef HAS_AO_MAP
    vec4 ao = texture(occlusionTexture, occlusionTexture_uv);
#endif


#ifdef HAS_NORMAL_MAP
    vec3 normalAddation = texture(normalTexture, normalTexture_uv).rgb * 2.0 - 1.0;
    vec3 N = normalize(TBN * normalAddation);
#else
    vec3 N = normalize(normal);
#endif

    vec3 V = normalize(u_Camera - pos);

    float NoV = clamp(abs(dot(N, V)), 0.0, 1.0);
    vec3 R = -normalize(reflect(V, N));


    float roughness = clamp(rm.g, 0.04, 1.0);
#ifdef ROUGHNESS_FACTOR
    roughness *= ROUGHNESS_FACTOR;
#endif
    float alphaRoughness = roughness * roughness;


    float metallic = clamp(rm.b, 0.0, 1.0);
#ifdef METALLIC_FACTOR
    metallic *= METALLIC_FACTOR;
#endif
    // float roughness = clamp((1.0-rm.g) * roughnessFactor, 0.0, 1.0);
    // float metallic = clamp(rm.b * metallicFactor, 0.0, 1.0);
    vec3 f0 = vec3(0.04);

    vec3 diffuse = base.rgb * (vec3(1) - f0) * (1.0 - metallic);
    diffuse /= PI;

    f0 = mix(f0, base.xyz, metallic);

    coreData core = coreData(
        diffuse,
        f0,
        N,
        V,
        R,
        NoV,
        metallic,
        roughness,
        alphaRoughness
    );


    vec3 color;
    // IBL
#ifdef HAS_ENV_MAP
    vec3 brdf = sRGBtoLINEAR(texture(brdfLUT, vec2(NoV, 1.0 - alphaRoughness))).rgb;
    // vec3 IBLcolor = sRGBtoLINEAR(texture(env, R)).rgb;
    float lod = clamp(roughness * 11., 0.0, 11.);
    #ifdef USE_HDR
    vec3 IBLcolor = texture(env, R, lod).rgb;
    #else
    vec3 IBLcolor = sRGBtoLINEAR(texture(env, R, lod)).rgb;
    #endif
    vec3 IBLspecular = 5.0 * IBLcolor * (f0 * brdf.x + brdf.y);
    color = IBLspecular;
#endif

    color += lightContrib(vec3(2, 5, 2), core) * vec3(2);
    color += lightContrib(vec3(1, 1, 5), core) * vec3(1.0, 0.8902, 0.6902) * 4.0;
    color += lightContrib(vec3(-5, 3, -5), core) * vec3(0.6431, 0.9176, 1.0);
    // color += lightContrib(vec3(-5, 1, 5), core) * vec3(0.3515625, 0.796875, 0.95703125) * 4.;
    // color += lightContrib(vec3(5, 1, -5), core) * vec3(0.921875, 0.4375, 0.9609375) * 4.;

#ifdef HAS_EMISSIVE_MAP
    color += em.rgb;
#endif

#ifdef USE_HDR
    color.rgb *= u_Exposure;
#endif

#ifdef BLEND
    outColor = LINEARtoSRGB(vec4(color, base.a));

#elif defined(MASK)

#ifndef ALPHA_CUTOFF
#define ALPHA_CUTOFF 0.5
#endif
    if(base.a < ALPHA_CUTOFF)
        discard;
    outColor = vec4(toneMapACES(color), 1);
#else
    // Opaque
    outColor = vec4(toneMapACES(color), 1);
#endif
    // outColor = vec4(uv, 0, 1);
    // outColor = (base) * vec4(vec3(max(LoN, 0.0)), 1);
    // outColor = vec4(F, 1);
    // outColor = vec4(vec3(NoV), 1);
    // outColor = vec4(vec3(VoH), 1);
    // outColor = vec4(vec3(G), 1);
    // outColor = vec4(vec3(D), 1);
    // outColor = vec4(IBLspecular, 1);
    // outColor = vec4(brdf, 1);
    // outColor = vec4(N, 1);
    // outColor = vec4(base.rgb, 1);
    // outColor = vec4(ao, 1);
}