#version 300 es
#extension GL_OES_texture_float : enable
#extension GL_OES_texture_float_linear : enable

precision highp float;

uniform int PATH_LENGTH;

uniform int iFrame;
uniform float iTime;
uniform sampler2D base;
uniform sampler2D test;
uniform sampler2D triangleTex;
uniform sampler2D LBVHTex;
uniform sampler2D skybox;
uniform sampler2D hdr;
uniform sampler2D wall;
uniform sampler2D ground;


uniform mat3 TBN;
uniform vec3 vp;
uniform vec2 mousePos;

#include <macros>

#define PI 3.14159265358979
#define invPI     0.3183098861837697
#define invTWO_PI     0.15915494309
#define GAMMA 2.2

out vec4 outColor;

// texture stuff
vec4 sRGBtoLINEAR(vec4 color) {
    return vec4(pow(color.rgb, vec3(GAMMA)), color.a);
}
vec4 LINEARtoSRGB(vec4 color) {
    return vec4(pow(color.rgb, vec3(1.0/GAMMA)), color.a);
}

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
// Palette by Íñigo Quílez:
// https://www.shadertoy.com/view/ll2GD3
//
// 颜色板
vec3 pal(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b*cos(6.28318530718*(c*t+d));
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

vec2 randomInUnitDisk( inout float seed ) {
    // 生成两个随机数, x: 抖动半径[0,1]; y: 弧度[0,2PI]
    vec2 h = hash2(seed) * vec2(1,6.28318530718);
    float r = sqrt(h.x); // 避免丛聚
	return r*vec2(sin(h.y),cos(h.y));
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
    Ty.x = (bmin.y - ro.y) * ird.y;
    Ty.y = (bmax.y - ro.y) * ird.y;
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


// Box:             https://www.shadertoy.com/view/ld23DV
float iBox( in vec3 ro, in vec3 rd, in vec2 distBound, inout vec3 normal,
            in vec3 boxSize ) {
    vec3 m = sign(rd)/max(abs(rd), 1e-8);
    vec3 n = m*ro;
    vec3 k = abs(m)*boxSize;

    vec3 t1 = -n - k;
    vec3 t2 = -n + k;

	float tN = max( max( t1.x, t1.y ), t1.z );
	float tF = min( min( t2.x, t2.y ), t2.z );

    if (tN > tF || tF <= 0.) {
        return MAX_DIST;
    } else {
        if (tN >= distBound.x && tN <= distBound.y) {
        	normal = -sign(rd)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);
            return tN;
        } else if (tF >= distBound.x && tF <= distBound.y) {
        	normal = -sign(rd)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);
            return tF;
        } else {
            return MAX_DIST;
        }
    }
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
#define HAS_NORMAL
#define TRI_TEXSIZE     2048.
#define INV_TRIANGLE    1./TRI_TEXSIZE
float hitTriangle(float i, vec3 ro, vec3 rd, inout vec3 N) {
#ifdef HAS_NORMAL
    ivec2 puv0 = ivec2( mod(i + 0., TRI_TEXSIZE), floor((i + 0.) * INV_TRIANGLE) );
    ivec2 nuv0 = ivec2( mod(i + 1., TRI_TEXSIZE), floor((i + 1.) * INV_TRIANGLE) );
    ivec2 puv1 = ivec2( mod(i + 2., TRI_TEXSIZE), floor((i + 2.) * INV_TRIANGLE) );
    ivec2 nuv1 = ivec2( mod(i + 3., TRI_TEXSIZE), floor((i + 3.) * INV_TRIANGLE) );
    ivec2 puv2 = ivec2( mod(i + 4., TRI_TEXSIZE), floor((i + 4.) * INV_TRIANGLE) );
    ivec2 nuv2 = ivec2( mod(i + 5., TRI_TEXSIZE), floor((i + 5.) * INV_TRIANGLE) );

#else

    ivec2 puv0 = ivec2( mod(i + 0., TRI_TEXSIZE), floor((i + 0.) * INV_TRIANGLE) );
    ivec2 puv1 = ivec2( mod(i + 1., TRI_TEXSIZE), floor((i + 1.) * INV_TRIANGLE) );
    ivec2 puv2 = ivec2( mod(i + 2., TRI_TEXSIZE), floor((i + 2.) * INV_TRIANGLE) );

#endif



    vec4 v0 = texelFetch(triangleTex, puv0, 0);
    vec4 v1 = texelFetch(triangleTex, puv1, 0);
    vec4 v2 = texelFetch(triangleTex, puv2, 0);

    if(dot(cross((v2.xyz-v0.xyz), (v1.xyz-v0.xyz)), rd) < 0.) {

        vec4 cache = v2;
        v2 = v1;
        v1 = cache;
    }

    float d = iTriangle(ro, rd, vec2(0, MAX_DIST), N, v0.xyz, v1.xyz, v2.xyz);

    // TODO: Calculate normal only if necessary

#ifdef HAS_NORMAL
    vec4 n0 = texelFetch(triangleTex, nuv0, 0);
    vec4 n1 = texelFetch(triangleTex, nuv1, 0);
    vec4 n2 = texelFetch(triangleTex, nuv2, 0);

    vec2 uv0 = vec2(v0.z, n0.z);
    vec2 uv1 = vec2(v1.z, n1.z);
    vec2 uv2 = vec2(v2.z, n2.z);

    if(d != MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 e1 = v0.xyz - v1.xyz;
        vec3 e2 = v2.xyz - v1.xyz;
        vec3 ne1 = normalize(e1);
        float le1 = length(e1);
        vec3 ne2 = normalize(e2);
        float le2 = length(e2);

        vec3 ep = p - v1.xyz;
        vec3 nep = normalize(ep);

        // float cp = normalize(e2) * dot(e1, e2);
        float s = length(v0.xyz - ne2 * dot(e1, ne2)) * le2;
        float s1 = length(p - ne1 * dot(ep, ne1)) * le1 / s;
        float s2 = length(p - ne2 * dot(ep, ne2)) * le2 / s;

        N = -normalize(n0.xyz * s2 * n1.xyz * (1.-s1-s2) * n2.xyz * s1);
    }

#endif

    return d;
}

#ifndef SL
#define SL 64
#endif
float hitLBVH2(float i, vec3 ro, vec3 rd, inout float mat, inout vec3 N) {
    vec3 ird = 1. / rd;
    vec3 normal;

    float offsetStack[SL];
    int sp = 0; // Stack Pointer


    float t = MAX_DIST; // Only for leaf
    float tri;          // Triangle index cache
    float pNode = i;

    // BVHNode bvh;
    BVHNode bvh = getBVH(pNode);

    float bvhRoot = hitAABB(ro, ird, bvh.bmax, bvh.bmin);

    if(bvhRoot == MAX_DIST)
        return MAX_DIST;

    int c = 32;

    BVHNode l, r, cur;
    float lt, rt, current;

    while(c > 0) {
        bvh = getBVH(pNode);
        current = hitAABB(ro, ird, bvh.bmax, bvh.bmin);
        if(current > 0. && current == MAX_DIST) {
            // Missing
            // Compares to other branch
            if(sp == 0)
                return t;
            pNode = offsetStack[--sp];
        } else {
            if(bvh.index < 0.) {

                l = getBVH(pNode + 1.);
                r = getBVH(bvh.branch);
                lt = hitAABB(ro, ird, l.bmax, l.bmin);
                rt = hitAABB(ro, ird, r.bmax, r.bmin);
                if(rt == MAX_DIST && lt == MAX_DIST) {
                    // Go back
                    if(sp == 0)
                        return t;
                    pNode = offsetStack[--sp];

                } else {

                    if(sp == SL)    // cannot go further
                        return t;

                    if(rt < lt) {   // if right branch is closer

                        offsetStack[sp++] = pNode + 1.; // store another optional node
                        pNode = bvh.branch;

                    } else {        // left branch is closer

                        offsetStack[sp++] = bvh.branch; // store another optional node
                        pNode += 1.;
                    }

                }


            } else {
                // leaf
                // if(bvh.branch >= 0.) { // Not empty
                    if(t > 0. && t != MAX_DIST) {
                        // Already got one leaf
                        // if(current >= t) {
                            // still have chance for countinue
                            current = hitTriangle(bvh.index, ro, rd, normal);
                            if(current != MAX_DIST && current < t) {
                                tri = bvh.index;
                                mat = bvh.branch;
                                t = current;
                                N = normal;
                            }
                        // }
                        // Compares two leaves
                        // t = min(t, current);
                    } else {
                        // First leaf
                        current = hitTriangle(bvh.index, ro, rd, normal);
                        if(current > 0. && current != MAX_DIST) {
                            // Update t and continue
                            tri = bvh.index;
                            t = current;
                            mat = bvh.branch;
                            N = normal;
                            // return t;
                        }
                        // Go back
                    }
                // }
                if(sp == 0)
                    return t;
                pNode = offsetStack[--sp];
            }
        }

    }
    return t;
}
float hitLBVH(float i, vec3 ro, vec3 rd, inout float mat, inout vec3 N) {
    vec3 ird = 1. / rd;
    vec3 normal;

    float offsetStack[SL];
    int sp = 0; // Stack Pointer

    int c = 32;

    float t = MAX_DIST; // Only for leaf
    float tri;          // Triangle index cache
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
                // current = hitTriangle(bvh.index, ro, rd, normal);
                // if(current != MAX_DIST) {
                    if(t != MAX_DIST) {
                        // Already got one leaf
                        if(current < t) {
                            // still have chance for countinue
                            current = hitTriangle(bvh.index, ro, rd, normal);
                            if(current < t) {
                                tri = bvh.index;
                                mat = bvh.branch;
                                t = current;
                                N = normal;
                            }
                        }
                        // Compares two leaves
                        // t = min(t, current);
                    } else {
                        // First leaf
                        current = hitTriangle(bvh.index, ro, rd, normal);
                        if(current != MAX_DIST) {
                            // Update t and continue
                            tri = bvh.index;
                            t = current;
                            mat = bvh.branch;
                            N = normal;
                        }
                        // Go back
                    }
                // }
                if(sp == 0)
                    return t;
                pNode = offsetStack[--sp];
            }
        }
    }
    return t;
}

