import { Render } from "./webgl2/render";
import { Asset } from "./asset";
import { Material } from "./material";

export class Instance {
    renderer: Render;
    constructor(selector) {
        this.renderer = new Render(selector);
    }

    loadShader(url, type) {
        return new Promise((resolve, reject) => {
            Asset.load(url, 'text').then(code => {
                let shader = this.renderer.buildShader(type, code);
                resolve(shader);
            });
        });
    }

    loadShaderProgram(url) {
        let vertFile = url + '.vs.glsl';
        let fragFile = url + '.fs.glsl';
        return new Promise((resolve, reject) => {
            Promise.all([
                this.loadShader(vertFile, WebGLRenderingContext.VERTEX_SHADER),
                this.loadShader(fragFile, WebGLRenderingContext.FRAGMENT_SHADER)
            ]).then((shader) => {
                let program = this.renderer.createProgram(...shader);
                resolve(program);
            });
        });
    }

    loadMaterial(url) {
        return new Promise((resolve, reject) => {
            this.loadShaderProgram(url).then(program => {
                // Program information pickup
                let attr = this.renderer.pickupActiveAttributes(program);
                let unif = this.renderer.pickupActiveUniforms(program);

                resolve(new Material(program, attr, unif));
            });
        });
    }


}