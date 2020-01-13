#version 300 es
#extension GL_OES_texture_float : enable
#extension GL_OES_texture_float_linear : enable

precision highp float;

uniform int iFrame;
uniform float iTime;
uniform sampler2D base;
uniform sampler2D test;
uniform sampler2D triangleTex;
uniform sampler2D LBVHTex;
uniform samplerCube skybox;
uniform sampler2D hdr;


uniform mat3 TBN;
uniform vec3 vp;

#include <macros>

#define PI 3.14159265358979
#define invPI     0.3183098861837697
#define invTWO_PI     0.15915494309
#define GAMMA 2.2

out vec4 outColor;

// equirectangular map
vec2 getuv(vec3 p) {
    float theta = acos(p.y);
    float phi = atan(p.z, p.x);
    if (phi < 0.0) {
        phi += 2.0 * PI;
    }
    vec2 s;
    s.x = 1.0 - phi * invTWO_PI;
    s.y = 1.-theta * invPI;
    return s;
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
float hitAABB(vec3 ro, vec3 ird, vec3 bmax, vec3 bmin) {
    // vec3 Tmax = vec3(0);
    // vec3 Tmin = vec3(0);
    // Tmax = (bmax - ro) / rd;
    // Tmin = (bmin - ro) / rd;
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
        return MAX_DIST; // Missing
    }
    // Getting close
    vec2 T = vec2(0);
    T.x = max(Tx.x, Ty.x);
    T.y = min(Tx.y, Ty.y);

    // Z
    Tz.x = (bmin.z - ro.z) * ird.z;
    Tz.y = (bmax.z - ro.z) * ird.z;
    if(Tz.y < Tz.x) {
        Tz = Tz.yx;
    }


    if(T.x > Tz.y || Tz.x > T.y) {
        return MAX_DIST; // Missing
    }
    return max(T.x, Tz.x);
}

// Plane
float iPlane( in vec3 ro, in vec3 rd, in vec2 distBound, inout vec3 normal,
              in vec3 planeNormal, in float planeDist) {
    float a = dot(rd, planeNormal);
    float d = -(dot(ro, planeNormal)+planeDist)/a;
    if (a > 0. || d < distBound.x || d > distBound.y) {
        return MAX_DIST;
    } else {
        normal = planeNormal;
    	return d;
    }
}

// Triangle:        https://www.shadertoy.com/view/MlGcDz
float iTriangle( in vec3 ro, in vec3 rd, in vec2 distBound, inout vec3 normal,
                 in vec3 v0, in vec3 v1, in vec3 v2 ) {
    vec3 v1v0 = v1 - v0;
    vec3 v2v0 = v2 - v0;
    vec3 rov0 = ro - v0;

    vec3  n = cross( v1v0, v2v0 );
    vec3  q = cross( rov0, rd );
    float d = 1.0/dot( rd, n );
    float u = d*dot( -q, v2v0 );
    float v = d*dot(  q, v1v0 );
    float t = d*dot( -n, rov0 );

    if( u<0. || v<0. || (u+v)>1. || t<distBound.x || t>distBound.y) {
        return MAX_DIST;
    } else {
        normal = normalize(n);  // NOTE: original version is n = normalize(-n), I am confuse
        return t;
    }
}

struct BVHNode {
    vec3    bmin;
    float   branch;
    vec3    bmax;
    float   index;
};

#define INV_TEXTURE_WIDTH 0.00048828125
BVHNode getBVH(float i) {
    float offset = (i * 2.);
    ivec2 uv0 = ivec2( mod(offset + 0., 2048.), floor((offset + 0.) * INV_TEXTURE_WIDTH) );
    ivec2 uv1 = ivec2( mod(offset + 1., 2048.), floor((offset + 1.) * INV_TEXTURE_WIDTH) );

    vec4 bvh0 = texelFetch(LBVHTex, uv0, 0);
    vec4 bvh1 = texelFetch(LBVHTex, uv1, 0);
    return BVHNode(
        bvh0.rgb,
        bvh0.a,
        bvh1.rgb,
        bvh1.a
    );
}

float hitTriangle(float i, vec3 ro, vec3 rd, inout vec3 N) {
    ivec2 puv0 = ivec2( mod(i + 0., 2048.), floor((i + 0.) * INV_TEXTURE_WIDTH) );
    ivec2 nuv0 = ivec2( mod(i + 1., 2048.), floor((i + 1.) * INV_TEXTURE_WIDTH) );
    ivec2 puv1 = ivec2( mod(i + 2., 2048.), floor((i + 2.) * INV_TEXTURE_WIDTH) );
    ivec2 nuv1 = ivec2( mod(i + 3., 2048.), floor((i + 3.) * INV_TEXTURE_WIDTH) );
    ivec2 puv2 = ivec2( mod(i + 4., 2048.), floor((i + 4.) * INV_TEXTURE_WIDTH) );
    ivec2 nuv2 = ivec2( mod(i + 5., 2048.), floor((i + 5.) * INV_TEXTURE_WIDTH) );

    vec3 v0 = texelFetch(triangleTex, puv0, 0).xyz;
    vec3 v1 = texelFetch(triangleTex, puv1, 0).xyz;
    vec3 v2 = texelFetch(triangleTex, puv2, 0).xyz;

    return iTriangle(ro, rd, vec2(0, MAX_DIST), N, v0, v1, v2);
}

