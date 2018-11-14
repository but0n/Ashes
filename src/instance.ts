import { Render } from "./webgl2/render";

export class Instance {
    renderer: Render;
    constructor(selector) {
        this.renderer = new Render(selector);
    }

}