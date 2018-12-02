import { Shader } from "./shader";

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

}