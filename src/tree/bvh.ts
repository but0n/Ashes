import { vec3 } from "../math";
import { Mesh } from "../mesh/mesh";

class AABB {
    max: Float32Array = vec3.create();
    min: Float32Array = vec3.create();
    constructor() {
    }
}

class BVHNode {
    private bounds: AABB;
    isLeaf = false;
    index: number;
    length: number;

    get raw() {
        return new Float32Array(6);
    }
    static hitable(ray, bounds: AABB) {
    }
}

class BVHManager {
    nodeList: BVHNode[] = [];
    primitives: Float32Array;
    meshes: Mesh[];

    getBounds(triangles: Float32Array, vertices: Float32Array) {

    }

    build() {

    }
}