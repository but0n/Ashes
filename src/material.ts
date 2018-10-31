export class Material {
    shader: WebGLProgram;
    attributes: [];
    uniforms: [];
    constructor(shader: WebGLProgram, attributes, uniforms) {
        this.shader = shader;
        this.attributes = attributes;
        this.uniforms = uniforms;
    }
}