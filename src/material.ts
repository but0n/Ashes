import { Shader } from "./shader";
import { Asset } from "./asset";

export class Material {
    ctx: WebGL2RenderingContext;
    shader: Shader;
    isDirty: boolean = true;
    constructor(shader: Shader) {
        this.shader = shader;
    }

    static setUniform(mat: Material, key: string, value) {
        mat.shader.uniforms[key].value = value;
        mat.shader.uniforms[key].isDirty = true;
        mat.isDirty = true;
    }

    static updateUniform(mat: Material, ctx: WebGL2RenderingContext) {
        mat.isDirty = false;
        if(mat.shader.isDirty) {
            Shader.buildProgram(mat.shader, ctx);
        }
        Shader.updateUniform(mat.shader);
    }

    static SHADER_PATH = 'static/shader/';
    static async LoadShaderProgram(url) {
        url = this.SHADER_PATH + url;
        let vertPath = url + '.vs.glsl';
        let fragPath = url + '.fs.glsl';
        let [vert, frag] = await Promise.all([vertPath, fragPath].map(path => Asset.load(path, 'text')));
        console.log(vert);
        console.log(frag);
        return new Shader(vert, frag);
    }

    static async LoadMaterial(matName) {
        let shader = await this.LoadShaderProgram(matName);
        return new Material(shader);
    }
}