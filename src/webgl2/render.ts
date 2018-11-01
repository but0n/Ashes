import { Uniform, Attribute } from "../shader";

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
