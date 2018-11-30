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
        MeshRenderer.attachMaterial(this, material);
    }

    static useMaterial(mr: MeshRenderer, index) {
        mr.gl.useProgram(mr.materials[index].shader.program);
    }

    static attachMaterial(mr: MeshRenderer, mat: Material) {
        mr.materials.push(mat);
        Material.updateUniform(mat, mr.gl); // the first time this material get context
        this.useMaterial(mr, 0);
        this.updateVAO(mr);
    }

    static bindVAO(mr: MeshRenderer, vao) {
        mr.gl.bindVertexArray(vao);
    }

    static updateVAO(mr: MeshRenderer) {
        if(mr.vao) {
            mr.gl.deleteVertexArray(mr.vao);
        }
        mr.vao = mr.gl.createVertexArray();
        this.bindVAO(mr, mr.vao);
        Mesh.bindAccessorsVBO(mr.mesh, mr.gl, mr.materials[0].shader.attributes);
        this.bindVAO(mr, null);
    }

    static updateMaterial(target: MeshRenderer) {
        if(target.materials[0].isDirty) {
            Material.updateUniform(target.materials[0], target.gl);
        }
    }


    static render(target: MeshRenderer) {
        this.updateMaterial(target);    // Update uniforms of material
        this.useMaterial(target, 0);  // Select material
        this.bindVAO(target, target.vao); // Bind VAO
        Mesh.bindIndecesEBO(target.mesh, target.gl);
        Mesh.drawElement(target.mesh, target.gl);
    }
    // According those discussion below, having actors draw themselves is not a good design
    // https://gamedev.stackexchange.com/questions/50531/entity-component-based-engine-rendering-separation-from-logic
    // https://gamedev.stackexchange.com/questions/14133/should-actors-in-a-game-be-responsible-for-drawing-themselves/14138#14138

}