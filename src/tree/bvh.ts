import { vec3 } from "../math";
import { Mesh } from "../mesh/mesh";

class AABB {
    max: Float32Array = vec3.create();
    min: Float32Array = vec3.create();

    private _center: Float32Array = vec3.create();
    get center() {
        if(this.isDirty)
            this.updateCenter();
        return this._center;
    }

    private isDirty = false;

    private updateCenter() {
        this._center[0] = (this.max[0] - this.min[0]) * 0.5;
        this._center[1] = (this.max[1] - this.min[1]) * 0.5;
        this._center[2] = (this.max[2] - this.min[2]) * 0.5;
    }
    update(p: Float32Array) {
        this.max[0] = Math.max(this.max[0], p[0]);
        this.max[1] = Math.max(this.max[1], p[1]);
        this.max[2] = Math.max(this.max[2], p[2]);
        this.min[0] = Math.min(this.min[0], p[0]);
        this.min[1] = Math.min(this.min[1], p[1]);
        this.min[2] = Math.min(this.min[2], p[2]);
        this.isDirty = true;
    }
}

class BVHNode {
    bounds = new AABB();
    right: BVHNode;
    left: BVHNode;
    isLeaf = false;
    index: number = -1;
    length: number;

    get raw() {
        return new Float32Array(6);
    }
    static hitable(ray, bounds: AABB) {
    }
}

class trianglePrimitive {
    bounds = new AABB();
    index: number;
}

export class BVHManager {
    nodeList: BVHNode[] = [];
    primitives: Float32Array;
    meshes: Mesh[];

    LBVH: Float32Array;
    LBVH_nodes: Float32Array[];

    constructor(texSize = 2048) {
        const LBVHTexture = BVHManager.createDataTex(texSize, 2);
        this.LBVH = LBVHTexture.raw;
        this.LBVH_nodes = LBVHTexture.chunks;
        // R-G-B-A-R-G-B-A
        // X-Y-Z-_-X-Y-Z-P
    }

    static createDataTex(texSize = 2048, chunkTexels = 1) {
        const totalTexel = texSize * texSize;
        const totalChunks = totalTexel / chunkTexels;
        const chunkOffset = chunkTexels * 4;
        const raw = new Float32Array(totalTexel * 4);
        const chunks: Float32Array[] = [];
        for(let i = 0; i < totalChunks; i++) {
            chunks[i] = raw.subarray(i * chunkOffset, (i + 1) * chunkOffset);
        }
        return {raw, chunks};
    }

    // Generate bounds of triangles, mind GC!
    genBounds(triangles: Float32Array[], size = triangles.length) {
        const boxList: trianglePrimitive[] = [];
        // [[x, y, z] * 3, ...]
        for(let i = 0; i < size;) {
            const box = new trianglePrimitive();
            box.index = i;  // Offset of the first vertex
            box.bounds.update(triangles[i++]);
            box.bounds.update(triangles[i++]);
            box.bounds.update(triangles[i++]);
            boxList.push(box);
        }
        return boxList;
    }

    buildBVH(meshes: Mesh[]) {
        const d = Date.now();
        // ? x-y-z-x y-z-x-y z-x
        const triangleTexture = BVHManager.createDataTex();
        let offset = 0;
        for(let m of meshes) {
            let data: any = m.data;
            let pos: Float32Array[] = data.POSITION;
            let face = m.indices.data;
            for(let i = 0; i < face.length; i++) {
                const vertex = pos[face[i]];
                triangleTexture.chunks[offset++].set(vertex);
            }
        }

        const primitives = this.genBounds(triangleTexture.chunks, offset);
        const root = this.splitBVH(primitives);
        const LBVH = this.fillLBVH(root);
        console.log(`Build BVH cost ${Date.now() - d}ms`);
        return LBVH;
    }

    private _size = vec3.create();
    splitBVH(prim: trianglePrimitive[]) {
        if(prim.length == 0) // Empty branch
            return null;

        const node = new BVHNode();

        // TODO:
        if(prim.length == 1) {
            node.isLeaf = true;
            node.index = prim[0].index;
            return node;
        }

        // Calculate current AABB
        for(let p of prim) {
            node.bounds.update(p.bounds.max);
            node.bounds.update(p.bounds.min);
        }

        // Compare and find the longest axis
        const size = this._size;
        vec3.sub(size, node.bounds.max, node.bounds.min);
        const axis = size.indexOf(Math.max(size[0], size[1], size[2]));

        // if(size[axis] > 0) {}

        const middle = node.bounds.min[axis] + size[axis] / 2;

        let left: trianglePrimitive[] = [];
        let right: trianglePrimitive[] = [];

        // FIXME:
        for(let p of prim) {
            if(p.bounds.center[axis] < middle) {
                left.push(p);
            } else {
                right.push(p);
            }
        }

        if(left.length == 0 && right.length == 0) {
            // Impossible, unless prim is empty
            debugger
        }

        if(left.length == 0) {
            // Make sure left branch is allways exist, even one of them is empty
            const cache = left;
            left = right;
            right = cache;
        }

        node.left = this.splitBVH(left);
        node.right = this.splitBVH(right);

        return node;
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

    fillLBVH(root: BVHNode) {
        this.LBVH.fill(0);
        BVHManager.fillLinearNode(root, this.LBVH_nodes);
        return this.LBVH;
    }

    // Create LBVH
    static fillLinearNode(root: BVHNode, mem: Float32Array[], index = 0) {
        let right = root.right
            ? index + 1 // (*)incase right branch is exist but left is null
            : -1;       // right branch is empty

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
        mem[index][3] = right;
        mem[index][7] = root.index;
        index++;

        if(root.right) {
            // Append right branch
            index = this.fillLinearNode(root.right, mem, right);
        }
        return index;
    }

}