import { Mesh } from "./mesh";
import { Material } from "./material";

export class MeshRenderer {
    gl: WebGL2RenderingContext;
    mesh: Mesh;
    materials: Material[] = [];
    vao: WebGLVertexArrayObject;
    isDirty: boolean = true;
    constructor(context: WebGL2RenderingContext, mesh: Mesh, material: Material) {
        this.gl = context;
        this.mesh = mesh;
        this.attachMaterial(material);
    }

    useMaterial(index) {
        this.gl.useProgram(this.materials[index].shader.program);
    }

    attachMaterial(mat: Material) {
        mat.update(this.gl); // the first time the material get context
        this.materials.push(mat);
        this.useMaterial(0); // NOTE: Needs confirm
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
        if(this.materials[0].isDirty) {
            this.materials[0].update(this.gl);
        }
    }


    render() {
        this.update();
        this.useMaterial(0);
        this.bindVAO(this.vao);
        this.mesh.bindIndecesEBO(this.gl);
        this.mesh.drawElement(this.gl);
    }
}