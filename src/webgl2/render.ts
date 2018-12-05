import { Camera } from "../camera";

export class Render {
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    camera: Camera;
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
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.setScreenSize(); // initial - full screen
    }

    width: number;
    height: number;

    setScreenSize(width = window.innerWidth, height = window.innerHeight) {
        let {devicePixelRatio} = window;
        console.log(devicePixelRatio);
        this.canvas.setAttribute('width', width * devicePixelRatio + '');
        this.canvas.setAttribute('height', height * devicePixelRatio + '');
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.gl.viewport(0, 0, width * devicePixelRatio, height * devicePixelRatio);
        this.width = width;
        this.height =height;
    }

    clear(r = 1, g = 1, b = 1, a = 1, mode = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(mode);
    }

}
