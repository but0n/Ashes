import { Attribute, Uniform } from "./shader";

export class Material {
    // Shader program
    shader: WebGLProgram;
    // details
    attributes: Attribute[];
    uniforms: Uniform[];
    locationList = {};
    constructor(shader: WebGLProgram, attributes: Attribute[], uniforms: Uniform[]) {
        this.shader = shader;
        this.attributes = attributes;
        this.uniforms = uniforms;
        this.updateLocations();
    }

    updateLocations() {
        this.locationList = {};
        for(let {name, location} of this.attributes) {
            this.locationList[name] = location;
        }
        for(let {name, location} of this.uniforms) {
            this.locationList[name] = location;
        }
    }
    update(gl: WebGL2RenderingContext) {
        for(let u of this.uniforms) {
            if(gl[u.setter].length == 3) {
                gl[u.setter](u.location, false, u.value);
            } else {
                gl[u.setter](u.location, u.value);
            }
        }
    }
}