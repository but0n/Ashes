import { Mesh } from "./mesh";
import { Material } from "./material";

export class MeshRenderer {
    gl: WebGL2RenderingContext;
    mesh: Mesh;
    materials: Material[] = [];
    vao: WebGLVertexArrayObject;
    isDirty: boolean = true;
    constructor({gl}, mesh: Mesh, material: Material) {
        this.gl = gl;
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
    // According those discussion below, having actors draw themselves is not a good design
    // https://gamedev.stackexchange.com/questions/50531/entity-component-based-engine-rendering-separation-from-logic
    // https://gamedev.stackexchange.com/questions/14133/should-actors-in-a-game-be-responsible-for-drawing-themselves/14138#14138

}