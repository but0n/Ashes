import { vec3, vec4 } from "../math";
import { Mesh, bufferView, Accessor } from "../mesh/mesh";
import { Texture } from "../texture";
import { Entity, EntityMgr } from "../ECS/entityMgr";
import { Material } from "../material/material";
import { Shader } from "../shader";
import { glsl } from "../glsl";
import { MeshRenderer } from "../meshRenderer";
import { Screen } from "../webgl2/screen";
import { Transform } from "../transform";

export class AABB {
    max: Float32Array = vec3.create();
    min: Float32Array = vec3.create();

    isDefault = true;

    private _center: Float32Array = vec3.create();
    get center() {
        if(this.isDirty)
            this.updateCenter();
        return this._center;
    }

    private isDirty = false;

    private updateCenter() {
        if(this.isDefault)
            return console.error('AABB is incorrect!');
        this._center[0] = this.min[0] + (this.max[0] - this.min[0]) * 0.5;
        this._center[1] = this.min[1] + (this.max[1] - this.min[1]) * 0.5;
        this._center[2] = this.min[2] + (this.max[2] - this.min[2]) * 0.5;
        this.isDirty = false;
    }
    update(p: Float32Array) {
        this.isDirty = true;

        if(this.isDefault) {
            this.max[0] = p[0];
            this.max[1] = p[1];
            this.max[2] = p[2];
            this.min[0] = p[0];
            this.min[1] = p[1];
            this.min[2] = p[2];
            this.isDefault = false;
            return;
        }
        this.max[0] = Math.max(this.max[0], p[0]);
        this.max[1] = Math.max(this.max[1], p[1]);
        this.max[2] = Math.max(this.max[2], p[2]);
        this.min[0] = Math.min(this.min[0], p[0]);
        this.min[1] = Math.min(this.min[1], p[1]);
        this.min[2] = Math.min(this.min[2], p[2]);
    }

    private _isVisible = false;
    root: Entity;
    agent: Entity;
    screen: Screen;
    get visible() {
        return this._isVisible;
    }
    static mat = new Material(new Shader(glsl.line.vs, glsl.line.fs));
    set visible(status) {
        this._isVisible = status;

        if(status) {
            if(!this.agent) {
                this.agent = this.root.appendChild(EntityMgr.create('aabb'));
                const mesh = this.createMesh();
                const mr = new MeshRenderer(this.screen, mesh, AABB.mat);
                this.agent.addComponent(mr);
            }
        }
    }


    createMesh() {
        const x = this.max[0];
        const y = this.max[1];
        const z = this.max[2];
        const x2 = this.min[0];
        const y2 = this.min[1];
        const z2 = this.min[2];
        let meshVBO = new Float32Array([
            //x x
            // \/\
            //  x x
            x, y, z,    // 0
            x, y2, z,   // 1
            x, y, z2,   // 2
            x, y2, z2,  // 3

            x2, y, z,   // 4
            x2, y2, z,  // 5
            x2, y, z2,  // 6
            x2, y2, z2, // 7

        ]);
        let meshEBO = new Uint16Array([
            0, 1, 5, 4,
            0, 2, 6, 4,
            4, 5, 7, 6,
            7, 3, 1, 3, 2
        ]);
        let vbo = new bufferView(meshVBO.buffer, {
            byteOffset: meshVBO.byteOffset,
            byteLength: meshVBO.byteLength,
            byteStride: 3*4,
            target: WebGL2RenderingContext.ARRAY_BUFFER
        });
        let ebo = new bufferView(meshEBO.buffer, {
            byteOffset: meshEBO.byteOffset,
            byteLength: meshEBO.byteLength,
            byteStride: 0,
            target: WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER
        });

        let position = new Accessor({
            bufferView: vbo,
            componentType: WebGL2RenderingContext.FLOAT,
            byteOffset: 0,
            type: "VEC3",
            count: 8
        }, 'POSITION');
        let indices = new Accessor({
            bufferView: ebo,
            componentType: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteOffset: 0,
            type: "SCALAR",
            count: meshEBO.length
        });
        // return new Mesh([position], indices);
        return new Mesh([position], indices, WebGL2RenderingContext.LINE_LOOP);
    }
}

class BVHNode {
    bounds = new AABB();
    right: BVHNode;
    left: BVHNode;
    isLeaf = false;
    index: number = -1;
    mat: number = -1;
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
    mat: number;
}

class DataTexture {
    raw: Float32Array;
    chunks: Float32Array[];
    tex: Texture;

