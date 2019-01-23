import { Camera } from "../camera";
import { Filter } from "../filter";
import { Shader } from "../shader";

export class Screen {
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    public mainCamera: Camera;
    static platform = 'unknown';
    public filter: Filter;
    constructor(selector) {
        // Detect device
        if(navigator.userAgent.indexOf('iPhone') != -1) {
            Screen.platform = 'iOS';
        }
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

        this.filter = new Filter(this, new Shader());
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
        this.width = width;
        this.height = height;
        this.setViewport();
    }

    setViewport(width = this.width, height =this.height) {
        this.gl.viewport(0, 0, width, height);
    }

    clear(r = 0, g = 0, b = 0, a = 0, mode = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(mode);
    }

}
