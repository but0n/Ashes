import { Shader, UniformInfo } from "../shader";
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
    uniforms = {};
    ref = 0;    // Reference counting
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
        if(mat.uniforms[key] == null) {
            mat.uniforms[key] = new Uniform();
        }
        mat.uniforms[key].value = value;
        mat.uniforms[key].isDirty = true;
        mat.isDirty = true;
    }

    static updateUniform(mat: Material) {
        const {shader} = mat;
        const gl = shader.ctx;
        for(let k in mat.uniforms) {
            const uni = mat.uniforms[k] as Uniform;
            if(uni.value != null && uni.isDirty) {
                uni.isDirty = false;
                const info = shader.uniforms[k] as UniformInfo;
                if(info == null) {
                    console.warn(`'${k} doesn't exist!`);
                } else {
                    if(info.argLength == 3) {
                        gl[info.setter](info.location, false, uni.value);
                    } else {
                        gl[info.setter](info.location, uni.value);
                    }
                }
            }
        }
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

export class Uniform {
    value = null; // empty texture channel must be null
    isDirty = false;
}