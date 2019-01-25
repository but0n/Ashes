import { Filter } from "../filter";
import { Shader } from "../shader";
import { Screen } from "../webgl2/screen";

export class Bloom {

    static initFilters(screen: Screen) {

        let macro;

        // threshold filter
        macro = [
            `#define THRESHOLD 0.7`
        ].join('\n');

        let blurSize = 512;
        let threshold = new Filter(screen, new Shader(threshold_vs, macro+threshold_fs), blurSize, blurSize);


        // Two pass gaussian blur
        let radius = 2 * screen.ratio;
        let width = screen.width / screen.ratio;
        let height = screen.height /screen.ratio;

        macro = [
            `#define OFFSET vec2(${radius/width}, 0)`
        ].join('\n');
        let blur1 = new Filter(screen, new Shader(blurvs, macro + blurfs));

        macro = [
            `#define OFFSET vec2(0, ${radius/height})`
        ].join('\n');
        let blur2 = new Filter(screen, new Shader(blurvs, macro+blurfs));


        // Combiand
        macro = [
            `#define BLOOM_INTENSITY (0.6)`
        ].join('\n');
        let comb = new Filter(screen, new Shader(combine_vs, macro + combine_fs));
        if(screen.output) {
            comb.setInput(screen.output.output, 'originTex');
        } else {
            comb.setInput(screen.capture.output, 'originTex');
        }

        // Assemble
        // The first stage must be attach to screen
        screen.attachFilter(threshold);
        screen.attachFilter(blur1);
        screen.attachFilter(blur2);
        screen.attachFilter(blur1.clone());
        screen.attachFilter(blur2.clone());
        screen.attachFilter(comb);


    }

}

let threshold_vs = `
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

let threshold_fs = `
precision mediump float;
uniform sampler2D base;

varying vec2 uv;
varying vec4 pos;


void main() {
    vec4 color = texture2D(base, uv);
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    if(brightness > THRESHOLD) {
        // gl_FragColor = vec4(vec3(brightness), color.a);
        gl_FragColor = color;
    } else {
        gl_FragColor = vec4(0);
    }
}
`;


let blurvs = `
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

let blurfs = `
#define PI 3.1415926535898
precision mediump float;
uniform sampler2D base;

varying vec2 uv;
varying vec4 pos;

vec4 blur9() {
    vec4 color = vec4(0);
    vec2 direction = OFFSET;
    vec2 off1 = vec2(1.3846153846) * direction;
    vec2 off2 = vec2(3.2307692308) * direction;
    color += texture2D(base, uv) * 0.2270270270;
    color += texture2D(base, uv + off1) * 0.3162162162;
    color += texture2D(base, uv - off1) * 0.3162162162;
    color += texture2D(base, uv + off2) * 0.0702702703;
    color += texture2D(base, uv - off2) * 0.0702702703;
    return color;
}
vec4 gaussianBlur() {
    vec2 offset = OFFSET;
    float weight[5];
    weight[0] = 0.227027;
    weight[1] = 0.1945946;
    weight[2] = 0.1216216;
    weight[3] = 0.054054;
    weight[4] = 0.016216;
    vec4 color = vec4(0);
    for(int i = 0; i < 5; i++) {
        color += texture2D(base, uv + offset * float(i+1) ) * weight[i];
        color += texture2D(base, uv + offset * float(-i-1) ) * weight[i];
    }
    return color;
}

void main() {
    gl_FragColor = gaussianBlur();
    // gl_FragColor = blur9();
}
`;

let combine_vs = `
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

let combine_fs = `
precision mediump float;
uniform sampler2D base;
uniform sampler2D originTex;

varying vec2 uv;
varying vec4 pos;


void main() {
    vec4 origin = texture2D(originTex, uv);
    vec4 addition = texture2D(base, uv) * vec4(vec3(BLOOM_INTENSITY),1);
    gl_FragColor = origin + addition;
}
`;