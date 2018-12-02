import { Shader } from "./shader";
import { Texture } from "./texture";

export class Material {
    name: string;
    ctx: WebGL2RenderingContext;
    shader: Shader;
    isDirty: boolean = true;
    textures: Texture[] = [];
    constructor(shader: Shader, name = null) {
        this.shader = shader;
        this.name = name;
    }

    static setUniform(mat: Material, key: string, value) {
        if(mat.shader.uniforms[key] == null) {
            console.warn(`${key} doesn't found!`);
            return;
        }
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
        for(let tex of mat.textures) {
            Texture.bindTexture(ctx, tex);
            Material.setUniform(mat, tex.uniform, tex.channel);
        }
    }

    static setTexture(mat: Material, name: string, tex: Texture, channel: number = mat.textures.length) {
        tex.uniform = name;
        tex.channel = channel;
        mat.textures.push(tex);
        mat.isDirty = true;
    }

    static SHADER_PATH = 'static/shader/';

}