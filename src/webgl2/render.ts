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
        this.setViewPort(); // initial - full screen
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
        let attributes = {};
        for(let i = 0; i < amount; i++) {
            const {name} = this.gl.getActiveAttrib(shader, i);
            const location = this.gl.getAttribLocation(shader, name);
        }
    }
}