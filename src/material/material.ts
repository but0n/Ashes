import { Shader } from "../shader";
import { Texture } from "../texture";

export enum RenderQueue {
    Opaque,
    Blend,
}

export class Material {
    static pool: Material[] = [];
    name: string;
    shader: Shader;
    isDirty: boolean = true;
    // textures: Texture[] = [];
    textures: Map<string, Texture> = new Map();
    doubleSided: boolean;
    queue = RenderQueue.Opaque;
    constructor(shader: Shader, name = null, doubleSided = false) {
        this.shader = Shader.clone(shader);
        this.name = name;
        this.shader.macros['SHADER_NAME'] = name;
        this.doubleSided = doubleSided;
        Material.pool.push(this);
    }
    static clone(mat: Material) {
        return new Material(mat.shader, mat.name, mat.doubleSided);
    }

    static useMaterial(mat: Material, ctx: WebGL2RenderingContext) {
        if(mat.shader.isDirty) {
            // Update Shader
            Shader.buildProgram(mat.shader, ctx);
        }
        ctx.useProgram(mat.shader.program);
    }

    static setUniform(mat: Material, key: string, value) {
        if(mat.shader.uniforms[key] == null) {
            // console.warn(`${key} doesn't found!`);
            return;
        }
        mat.shader.uniforms[key].value = value;
        mat.shader.uniforms[key].isDirty = true;
        mat.isDirty = true;
    }

    static updateUniform(mat: Material, ctx: WebGL2RenderingContext) {
        if(mat.shader.isDirty) {
            Shader.buildProgram(mat.shader, ctx);
            this.useMaterial(mat, ctx);
        }

        Shader.updateUniform(mat.shader);
        mat.isDirty = false;
    }

    static bindAllTextures(mat: Material, ctx: WebGL2RenderingContext, force = false) {
        if(mat.textures.size == 0) {
            // FIXME:
        }
        for (let [uniform, tex] of mat.textures) {
            Texture.bindTexture(ctx, tex);
            if(tex.isDirty || force) {
                Material.setUniform(mat, uniform, tex.channel);
                tex.isDirty = false;
            }
        }
    }

    static unbindAllTextures(mat: Material, ctx: WebGL2RenderingContext) {
        for (let [,tex] of mat.textures) {
            Texture.unbindTexture(ctx, tex);
        }
    }

    static setTexture(mat: Material, name: string, tex: Texture) {
        if(mat.textures.has(name)) {
            tex.channel = mat.textures.get(name).channel;
        } else {
            tex.channel = mat.textures.size;
        }

        mat.textures.set(name, tex);

        mat.isDirty = true;
        tex.isDirty = true;
    }

    static SHADER_PATH = 'res/shader/';

}