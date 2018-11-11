import { Mesh } from "./mesh";
import { Material } from "./material";

export class MeshRender {
    gl: WebGL2RenderingContext;
    mesh: Mesh;
    materials: Material[] = [];
    vao: WebGLVertexArrayObject;
    constructor(context: WebGL2RenderingContext, mesh: Mesh, material: Material) {
        this.gl = context;
        this.mesh = mesh;
        // this.vao = this.gl.createVertexArray();
        this.attachMaterial(material);
    }

    attachMaterial(mat: Material) {
        this.materials.push(mat);
        this.updateVAO();
    }

    bindVAO(vao = this.vao) {
        this.gl.bindVertexArray(vao);
    }

    updateVAO() {
        if(this.vao) {
            this.gl.deleteVertexArray(this.vao);
        }
        this.vao = this.gl.createVertexArray();
        this.bindVAO(this.vao);
        this.mesh.bindAccessorsVBO(this.gl, this.materials[0].locationList);
        this.bindVAO(null);
    }

    update() {
        this.materials[0].update(this.gl);
    }


    render() {
        this.gl.useProgram(this.materials[0].shader);
        this.update();
        this.bindVAO(this.vao);
        this.mesh.bindIndecesEBO(this.gl);
        this.mesh.drawElement(this.gl);
    }
}