import { Render } from "./webgl2/render";
import { Asset } from "./asset";

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

    loadShaderProgram(name) {
        let vertFile = name + '.vs.glsl';
        let fragFile = name + '.fs.glsl';
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


}