vec3 cosWeightedRandomHemisphereDirection( const vec3 n, inout float seed ) {
	vec3  t = normalize(cross(n, abs(n.y) > .5 ? vec3(1.,0.,0.) : vec3(0.,1.,0.)));
	vec3  b = cross(t, n);

    vec2 h = hash2(seed) * vec2(1,6.28318530718);

    // l^2 + z^2 = 1 = h.x + 1. - h.x
    vec3 r = vec3(sqrt(h.x) * vec2(cos(h.y), sin(h.y)), sqrt(1.-h.x));

    return normalize(mat3(t,b,n) * r);
}

vec3 modifyDirectionWithRoughness( const vec3 normal, const vec3 n, const float roughness, inout float seed ) {
    vec2 r = hash2(seed);

	vec3  uu = normalize(cross(n, abs(n.y) > .5 ? vec3(1.,0.,0.) : vec3(0.,1.,0.)));
	vec3  vv = cross(uu, n);

    float a = roughness*roughness;
    r.x *= 6.28318530718;
	float rz = sqrt(abs((1.0-r.y) / clamp(1.+(a - 1.)*r.y,.00001,1.)));
	float ra = sqrt(abs(1.-rz*rz));
	float rx = ra*cos(r.x);
	float ry = ra*sin(r.x);
	vec3  rr = vec3(rx*uu + ry*vv + rz*n);

    vec3 ret = normalize(rr);
    return dot(ret,normal) > 0. ? ret : n;
}

