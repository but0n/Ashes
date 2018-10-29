export class Render {
    public canvas: HTMLCanvasElement;
    public gl;
    constructor(selector) {
        this.canvas = document.querySelector(selector);
        if(!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.gl = this.canvas.getContext('webgl2');
        if(!this.gl) {
            console.error('Get Context Failed');
            return;
        }
        this.setViewPort(); // initial - full screen
    }

    setViewPort(width = window.innerWidth, height = window.innerHeight) {
        let {devicePixelRatio} = window;
        this.canvas.setAttribute('width', width * devicePixelRatio + '');
        this.canvas.setAttribute('width', height * devicePixelRatio + '');
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }
}