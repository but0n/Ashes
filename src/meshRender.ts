import { Mesh } from "./mesh";
import { Material } from "./material";

export class MeshRender {
    gl: WebGL2RenderingContext;
    mesh: Mesh;
    materials: Material[];
    vao: WebGLVertexArrayObject;
    constructor(context: WebGL2RenderingContext) {
        this.gl = context;
        // this.vao = this.gl.createVertexArray();
    }

    attachMaterial(mat: Material) {
        this.materials.push(mat);
        // this.updateVAO();
    }

    bindVAO(vao) {
        this.gl.bindVertexArray(vao);
    }

    // updateVAO() {
    //     this.vao = this.gl.createVertexArray();
    //     this.bindVAO(this.vao);
    //     this.bindVAO(null);
    // }


    // render(mode = this.gl.TRIANGLES) {
    //     this.gl.useProgram(this.materials[0].shader);
    //     this.bindVAO(this.vao);
    //     // this.gl.drawElements(mode, 1, )
    // }
}