float FresnelSchlickRoughness( float cosTheta, float F0, float roughness ) {
    return F0 + (max((1. - roughness), F0) - F0) * pow(abs(1. - cosTheta), 5.0);
}

vec3 opU(vec3 d, float iResult, float mat) {
	return (iResult < d.y) ? vec3(d.x, iResult, mat) : d;
}


#define W_RATIO 0.5625
#define W_WIDTH 10.
float hitWorld(in vec3 ro, in vec3 rd, in vec2 dist, out vec3 normal, out float mat) {
    vec3 d = vec3(dist, -1);
    vec3 ird = 1. / rd;

    d = opU(d, hitLBVH2(0., ro - vec3(0, 0, 0), rd, mat, normal), mat);

    d = opU(d, iPlane(ro-vec3( 0,-2., 0), rd, d.xy, normal, vec3(0,1,0), 0.), 10.);

    // d = opU(d, iBox(ro-vec3(0,.4*W_WIDTH,-8), rd, d.xy, normal, vec3(W_WIDTH,W_WIDTH*W_RATIO,.01)), 11.);

    mat = d.z;

    return d.y;
}

// #define PATH_LENGTH 2

// #define DEBUG_NORMAL

vec3 render(in vec3 ro, in vec3 rd, inout float seed) {
    vec3 albedo, normal, col = vec3(1);
    float roughness = .86;
    float metal = .01;
    for (int i = 0; i < PATH_LENGTH; ++i) {

        float mat = -1.;
        float t = hitWorld(ro, rd, vec2(0, MAX_DIST), normal, mat);

        if(t > 0. && t < MAX_DIST) {
			ro += rd * t;
            if(mat < 0.) {
                continue;
            }

#ifdef DEBUG_NORMAL
    return max(vec3(0), normal);
#endif

            // float LoN = max(dot(normalize(vec3(-1,1,1)), normal), .4);
            if(mat < 1.5) {
                // Eye
                albedo = pal((mat+4.)*.52996323, vec3(.4),vec3(.5),vec3(1),vec3(0.3,.6,.7));
                roughness = .6;
                metal = .2;
                // metal = .0;
                // return albedo;
                // roughness = 1.;
            } else if(mat < 2.5) {
                albedo = pal((mat+10.)*.52996323, vec3(.4),vec3(.5),vec3(1),vec3(0.3,.6,.7));
                roughness = .6;

                metal = .1;

            } else if(mat < 3.5) {
                albedo = pal((mat+1.)*.52996323, vec3(.4),vec3(.5),vec3(1),vec3(0.3,.6,.7));
                roughness = .6;
                metal = .1;

                // return albedo;
            } else if(mat < 10.) {
                // albedo = vec3(0.7764705882352941, 0.5254901960784314, 0.25882352941176473);
                // albedo = vec3(0.8784313725490196, 0.6745098039215687, 0.4117647058823529);
                albedo = vec3(1, 0.8588235294117647, 0.6745098039215687);
                metal = .1;
                roughness = .9;

            } else if(mat < 11.) {
                // float scale = .8;
                // float fact = step(.0, sin(ro.x / scale)+cos(ro.z / scale));
                // albedo = vec3(1) * clamp(fact, .1, 1.);
                // metal = .1;

                vec2 uv = ro.xz * 0.4;
                // ground
                albedo = sRGBtoLINEAR(texture(ground, uv)).rgb;
                roughness = .8;
                metal = .1;

            } else if(mat < 12.) {
                // albedo = pal((mat+4.)*.52996323, vec3(.4),vec3(.5),vec3(1),vec3(0.3,.6,.7));
                // vec2 uv = mod((ro.xy * vec2(1., -1./W_RATIO) / W_WIDTH *.5 - vec2(5. - 4.,1.5)/W_WIDTH), 1.);
                vec2 uv = mod((ro.xy * vec2(1., -1./W_RATIO) / W_WIDTH *.5 - vec2(5.,1.5)/W_WIDTH), 1.);
                albedo = sRGBtoLINEAR(texture(wall, uv)).rgb * 3.;
                return albedo;
            }

            float F = FresnelSchlickRoughness(max(0.,-dot(normal, rd)), .04, roughness);
            if (F>hash1(seed)-metal) {
                rd = modifyDirectionWithRoughness(normal, reflect(rd,normal), roughness, seed);
            } else {
	            col *= albedo;
                rd = cosWeightedRandomHemisphereDirection(normal, seed);
            }


            // col *= albedo;
            // rd = cosWeightedRandomHemisphereDirection(normal, seed);
        } else {
            // col *= pow( texture(skybox, rd).rgb, vec3(GAMMA) ) * 1.;
            col *= sRGBtoLINEAR(texture(skybox, getuv(rd) + vec2(0,0))).rgb;
            // col *= texture(skybox, rd).rgb * .09;
            // col *= texture(hdr, getuv(rd)).rgb * 1.;
            return col;
        }

    }
    return vec3(0);
}