    constructor(texSize = 2048, chunkTexels = 1) {
        const totalTexel = texSize * texSize;
        const totalChunks = totalTexel / chunkTexels;
        const chunkOffset = chunkTexels * 4;
        const raw = new Float32Array(totalTexel * 4);
        const chunks: Float32Array[] = [];
        for(let i = 0; i < totalChunks; i++) {
            chunks[i] = raw.subarray(i * chunkOffset, (i + 1) * chunkOffset);
        }

        const tex = new Texture(null, {
            magFilter: WebGL2RenderingContext.LINEAR,
            minFilter: WebGL2RenderingContext.LINEAR,
            wrapS: WebGL2RenderingContext.CLAMP_TO_EDGE,
            wrapT: WebGL2RenderingContext.CLAMP_TO_EDGE,
        });
        tex.data = raw;
        tex.height = texSize;
        tex.width = texSize;
        tex.format = WebGL2RenderingContext.RGBA;
        tex.internalformat = WebGL2RenderingContext.RGBA32F;
        tex.type = WebGL2RenderingContext.FLOAT;
        tex.isDirty = true;

        this.raw = raw;
        this.chunks = chunks;
        this.tex = tex;

    }
}

export class BVHManager {
    nodeList: BVHNode[] = [];
    primitives: Float32Array;
    meshes: Mesh[];
    root: BVHNode;

    LBVH: Float32Array;
    LBVH_nodes: Float32Array[];

    trianglesTex: DataTexture;
    LBVHTexture: DataTexture;

    matMap: Map<string, [number, Material]> = new Map();

    matConfig;

    constructor(texSize = 2048) {
        // const LBVHTexture = BVHManager.createDataTex(texSize, 2);
        this.LBVHTexture = new DataTexture(texSize, 2);
        this.LBVH = this.LBVHTexture.raw;
        this.LBVH_nodes = this.LBVHTexture.chunks;
        // R-G-B-A-R-G-B-A
        // X-Y-Z-_-X-Y-Z-P
    }
    // Generate bounds of triangles, mind GC!
    genBounds(triangles: Float32Array[], size = triangles.length, materialOffset) {
        const boxList: trianglePrimitive[] = [];
        // [[x, y, z] * 3, ...]
        let anchor = 0;
        for(let i = 0; i < size;) {
            // [offset, index]
            if(anchor < materialOffset.length - 1 && i >= materialOffset[anchor+1][0]) {
                anchor++;
            }
            const box = new trianglePrimitive();
            box.mat = materialOffset[anchor][1];  // Count From 0
            box.index = i*2;  // Offset of the first vertex
            // box.index = i;  // Offset of the first vertex
            box.bounds.update(triangles[i++]);
            box.bounds.update(triangles[i++]);
            box.bounds.update(triangles[i++]);
            boxList.push(box);
        }
        console.log("Materials: " + this.matMap);
        return boxList;
    }

    materialsHandler(mats: Map<string, [number, Material]>) {
        let params = '';
        let route = `
        if(mat < -.5) {
            continue;
        }`;
        let tasks = [];
        for(const [name, [i,mt]] of mats) {
            // Textures
            const tex = mt.textures;

            // baseColorTexture
            let base = `
            // float scale = 50.;
            // float fact = step(.0, sin(iuv.x * scale)*sin(iuv.y * scale));
            // albedo = vec3(1) * clamp(fact, .2, 1.);
            albedo = sRGBtoLINEAR(texture(ground, iuv * 15.)).rgb;
`;
            if(tex.has('baseColorTexture')) {
                params += `
uniform sampler2D baseColorTexture_${i};
`;
                base = `albedo = sRGBtoLINEAR(texture(baseColorTexture_${i}, iuv)).rgb;`;
                tasks.push(m => {
                    Material.setTexture(m, `baseColorTexture_${i}`, tex.get('baseColorTexture')[1]);
                });
            }

            // metallicRoughnessTexture
            let rm = `
            vec3 rm = vec3(0, .8, .08);
            metal = clamp(rm.b, 0.0, 1.0);
            roughness = clamp(rm.g, 0.0, 1.0);
`;
            if(tex.has('metallicRoughnessTexture')) {
                params += `
uniform sampler2D metallicRoughnessTexture_${i};
`;
                rm = `
                vec3 rm = texture(metallicRoughnessTexture_${i}, iuv).rgb;
                metal = clamp(rm.b, 0.0, 1.0);
                roughness = clamp(rm.g, 0.04, 1.0);
`;
                tasks.push(m => {
                    Material.setTexture(m, `metallicRoughnessTexture_${i}`, tex.get('metallicRoughnessTexture')[1]);
                });
            }

            // emissiveTexture
            let em = '';
            if(tex.has('emissiveTexture')) {
                params += `
uniform sampler2D emissiveTexture_${i};
`;
                em = `
                vec3 em = sRGBtoLINEAR(texture(emissiveTexture_${i}, iuv)).rgb;
                if(dot(em, em) > .01)
                    return em;
`;
                tasks.push(m => {
                    Material.setTexture(m, `emissiveTexture_${i}`, tex.get('emissiveTexture')[1]);
                });
            }

            route += `
            else if(mat < ${i}.5) { // NOTE: ${name}
                ${base}
                ${rm}
                ${em}
            }`;
        }
        const init = m => {
            for(let t of tasks)
                t(m);
        }
        return {params, route, init};
    }

