import { Mesh } from "./mesh";
import { Material } from "./material";

export class MeshRender {
    mesh: Mesh;
    materials: Material[];
    constructor(mesh: Mesh) {

    }

    attachMaterial(mat: Material) {
        this.materials.push(mat);
    }
}