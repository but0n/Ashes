import { Camera } from "../camera";
import { Filter } from "../filter";
import { Shader } from "../shader";
import { blur } from "../filter/blur";

export class Screen {
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    public mainCamera: Camera;
    static platform = 'unknown';
    public filters: Filter[] = [];
    public pow2width: number;
    public pow2height: number;
    public capture: Filter;
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

        // initial capture
        this.pow2width = nearestPow2(this.width * this.ratio);
        this.pow2height = nearestPow2(this.height * this.ratio);
        this.capture = new Filter(this, new Shader(), this.pow2width, this.pow2height);
        this.capture.renderToScreen = false;

        // this.attachFilter(new Filter(this, new Shader(), 128, 128))
        // this.attachFilter(new Filter(this, new Shader(), 1024, 1024))
        // this.attachFilter(new Filter(this, new Shader(), 1024, 1024))
        // this.attachFilter(new Filter(this, new Shader(), 1024, 1024))
        this.attachFilter(new blur(this, 2, 0));
        // this.attachFilter(new blur(this, 0, 2));
    }

    width: number;
    height: number;
    ratio: number;

    setScreenSize(width = window.innerWidth, height = window.innerHeight) {
        let {devicePixelRatio} = window;
        console.log(devicePixelRatio);
        this.canvas.setAttribute('width', width * devicePixelRatio + '');
        this.canvas.setAttribute('height', height * devicePixelRatio + '');
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.width = width;
        this.height = height;
        this.ratio = devicePixelRatio;
        this.setViewport();
    }

    setViewport(width = this.width, height =this.height) {
        this.gl.viewport(0, 0, width, height);
    }

    clear(r = 0, g = 0, b = 0, a = 0, mode = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(mode);
    }

    attachFilter(ft: Filter) {
        if(this.filters.length) {
            // Attach to the filter chain
            let lastft = this.filters[this.filters.length - 1];
            lastft.renderToScreen = false;
            ft.setInput(lastft.output);
        } else {
            // filter head
            ft.setInput(this.capture.output);
        }
        this.filters.push(ft);
    }

    posteffect() {
        for(let i = 0, l = this.filters.length; i < l; i++) {

        }
    }

}

// https://bocoup.com/blog/find-the-closest-power-of-2-with-javascript#comment-351783898
function nearestPow2(n) {
    var m = n;
    for (var i = 0; m > 1; i++) {
        m = m >>> 1;
    }
    // Round to nearest power
    if (n & 1 << i - 1) { i++; }
    return 1 << i;
}
