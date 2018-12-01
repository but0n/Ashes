import { Mesh, Accessor, bufferView } from "./mesh";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import * as glMatrix from "../node_modules/gl-matrix-ts/dist/index";
import { Render } from "./webgl2/render";
import { gltfScene } from "./gltfScene";

export class Asset {
    static load(url, type: XMLHttpRequestResponseType = 'json') {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = type;
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(xhr.statusText);
                }
            }
            xhr.onerror = function () {
                reject(xhr.statusText);
            }
            xhr.send();
        });
    }

    static loadImage(url, type) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.src = url;
            image.onload = () => {
                resolve(image);
            }
        });
    }

    static async loadGLTF(path: string) {
        let screen = new Render('#screen');

        // parse current path
        let root: any = path.split('/');
        root.pop();
        root = root.join('/') + '/';
        // Load gltf
        let gltf: any = await this.load(path);

        // Download buffers
        gltf.buffers = await Promise.all(gltf.buffers.map(({ uri }) => this.loadBuffer(root + uri)));
        // console.log(gltf.buffers);
        // Download Images
        // gltf.buffers = await Promise.all(gltf.buffers.map(({ uri }) => this.loadBuffer(root + uri)));
        // console.log(gltf.buffers);


        //  BufferViews
        gltf.bufferViews = gltf.bufferViews.map((bv) => new bufferView(gltf.buffers[bv.buffer], bv));
        // console.warn(gltf.bufferViews);

        // Mesh =====================================
        let accessors: Accessor[] = [];
        let gltfMesh = gltf.meshes[0].primitives[0];
        //  Vertexes
        let { attributes } = gltfMesh;
        for (let att in attributes) {
            let acc = new Accessor(gltf.accessors[attributes[att]], att);
            acc.bufferView = gltf.bufferViews[gltf.accessors[attributes[att]].bufferView];
            accessors.push(acc);
        }
        // console.log(accessors);

        // Triangles
        let ebo = new Accessor(gltf.accessors[gltfMesh.indices]);
        ebo.bufferView = gltf.bufferViews[gltf.accessors[gltfMesh.indices].bufferView];

        let mesh = new Mesh(accessors, ebo, gltfMesh.mode);
        // console.log(mesh);


        // Load material
        let mat = await Material.LoadMaterial('test');
        let mr = new MeshRenderer(screen, mesh, mat as Material);
        let data = JSON.parse(JSON.stringify(mr));
        // console.warn(data);


        // render

        let P = glMatrix.mat4.create();
        glMatrix.mat4.perspective(P, 45.0 * Math.PI / 180.0, screen.width / screen.height, 0.01, 100.0);
        // glMatrix.mat4.perspective(P, 30, 1, 0, 100);

        let M = glMatrix.mat4.create();
        glMatrix.mat4.rotateX(M, M, 45 * Math.PI / 180);
        glMatrix.mat4.rotateY(M, M, 45 * Math.PI / 180);
        let V = glMatrix.mat4.create();
        glMatrix.mat4.lookAt(V, glMatrix.vec3.fromValues(0, 0, 20), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0, 1, 0));

        let nM = glMatrix.mat4.create();
        let yawSpeed = 1;


        Material.setUniform(mr.materials[0], 'P', P);
        Material.setUniform(mr.materials[0], 'V', V);
        Material.setUniform(mr.materials[0], 'M', M);
        Material.setUniform(mr.materials[0], 'nM', nM);

        let task = () => {
            glMatrix.mat4.rotateY(M, M, yawSpeed * Math.PI / 180);
            glMatrix.mat4.invert(nM, M);
            glMatrix.mat4.transpose(nM, nM);
            Material.setUniform(mr.materials[0], 'M', M);
            Material.setUniform(mr.materials[0], 'nM', nM);
            screen.clear();
            MeshRenderer.render(mr);
            requestAnimationFrame(task);
        }
        requestAnimationFrame(task)
        // mr.render();

        let scene = new gltfScene(gltf);

        return gltf;

    }

    static async loadBuffer(bufferPath) {
        return await this.load(bufferPath, 'arraybuffer');
    }
}