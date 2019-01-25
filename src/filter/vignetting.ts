import { Filter } from "../filter";
import { Screen } from "../webgl2/screen";
import { Shader } from "../shader";

export class Vignetting extends Filter {
    constructor(screen: Screen, factor = 0.4, hardness = 1) {
        let macro = [
            `#define FACTOR float(${factor})`,
            `#define HARDNESS float(${hardness})`
        ].join('\n');
        // super(screen, new Shader(vig_vs, vig_fs));
        super(screen, new Shader(vig_vs, macro + vig_fs));
    }


}

let vig_vs = `
attribute vec3 POSITION;
attribute vec2 TEXCOORD_0;

varying vec2 uv;
varying vec4 pos;

void main() {
  uv = TEXCOORD_0;
  vec4 position = vec4(POSITION, 1);
  pos = position;
  gl_Position = position;
}
`;

let vig_fs = `
precision mediump float;
uniform sampler2D base;

varying vec2 uv;
varying vec4 pos;

void main() {
    vec2 offset = uv * 2.0 - 1.0;
    float mask = 1.0 - dot(offset, offset) * FACTOR;
    mask = clamp(0.5 + (mask - 0.5) * HARDNESS, 0.0, 1.0);
    vec4 color = texture2D(base, uv);
    gl_FragColor = mix(vec4(vec3(0),1), color, mask);
}
`;
