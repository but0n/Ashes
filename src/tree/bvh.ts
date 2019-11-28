import { vec3 } from "../math";
import { Mesh } from "../mesh/mesh";

class AABB {
    max: Float32Array = vec3.create();
    min: Float32Array = vec3.create();
    constructor() {
    }
}

class BVHNode {
    bounds: AABB;
    right: BVHNode;
    left: BVHNode;
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

    // Test
    static createTree(deep) {
        let root = new BVHNode();
        if(deep--) {
            root.left = this.createTree(deep);
            root.right = this.createTree(deep);
        } else {
            root.isLeaf = true;
        }
        return root;
    }

    // Create LBVH
    static fillLinearNode(root: BVHNode, mem: Float32Array[], index = 0) {
        let right = -1;
        if(root.left) {
            // Append left branch behind current node
            right = this.fillLinearNode(root.left, mem, index+1);
        }

        // Fill curretn node
        // root.index = right;
        // mem[index++] = [root, right, root.isLeaf];
        mem[index].set(root.bounds.min);
        mem[index].set(root.bounds.max, 4);
        // TODO: Obj
        // mem[index][3] = root.index;
        // mem[index][7] = right;
        index++;

        if(root.right) {
            // Append right branch
            index = this.fillLinearNode(root.right, mem, right);
        }
        return index;
    }

}