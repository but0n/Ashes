precision mediump float;

varying vec3 normal;
varying vec2 uv;
varying vec4 pos;
varying vec3 color;

uniform sampler2D emissiveTexture;
uniform sampler2D baseColorTexture;
uniform vec3 u_Camera;

void main() {
    vec4 em = texture2D(emissiveTexture, uv);
    vec4 base = texture2D(baseColorTexture, uv);
    vec3 lightDir = normalize(vec3(100, 100, 100));
    float LoN = dot(normal, lightDir);
    // outColor = vec4(uv, 0, 1);
    gl_FragColor = (base) * vec4(vec3(max(LoN, 0.5)), 1);
}