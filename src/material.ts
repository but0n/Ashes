import { Attribute, Uniform } from "./shader";

export class Material {
    // Shader program
    shader: WebGLProgram;
    // details
    attributes: Attribute[];
    uniforms: Uniform[];
    constructor(shader: WebGLProgram, attributes: Attribute[], uniforms: Uniform[]) {
        this.shader = shader;
        this.attributes = attributes;
        this.uniforms = uniforms;
    }
}