// #define DOF_FACTOR .03
#define DOF_FACTOR .09
#define FOV 2.5
void main() {
    vec2 uv = gl_FragCoord.xy * iResolution;



    // Ray Origin Position
    vec3 ro = vec3(0, 0, 10);
    ro = vp;




    int Frame = iFrame;

    float fpd = texelFetch(base, ivec2(0), 0).r;

    if(all(equal(ivec2(gl_FragCoord), ivec2(0)))) {
        // Calculate focus plane distance.
        if(Frame == 0) {
            float tmp;
            vec3 tmp3;
            // float nfpd = hitWorld(ro, normalize(vec3(0)-ro), vec2(0, MAX_DIST), tmp3, tmp);
            // float nfpd = hitWorld(ro, TBN * vec3(0,0,1), vec2(0, MAX_DIST), tmp3, tmp);
            float nfpd = hitWorld(ro, TBN * normalize(vec3(mousePos,FOV)), vec2(0, MAX_DIST), tmp3, tmp);
            outColor = vec4(nfpd);
        } else {
            outColor = vec4(fpd);
        }
    } else {
        vec3 col = vec3(1);

        vec2 p = (gl_FragCoord.xy * 2. - Resolution.xy) * iResolution.y;
        float seed = float(baseHash(floatBitsToUint(p - iTime)))/float(0xffffffffU);


        // AA
        p += 2.*hash2(seed) * iResolution.y;

        // Ray Direction
        vec3 rd = normalize(vec3(p,FOV));
        rd = TBN * rd;

        // DOF
        vec3 fp = ro + rd * fpd;
        ro = ro + TBN * vec3(randomInUnitDisk(seed), 0.) * DOF_FACTOR;
        rd = normalize(fp - ro);

        col = render(ro, rd, seed);

        if(Frame == 0) {
            outColor = vec4(col, 1);

        } else {
            // outColor = ( vec4(col, 1) * float(Frame) + texture(base, uv)) / float(Frame+1);
            // outColor = vec4(( col * vec3(Frame) + texture(test, uv).rgb) / vec3(Frame+1), 1.);
            outColor = vec4(col, 1) + texelFetch(base, ivec2(gl_FragCoord), 0);

        }
    }

}