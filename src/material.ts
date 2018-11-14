import { Shader } from "./shader";
import { Asset } from "./asset";

export class Material {
    ctx: WebGL2RenderingContext;
    shader: Shader;
    isDirty: boolean = true;
    constructor(shader: Shader) {
        this.shader = shader;
    }

    get locationList() {
        return this.shader.attributes;
    }

    setUniform(key: string, value) {
        this.shader.uniforms[key].value = value;
        this.isDirty = true;
    }

    update(ctx: WebGL2RenderingContext) {
        this.isDirty = false;
        if(this.shader.isDirty) {
            this.shader.update(ctx);
        }
        this.shader.updateData();
    }

    static SHADER_PATH = 'static/shader/';
    static LoadShaderProgram(url) {
        url = this.SHADER_PATH + url;
        let vertFile = url + '.vs.glsl';
        let fragFile = url + '.fs.glsl';
        return new Promise((resolve, reject) => {
            Promise.all([
                Asset.load(vertFile, 'text'),
                Asset.load(fragFile, 'text')
            ]).then(([vert, frag]) => {
                console.log(vert);
                console.log(frag);
                let program = new Shader(vert, frag);
                resolve(program);
            });
        });
    }

    static LoadMaterial(matName) {
        return new Promise((resolve, reject) => {
            this.LoadShaderProgram(matName).then((shader: Shader) => {
                let mat = new Material(shader);
                console.log(mat);
                resolve(mat);
            });
        })

    }
}