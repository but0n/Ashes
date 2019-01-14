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

    isDirty: boolean = true;    // Shader sources status

    constructor(vertCode, fragCode) {
        this.vertexSource = vertCode;
        this.fragmentSource = fragCode;
    }

    static clone(shader: Shader) {
        return new Shader(shader.vertexSource, shader.fragmentSource);
    }

    static buildProgram(shader: Shader, ctx) {
        shader.isDirty = false;
        // if(!this.isDirty) return;
        // If current program needs recompile
        shader.ctx = ctx;
        // if WebGL shader is already exist, then dispose them
        if(shader.vertex) {   // Vertex shader
            shader.ctx.deleteShader(shader.vertex);
        }
        shader.vertex = Shader.compileShader(shader.ctx, shader.ctx.VERTEX_SHADER, shader.vertexSource);

        if(shader.fragment) { // Fragment shader
            shader.ctx.deleteShader(shader.fragment);
        }
        shader.fragment = Shader.compileShader(shader.ctx, shader.ctx.FRAGMENT_SHADER, shader.fragmentSource);

        if(shader.program) {  // Shader Program
            shader.ctx.deleteProgram(shader.program);
        }
        shader.program = Shader.createShaderProgram(shader.ctx, shader.vertex, shader.fragment);


        // Pickup details
        shader.attributes = Shader.pickupActiveAttributes(shader.ctx, shader.program);
        shader.uniforms = Shader.pickupActiveUniforms(shader.ctx, shader.program);
    }

    static updateUniform(shader: Shader) {
        let gl = shader.ctx;
        for(let k in shader.uniforms) {
            let uni: Uniform = shader.uniforms[k];
            if(uni.value != null && uni.isDirty) {
                uni.isDirty = false;
                if(uni.argLength == 3) {
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

    static pickupActiveUniforms(gl: WebGL2RenderingContext, shader: WebGLProgram) {
        const amount = gl.getProgramParameter(shader, gl.ACTIVE_UNIFORMS);
        let uniforms = {};
        for(let i = 0; i < amount; i++) {
            const {name, type} = gl.getActiveUniform(shader, i);
            const location = gl.getUniformLocation(shader, name);
            const setter = Uniform.getUnifSetter(type);
            let length = gl[setter].length;
            if(length == 0) {   // prototype was modified by debugging tools
                length = Uniform.getUnifArgLenght(type);
            }
            uniforms[name] = new Uniform(location, type, setter, length);
        }
        return uniforms;
    }

    static compileShader(gl: WebGL2RenderingContext, type, code) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true) {
            return shader;
        }

        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    static createShaderProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            return program;
        }

        console.warn(gl.getProgramInfoLog(program));
        // Dispose
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }
}

export class Uniform {
    location: WebGLUniformLocation;
    type: GLenum;
    setter: string;
    argLength: number;
    constructor(location: WebGLUniformLocation, type: GLenum, setter:string, argLength: number) {
        this.location = location;
        this.type = type;
        this.setter = setter;
        this.argLength = argLength;
    }
    value=null; // empty texture channel must be null
    isDirty: boolean = false;
    static getUnifSetter(type: GLenum) {
        switch (type) {
            case WebGLRenderingContext.FLOAT:
                return 'uniform1f';
            case WebGLRenderingContext.FLOAT_VEC2:
                return 'uniform2f';
            case WebGLRenderingContext.FLOAT_VEC3:
                return 'uniform3fv';
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

    static getUnifArgLenght(type: GLenum) {
        switch (type) {
            case WebGLRenderingContext.FLOAT:
            case WebGLRenderingContext.FLOAT_VEC2:
            case WebGLRenderingContext.FLOAT_VEC3:
            case WebGLRenderingContext.FLOAT_VEC4:

            case WebGLRenderingContext.INT:
            case WebGLRenderingContext.INT_VEC2:
            case WebGLRenderingContext.INT_VEC3:
            case WebGLRenderingContext.INT_VEC4:

            case WebGLRenderingContext.SAMPLER_2D:
            case WebGLRenderingContext.SAMPLER_CUBE:
                return 2;

            // case WebGLRenderingContext.BOOL:
            // case WebGLRenderingContext.BOOL_VEC2:
            // case WebGLRenderingContext.BOOL_VEC3:
            // case WebGLRenderingContext.BOOL_VEC4:

            case WebGLRenderingContext.FLOAT_MAT2:
            case WebGLRenderingContext.FLOAT_MAT3:
            case WebGLRenderingContext.FLOAT_MAT4:
                return 3; // (location, transpose, value)

        }
    }
}