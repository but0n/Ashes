export class Render {
    public canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;
    constructor(selector) {
        this.canvas = document.querySelector(selector);
        if(!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.gl = this.canvas.getContext('webgl2') as WebGLRenderingContext;
        if(!this.gl) {
            console.error('Get Context Failed');
            return;
        }
        this.setScreenSize(); // initial - full screen
    }

    setScreenSize(width = window.innerWidth, height = window.innerHeight) {
        let {devicePixelRatio} = window;
        this.canvas.setAttribute('width', width * devicePixelRatio + '');
        this.canvas.setAttribute('width', height * devicePixelRatio + '');
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.gl.viewport(0, 0, width, height);
    }

    buildShader(type, code) {
        let gl = this.gl;
        let shader = gl.createShader(type);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true) {
            return shader;
        }

        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        let gl = this.gl;
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

    pickupActiveAttributes(shader: WebGLProgram) {
        const amount = this.gl.getProgramParameter(shader, this.gl.ACTIVE_ATTRIBUTES);
        let attributes: Attribute[] = [];
        for(let i = 0; i < amount; i++) {
            const {name} = this.gl.getActiveAttrib(shader, i);
            const location = this.gl.getAttribLocation(shader, name);
            attributes.push(new Attribute(name, location));
        }
        return attributes;
    }

    pickupActiveUniforms(shader: WebGLProgram) {
        const amount = this.gl.getProgramParameter(shader, this.gl.ACTIVE_ATTRIBUTES);
        let uniforms: Uniform[] = [];
        for(let i = 0; i < amount; i++) {
            const {name, type} = this.gl.getActiveUniform(shader, i);
            const location = this.gl.getUniformLocation(shader, name);
            uniforms.push(new Uniform(name, location, type));
        }
        return uniforms;
    }
}

class Attribute {
    name: string;
    location: number;
    constructor(name: string, location: number) {
        this.name = name;
        this.location = location;
    }
}

class Uniform {
    name: string;
    location: WebGLUniformLocation;
    type: GLenum;
    setter: string;
    constructor(name: string, location: WebGLUniformLocation, type: GLenum) {
        this.name = name;
        this.location = location;
        this.type = type;
        this.setter = Uniform.getUnifSetter(type);
    }

    static getUnifSetter(type: GLenum) {
        switch(type) {
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