import { Camera } from "../camera";
import { Filter } from "../filter";
import { Shader } from "../shader";
import { Bloom } from "../filter/bloom";
import { Vignetting } from "../filter/vignetting";

export class Screen {
    static list = {};
    static platform = 'unknown';

    id: string;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    mainCamera: Camera;
    filters: Filter[] = [];
    pow2width: number;
    pow2height: number;
    capture: Filter;
    output: Filter = null;
    ratio: number;
    bgColor = [1, 1, 1, 1];
    constructor(selector) {

        this.id = selector;

        // Detect device
        if(navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('iPad') != -1) {
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
            alert('Your browser do not support WebGL2');
            return;
        }

        // Regist current screen
        Screen.list[selector] = this;

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        // this.ext = this.gl.getExtension('WEBGL_draw_buffers');

        this.setScreenSize(); // initial - full screen

        // initial capture
        this.pow2width = nearestPow2(this.width);
        this.pow2height = nearestPow2(this.height);
        this.capture = new Filter(this, new Shader());
        this.capture.renderToScreen = false;

        // Bloom.initFilters(this)
        // this.attachFilter(new Vignetting(this));
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
        this.width = width * devicePixelRatio;
        this.height = height * devicePixelRatio;
        this.ratio = devicePixelRatio;
        this.setViewport();
    }

    setViewport(width = this.width, height = this.height) {
        this.gl.viewport(0, 0, width, height);
    }

    clear(r = this.bgColor[0], g = this.bgColor[1], b = this.bgColor[2], a = this.bgColor[3], mode = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(mode);
    }

    attachFilter(ft: Filter) {
        if(this.output == null) {
            // filter head
            ft.setInput(this.capture.output);
        } else {
            // Attach to the filter chain
            this.output.renderToScreen = false;
            ft.setInput(this.output.output);
        }
        this.filters.push(ft);
        this.output = ft;
    }
    deleteFilter(index) {
        let target = this.filters[index];
        if(!target) {
            console.error('Filter does not exist!');
            return;
        }

        let prev = this.filters[index-1] || this.capture;
        let next = this.filters[index+1];

        if(next) {
            next.setInput(prev.output);
        } else {
            prev.renderToScreen = true;
        }


        this.filters.splice(index, 1);
        this.output = this.filters[this.filters.length-1];
    }

}

function nearestPow2(s) {
    let psize = 128;
    while (s > psize) {
        psize = psize<<1;
    }
    return psize;
}