#ifndef SL
#define SL 32
#endif
float hitLBVH(float i, vec3 ro, vec3 rd, inout float tri, inout vec3 normal) {
    vec3 ird = 1. / rd;

    float offsetStack[SL];
    int sp = 0; // Stack Pointer

    int c = 32;

    float t = MAX_DIST; // Only for leaf
    float pNode = i;

    BVHNode bvh;
    // while(c++ > min(100, iFrame/2)) {
    while(c > 0) {
        bvh = getBVH(pNode);
        float current = hitAABB(ro, ird, bvh.bmax, bvh.bmin);
        // return current;
            // if(c == (iFrame / 7)) {
            //     // if(t > 0.)
            //         return min(t, current);
            //     // return current;
            //     // return t;
            // }

        if(current == MAX_DIST) {
            // Missing

            // Compares to other branch
            if(sp == 0)
                return t;
            pNode = offsetStack[--sp];
        } else {    // Hit something

            if(bvh.index < 0.) {
                if(t != MAX_DIST && current > t) {
                    // Go back
                    if(sp == 0)
                        return t;
                    pNode = offsetStack[--sp];
                } else {
                    // Deep
                    if(sp == SL)
                        return t;
                    offsetStack[sp++] = bvh.branch;
                    pNode += 1.;
                }
            } else {
                // Leaf
                current = hitTriangle(bvh.index, ro, rd, normal);
                if(current != MAX_DIST) {
                    if(t != MAX_DIST) {
                        // Already got one leaf
                        if(current < t)
                            tri = bvh.index;
                        // Compares two leaves
                        t = min(t, current);
                    } else {
                        // First leaf
                        // Update t and continue
                        tri = bvh.index;
                        t = current;
                        // Go back
                    }
                }
                if(sp == 0)
                    return t;
                pNode = offsetStack[--sp];
            }
        }
    }
    return t;
}

vec3 cosWeightedRandomHemisphereDirection( const vec3 n, inout float seed ) {
	vec3  uu = normalize(cross(n, abs(n.y) > .5 ? vec3(1.,0.,0.) : vec3(0.,1.,0.)));
	vec3  vv = cross(uu, n);

  	vec2 r = hash2(seed);

    r.x *= 6.28318530718;
	float ra = sqrt(r.y);
	float rx = ra*cos(r.x);
	float ry = ra*sin(r.x);
	float rz = sqrt(1.-r.y);
	vec3  rr = vec3(rx*uu + ry*vv + rz*n);
    return normalize(rr);
}



float hitWorld(in vec3 ro, in vec3 rd, in vec2 dist, out vec3 normal, out float mat) {
    vec3 d = vec3(dist, 0.);
    vec3 ird = 1. / rd;

    float triangleIndex = 0.;
    // float t = MAX_DIST;
    float t1 = hitLBVH (0., ro - vec3(0, 0, 0), rd, triangleIndex, normal);
    float t2 = iPlane  (ro-vec3( 0,-2., 0), rd, vec2(0, t1), normal, vec3(0,1,0), 0.);
    // float t2 = MAX_DIST;

    float t = min(t1, t2);
    if(t1 < t2) {
        mat = 0.;
    } else {
        mat = 1.;
    }
    return t;
}

#define PATH_LENGTH 12

vec3 render(in vec3 ro, in vec3 rd, inout float seed) {
    vec3 albedo, normal, col = vec3(1);
    float roughness = .5;
    float metal = .1;
    for (int i = 0; i < PATH_LENGTH; ++i) {

        float mat = -1.;
        float t = hitWorld(ro, rd, vec2(0, 1000), normal, mat);

        if(t < MAX_DIST) {
			ro += rd * t;
            // float LoN = max(dot(normalize(vec3(-1,1,1)), normal), .4);
            if(mat < 1.) {
                albedo = vec3(1);
            } else if(mat < 2.) {
                float scale = .8;
                float fact = step(.0, sin(ro.x / scale)+cos(ro.z / scale));
                albedo = vec3(1) * clamp(fact, .1, 1.);
            }

            col *= albedo;
            rd = cosWeightedRandomHemisphereDirection(normal, seed);
        } else {
            // col *= pow( texture(skybox, rd).rgb, vec3(GAMMA) ) * 1.;
            col *= texture(skybox, rd).rgb * 1.;
            // col *= texture(hdr, getuv(rd)).rgb * 1.;
            return col;
        }

    }
    return vec3(0);
}



void main() {
    vec2 uv = gl_FragCoord.xy * iResolution;

    vec2 p = (gl_FragCoord.xy * 2. - Resolution.xy) * iResolution.y;
    float seed = float(baseHash(floatBitsToUint(p - iTime)))/float(0xffffffffU);

    // AA
    p += 2.*hash2(seed) * iResolution.y;
    // color cache
    vec3 col = vec3(1);

    // Ray Origin Position
    vec3 ro = vec3(0, 0, 10);
    ro = vp;
    // Ray Direction
    vec3 rd = normalize(vec3(p,1.6));
    rd = TBN * rd;



    col = render(ro, rd, seed);

    int Frame = iFrame;

    if(Frame == 0) {
        outColor = vec4(col, 1);
    } else {
        // outColor = ( vec4(col, 1) * float(Frame) + texture(base, uv)) / float(Frame+1);
        // outColor = vec4(( col * vec3(Frame) + texture(test, uv).rgb) / vec3(Frame+1), 1.);
        outColor = vec4(col, 1) + texelFetch(base, ivec2(gl_FragCoord), 0);

    }
}