    buildBVH(meshes: Mesh[]) {
        const d = Date.now();
        let materialList = [];
        // ? x-y-z-x y-z-x-y z-x
        const triangleTexture = new DataTexture(2048, 2);
        let offset = 0;
        // Reduce GC
        const wpos = vec3.create(); // World position
        const wnor = vec4.create(); // World position

        for(let m of meshes) {
            // Collect materials
            const mt = m['entity'].components.Material as Material;
            let mtIndex = -1;
            if(this.matMap.has(mt.name)) {
                [mtIndex] = this.matMap.get(mt.name);
            } else {
                // New material
                mtIndex = this.matMap.size;
                this.matMap.set(mt.name, [this.matMap.size, mt]);
            }
            materialList.push([offset, mtIndex]);
            let trans = m['entity'].components.Transform as Transform;
            let data: any = m.data;
            let pos: Float32Array[] = data.POSITION;
            let normal: Float32Array[] = data.NORMAL;
            let uv: Float32Array[] = data.TEXCOORD_0;
            let face = m.indices.data;
            for(let i = 0; i < face.length; i++) {
                // Per vertex
                // R G B A - R G B A - R G B A - R G B A - R G B A - R G B A
                //[x y z u 1 n n n v] [x y z u 2 n n n v] [x y z u 3 n n n v]
                const cur = triangleTexture.chunks[offset++];
                const vertex = pos[face[i]];
                vec3.transformMat4(wpos, vertex, trans.worldMatrix);

                cur.set(wpos);
                // cur[3] = 1;

                if(normal) {
                    const n = normal[face[i]];
                    vec4.set(wnor, n[0], n[1], n[2], 0);
                    vec4.transformMat4(wnor, wnor, trans.worldNormalMatrix);
                    vec3.normalize(wnor, wnor);

                    cur.set(wnor, 4);
                }

                if(uv) {
                    cur[3] = uv[face[i]][0];
                    cur[7] = uv[face[i]][1];
                }
            }
        }

        const primitives = this.genBounds(triangleTexture.chunks, offset, materialList);
        const root = this.root = this.splitBVH(primitives);
        const LBVH = this.fillLBVH(root, this.LBVHTexture);
        const matHandler = this.materialsHandler(this.matMap);
        console.log(`Build BVH cost ${Date.now() - d}ms`);
        return {LBVH, triangleTexture, primitives, matHandler};
    }

    private _size = vec3.create();
    splitBVH(prim: trianglePrimitive[]) {
        if(prim.length == 0) // Empty branch
            return null;

        const node = new BVHNode();

        // Calculate current AABB
        for(let p of prim) {
            node.bounds.update(p.bounds.max);
            node.bounds.update(p.bounds.min);
        }

        // TODO:
        if(prim.length < 2) {
            node.isLeaf = true;
            node.index = prim[0].index;
            node.mat = prim[0].mat;
            return node;
        }

        // Compare and find the longest axis
        const size = this._size;
        vec3.sub(size, node.bounds.max, node.bounds.min);


        let axis = size.indexOf(Math.max(size[0], size[1], size[2]));

        // if(size[axis] > 0) {}

        let left: trianglePrimitive[] = [];
        let right: trianglePrimitive[] = [];


        let c = 3;
        while(c-- && (left.length == 0 || right.length == 0)) {
            // const middle = node.bounds.min[axis] + size[axis] / 2;
            // const middle = node.bounds.min[axis%3] + size[axis%3] / 2;
            const middle = node.bounds.center[axis%3];
            // Reset
            left = [];
            right = [];

            // FIXME:
            for(let p of prim) {
                if(p.bounds.center[axis] < middle) {
                    left.push(p);
                } else {
                    right.push(p);
                }
            }
            axis++;
            if(c == 0) {
                // FIXME:
                const m = Math.ceil(prim.length / 2);
                // if(m < 6) {
                    // left = prim.slice(0, 1);
                    // right = prim.slice(m, m+1);
                // } else {
                    left = prim.slice(0, m);
                    right = prim.slice(m);
                // }
                // left = [prim[0]];
                // right = [prim[1]];
            }
        }

        if(left.length == 0 && right.length == 0) {
            // Impossible, unless prim is empty
            debugger
        }

        if(left.length == 0) {
            // Make sure left branch is allways exist, even one of them is empty
            const cache = left; // []
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

    fillLBVH(root: BVHNode, LBVH: DataTexture) {
        LBVH.raw.fill(0);
        BVHManager.fillLinearNode(root, LBVH.chunks);
        return LBVH;
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
        if(root.isLeaf) {
            // Leaf node
            mem[index][3] = root.mat;
        } else {
            mem[index][3] = right;
        }
        mem[index][7] = root.index;
        index++;

        if(root.right) {
            // Append right branch
            index = this.fillLinearNode(root.right, mem, right);
        }
        return index;
    }

}