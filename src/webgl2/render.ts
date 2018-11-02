import { Uniform, Attribute } from "../shader";

export class Render {
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    constructor(selector) {
        this.canvas = document.querySelector(selector);
        if(!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.gl = this.canvas.getContext('webgl2') as WebGL2RenderingContext;
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

    clear(r = 0, g = 0, b = 0, a = 0, mode = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(mode);
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
        const amount = this.gl.getProgramParameter(shader, this.gl.ACTIVE_UNIFORMS);
        let uniforms: Uniform[] = [];
        for(let i = 0; i < amount; i++) {
            const {name, type} = this.gl.getActiveUniform(shader, i);
            const location = this.gl.getUniformLocation(shader, name);
            uniforms.push(new Uniform(name, location, type));
        }
        return uniforms;
    }

    createVAO() {
        // let vao = this.gl.createVertexArray();
        // this.gl.bindVertexArray(vao);
        // this.gl.bindVertexArray(null);
        // return vao;
    }

    // --------(index: number, data: Float32Array, size: number, type: number, normalized = false, stride = 0, offset = 0,  usage = this.gl.STATIC_DRAW) {
    //     let buffer = this.gl.createBuffer();
    //     this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    //     this.gl.bufferData(this.gl.ARRAY_BUFFER, data, usage);
    //     this.gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
    //     this.gl.enableVertexAttribArray(index);
    //     return buffer;
    // }

    createBuffer(data: number | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer, type: number, usage = this.gl.STATIC_DRAW) {
        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, usage);
        return buffer;
    }

    createVBO(data, usage) {
        return this.createBuffer(data, this.gl.ARRAY_BUFFER, usage);
    }

    createEBO(data, usage) {
        return this.createBuffer(data, this.gl.ELEMENT_ARRAY_BUFFER, usage);
    }

}
