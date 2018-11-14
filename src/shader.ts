import { Render } from "./webgl2/render";

export class Shader {
    vertex: WebGLShader;
    fragment: WebGLShader;
    // Sources
    vertexSource: string;
    fragmentSource: string;
    attributes: {};
    uniforms: {};

    ctx: WebGL2RenderingContext;
    program: WebGLProgram;

    isDirty: boolean = true;

    constructor(vertCode, fragCode) {
        this.vertexSource = vertCode;
        this.fragmentSource = fragCode;
    }

    update(ctx) {
        this.isDirty = false;
        // if(!this.isDirty) return;
        // If current program needs recompile
        this.ctx = ctx;
        // if WebGL shader is already exist, then dispose them
        if(this.vertex) {   // Vertex shader
            this.ctx.deleteShader(this.vertex);
        }
        this.vertex = Render.compileShader(this.ctx, this.ctx.VERTEX_SHADER, this.vertexSource);

        if(this.fragment) { // Fragment shader
            this.ctx.deleteShader(this.fragment);
        }
        this.fragment = Render.compileShader(this.ctx, this.ctx.FRAGMENT_SHADER, this.fragmentSource);

        if(this.program) {  // Shader Program
            this.ctx.deleteProgram(this.program);
        }
        this.program = Render.createShaderProgram(this.ctx, this.vertex, this.fragment);


        // Pickup details
        this.attributes = Shader.pickupActiveAttributes(this.ctx, this.program);
        this.uniforms = Shader.pickupActiveUniforms(this.ctx, this.program);
    }

    updateData() {
        let gl = this.ctx;
        for(let k in this.uniforms) {
            let uni: Uniform = this.uniforms[k];
            if(uni.value) {
                if(gl[uni.setter].length == 3) {
                    gl[uni.setter](uni.location, false, uni.value);
                } else {
                    gl[uni.setter](uni.location, uni.value);
                }
            }
        }
    }

    static pickupActiveAttributes(ctx: WebGL2RenderingContext, shader: WebGLProgram) {
        const amount = ctx.getProgramParameter(shader, ctx.ACTIVE_ATTRIBUTES);
        let attributes = {};
        for(let i = 0; i < amount; i++) {
            const {name} = ctx.getActiveAttrib(shader, i);
            const location = ctx.getAttribLocation(shader, name);
            attributes[name] = location;
        }
        return attributes;
    }

    static pickupActiveUniforms(ctx: WebGL2RenderingContext, shader: WebGLProgram) {
        const amount = ctx.getProgramParameter(shader, ctx.ACTIVE_UNIFORMS);
        let uniforms = {};
        for(let i = 0; i < amount; i++) {
            const {name, type} = ctx.getActiveUniform(shader, i);
            const location = ctx.getUniformLocation(shader, name);
            uniforms[name] = new Uniform(location, type);
        }
        return uniforms;
    }
}

export class Uniform {
    location: WebGLUniformLocation;
    type: GLenum;
    setter: string;
    constructor(location: WebGLUniformLocation, type: GLenum) {
        this.location = location;
        this.type = type;
        this.setter = Uniform.getUnifSetter(type);
    }
    value;
    static getUnifSetter(type: GLenum) {
        switch (type) {
            case WebGLRenderingContext.FLOAT:
                return 'uniform1f';
            case WebGLRenderingContext.FLOAT_VEC2:
                return 'uniform2f';
            case WebGLRenderingContext.FLOAT_VEC3:
                return 'uniform3f';
            case WebGLRenderingContext.FLOAT_VEC4:
                return 'uniform4f';

            case WebGLRenderingContext.INT:
                return 'uniform1i';
            case WebGLRenderingContext.INT_VEC2:
                return 'uniform2i';
            case WebGLRenderingContext.INT_VEC3:
                return 'uniform3i';
            case WebGLRenderingContext.INT_VEC4:
                return 'uniform4i';

            // case WebGLRenderingContext.BOOL:
            //     return WebGLRenderingContext.uniform1f;
            // case WebGLRenderingContext.BOOL_VEC2:
            //     return WebGLRenderingContext.uniform1f;
            // case WebGLRenderingContext.BOOL_VEC3:
            //     return WebGLRenderingContext.uniform1f;
            // case WebGLRenderingContext.BOOL_VEC4:
            //     return WebGLRenderingContext.uniform1f;

            case WebGLRenderingContext.FLOAT_MAT2:
                return 'uniformMatrix2fv';
            case WebGLRenderingContext.FLOAT_MAT3:
                return 'uniformMatrix3fv';
            case WebGLRenderingContext.FLOAT_MAT4:
                return 'uniformMatrix4fv';

            case WebGLRenderingContext.SAMPLER_2D:
                return 'uniform1i';
            case WebGLRenderingContext.SAMPLER_CUBE:
                return 'uniform1i';
        }
    }
}