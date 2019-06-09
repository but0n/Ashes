import { Filter } from "../filter";
import { Shader } from "../shader";
import { Screen } from "../webgl2/screen";

// Real-Time Glow: https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch21.html
export class Bloom {

    static initFilters(screen: Screen, threshold = 0.7, radius = 1, intensity = 1) {

        let macro;

        // threshold filter
        macro = {
            THRESHOLD: threshold
        };

        let thresholdFilter = new Filter(screen, new Shader(threshold_vs, threshold_fs, macro));


        // Two pass gaussian blur
        // let width = screen.width / screen.ratio;
        // let height = screen.height /screen.ratio;


        let width = screen.width;
        let height = screen.height;

        let pass = [];
        radius = 1.0 * screen.ratio;
        let core = 3;
        intensity = 2.0;
        // while (width > 60 || height > 60) {
        while (core-- && width > 32 && height > 32) {
            const nw = Math.floor(width * 0.5);
            const nh = Math.floor(height * 0.5);
            pass.push(new Filter(screen, new Shader(blurvs, blurfs, {
                OFFSET: `vec2(${radius/nw}, 0)`,
                // Addition macros:
                iResolution: `vec2(${width}, ${height})`,
                oResolution: `vec2(${nw}, ${nh})`,
            }), width = nw, height = nh));
            pass.push(new Filter(screen, new Shader(blurvs, blurfs, {
                OFFSET: `vec2(0, ${radius/nh})`,
                // Addition macros:
                iResolution: `vec2(${width}, ${height})`,
                oResolution: `vec2(${nw}, ${nh})`,
            }), width = nw, height = nh));
        }


        // Combiand
        macro = {
            BLOOM_INTENSITY: `float(${intensity})`
        };
        let comb = new Filter(screen, new Shader(combine_vs, combine_fs, macro));
        if(screen.output) {
            comb.setInput(screen.output.output, 'originTex');
        } else {
            comb.setInput(screen.capture.output, 'originTex');
        }

        // Assemble
        // The first stage must be attach to screen
        screen.attachFilter(thresholdFilter);
        // screen.attachFilter(blur1);
        // screen.attachFilter(blur2);
        for(let p of pass) {
            screen.attachFilter(p);
            console.log(p.width, p.height);
        }

        screen.attachFilter(comb);


    }

}

let threshold_vs = `
attribute vec3 POSITION;

void main() {
  gl_Position = vec4(POSITION, 1);
}
`;

let threshold_fs = `
precision highp float;
#include <macros>
uniform sampler2D base;

void main() {
    vec2 uv = gl_FragCoord.xy / screenSize;
    vec4 color = texture2D(base, uv);
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    if(brightness < THRESHOLD) {
        color.r = color.g = color.b = color.a = 0.0;
        // discard;
    }
    gl_FragColor = color;
}
`;


let blurvs = `
attribute vec3 POSITION;

void main(){
    gl_Position=vec4(POSITION,1);
}
`;

let blurfs = `
#define PI 3.1415926535898
precision highp float;
uniform sampler2D base;

vec2 uv;

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

float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

// https://redcamel.github.io/RedGL2/example/postEffect/blur/RedPostEffect_BlurX.html

vec4 noiseblur() {
    vec4 finalColor = vec4(0);
    vec2 delta;
    float total = 0.0;
    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
    delta = OFFSET;
    for (float t = -10.0; t <= 10.0; t++) {
        float percent = (t + offset - 0.5) / 10.0;
        float weight = 1.0 - abs(percent);
        vec4 sample = texture2D(base, uv + delta * percent);
        sample.rgb *= sample.a;
        finalColor += sample * weight;
        total += weight;
    }
    finalColor /= total;
    return finalColor;
}

void main() {
    uv = gl_FragCoord.xy / oResolution;
    // gl_FragColor = gaussianBlur();
    // gl_FragColor = noiseblur();
    gl_FragColor = blur9();
    // gl_FragColor = vec4(mod(uv, 1.), 0, 1);
}
`;

let combine_vs = `
attribute vec3 POSITION;

void main() {
  gl_Position = vec4(POSITION, 1);
}
`;

let combine_fs = `
precision highp float;
#include <macros>
uniform sampler2D base;
uniform sampler2D originTex;

void main() {
    vec2 uv = gl_FragCoord.xy / screenSize;
    vec4 origin = texture2D(originTex, uv);
    vec4 addition = texture2D(base, uv) * vec4(vec3(BLOOM_INTENSITY),0);
    gl_FragColor = origin + addition;
}
`;