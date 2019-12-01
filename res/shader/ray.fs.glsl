#version 300 es
#extension GL_OES_texture_float : enable
#extension GL_OES_texture_float_linear : enable

precision highp float;

uniform int iFrame;
uniform float iTime;
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


//
// Hash functions by Nimitz:
// https://www.shadertoy.com/view/Xt3cDn
//
// 基本的哈希函数, 得到离散值
uint baseHash(uvec2 p) {
    p = 1103515245U*((p >> 1U)^(p.yx));
    uint h32 = 1103515245U*((p.x)^(p.y>>3U));
    return h32^(h32 >> 16);
}

float hash1(inout float seed) {
    uint n = baseHash(floatBitsToUint(vec2(seed+=.1,seed+=.1)));
    return float(n)/float(0xffffffffU);
}

vec2 hash2(inout float seed) {
    uint n = baseHash(floatBitsToUint(vec2(seed+=.1,seed+=.1)));
    uvec2 rz = uvec2(n, n*48271U);
    return vec2(rz.xy & uvec2(0x7fffffffU))/float(0x7fffffff);
}

#define MAX_DIST 1e10
float iSphere( in vec3 ro, in vec3 rd, in vec2 distBound, inout vec3 normal, float sphereRadius ) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - sphereRadius*sphereRadius;
    float h = b*b - c;
    if (h < 0.) {
        return MAX_DIST;
    } else {
	    h = sqrt(h);
        float d1 = -b-h;
        float d2 = -b+h;
        if (d1 >= distBound.x && d1 <= distBound.y) {
            normal = normalize(ro + rd*d1);
            return d1;
        } else if (d2 >= distBound.x && d2 <= distBound.y) {
            normal = normalize(ro + rd*d2);
            return d2;
        } else {
            return MAX_DIST;
        }
    }
}

float hitAABB(vec3 ro, vec3 rd, vec3 bmax, vec3 bmin) {
    // vec3 Tmax = vec3(0);
    // vec3 Tmin = vec3(0);
    // Tmax = (bmax - ro) / rd;
    // Tmin = (bmin - ro) / rd;
    vec3 ird = 1. / rd;
    vec2 Tx, Ty, Tz = vec2(0); // (min, max)
    // X
    Tx.x = (bmin.x - ro.x) * ird.x;
    Tx.y = (bmax.x - ro.x) * ird.x;
    if(Tx.y < Tx.x) {
        Tx = Tx.yx;
    }

    // Y
    Ty.y = (bmin.y - ro.y) * ird.y;
    Ty.x = (bmax.y - ro.y) * ird.y;
    if(Ty.y < Ty.x) {
        Ty = Ty.yx;
    }

    // Check X-Y flat
    if(Tx.x > Ty.y || Ty.x > Tx.y) {
        return -1.; // Missing
    }
    // return 1.;

    // Z
    Tz.x = (bmin.z - ro.z) * ird.z;
    Tz.y = (bmax.z - ro.z) * ird.z;
    if(Tz.y < Tz.x) {
        Tz = Tz.yx;
    }

    // Getting close
    vec2 T = vec2(0);
    T.x = max(Tx.x, Ty.x);
    T.y = min(Tx.y, Ty.y);

    if(T.x > Tz.y || Tz.x > T.y) {
        return -1.; // Missing
    }
    return 1.;
    return min(T.x, Tz.x);
}

vec3 hit(vec3 d, float result, float mat) {
    return (result < d.y) ? vec3(d.x, result, mat) : d;
}

vec3 worldhit(in vec3 ro, in vec3 rd, in vec2 dist, out vec3 normal) {
    vec3 d = vec3(dist, 0.);
    d = hit(d, iSphere(ro-vec3( 0,.510, 0), rd, d.xy, normal, .5), 2.);
    return d;
}

#define PATH_LENGTH 12

vec3 render(in vec3 ro, in vec3 rd, inout float seed) {
    vec3 albedo, normal, col = vec3(1);

    // for (int i = 0; i < PATH_LENGTH; ++i) {

    // }
    vec3 center = vec3(0, 0, 2. + abs(sin(iTime) * 10.));
    // vec3 center = vec3(cos(iTime), 0, -5);
    float t = hitAABB(ro, rd, center + vec3(1.), center - vec3(1.));
    // float t = dot(rd, vec3(0,0,1));
    // if(t > 0.) {
    //     return vec3(1);
    // }

    return vec3(t);
}



void main() {
    // outColor = vec4(toneMapACES(color), 1);
    // outColor = vec4(0,0,0,1) + texture(base, gl_FragCoord.xy);
    vec2 uv = gl_FragCoord.xy * iResolution;

    vec2 p = (gl_FragCoord.xy * 2. - Resolution.xy) * iResolution.y;
    float seed = float(baseHash(floatBitsToUint(p - iTime)))/float(0xffffffffU);

    // color cache
    vec3 col = vec3(1);

    // Ray Origin Position
    vec3 ro = vec3(0, 0, 0);
    // Ray Direction
    vec3 rd = normalize(vec3(p,1.6));

    // Target TODO: LookAt
    vec3 ta = vec3(0,.2,0);

    col = render(ro, rd, seed);

    int Frame = iFrame;




    // outColor = vec4(gl_FragCoord.xy * iResolution, 0, 1);
    outColor = texture(triangleTex, uv);
    outColor = texelFetch(LBVHTex, ivec2(gl_FragCoord.xy), 0);
    outColor = vec4(vec3(seed), 1);
    outColor = vec4(col, 1);
    // outColor = vec4(rd.xy, 0, 1);
}