#version 300 es
#include <macros>

in vec3 POSITION;
in vec3 NORMAL;
in vec2 TEXCOORD_0;
in vec2 TEXCOORD_1;
in vec4 TANGENT;

#ifdef COLOR_0_SIZE_3
in vec3 COLOR_0;
#elif defined(COLOR_0_SIZE_4)
in vec4 COLOR_0;
#endif

#ifdef HAS_SKINS
#ifndef JOINT_AMOUNT
#define JOINT_AMOUNT 200
#endif
in vec4 JOINTS_0;
in vec4 WEIGHTS_0;
uniform mat4 jointMat[JOINT_AMOUNT];
#endif // HAS_SKINS

uniform mat4 M;
uniform mat4 VP;
uniform mat4 nM;

#ifdef HAS_MORPH_TARGETS
uniform float weights;  // Weights of morph targets
in vec3 TAR_POSITION;
#endif // HAS_MORPH_TARGETS

out vec3 normal;
out vec2 uv;
out vec2 uv1;
out vec3 pos;
out vec4 vColor;
out mat3 TBN;


void main() {
    uv = TEXCOORD_0;
    uv1 = TEXCOORD_1;
    vec3 skinedNormal = NORMAL;

#ifdef HAS_MORPH_TARGETS
    vec4 position = vec4((POSITION + TAR_POSITION * weights), 1);
#else
    vec4 position = vec4(POSITION, 1);
#endif // HAS_MORPH_TARGETS

#ifdef HAS_SKINS
    mat4 skinMat =
        WEIGHTS_0.x * jointMat[int(JOINTS_0.x)] +
        WEIGHTS_0.y * jointMat[int(JOINTS_0.y)] +
        WEIGHTS_0.z * jointMat[int(JOINTS_0.z)] +
        WEIGHTS_0.w * jointMat[int(JOINTS_0.w)];
    position = M * skinMat * position;
    skinedNormal = (skinMat * vec4(skinedNormal, 0)).xyz;
#else
    position = M * position;
#endif // HAS_SKINS

    normal = normalize((nM * vec4(skinedNormal, 0)).xyz);
    vec3 tangent=normalize(vec3(nM*vec4(TANGENT.xyz,0)));
    vec3 bitangent=cross(normal,tangent)*TANGENT.w;
    TBN=mat3(tangent,bitangent,normal);

#ifdef COLOR_0_SIZE_3
    vColor = vec4(COLOR_0, 1);
#elif defined(COLOR_0_SIZE_4)
    vColor = COLOR_0;
#endif
    pos = position.xyz / position.w;
    gl_Position = VP * position;
}