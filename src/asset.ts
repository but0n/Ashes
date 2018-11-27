import { Mesh, Accessor, bufferView } from "./mesh";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import * as glMatrix from "../node_modules/gl-matrix-ts/dist/index";
import { Render } from "./webgl2/render";
import { Entity } from "./ECS/entity";

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

    static loadGLTF(path: string) {
        return new Promise((resolve, reject) => {
            let root: any = path.split('/');
            root.pop();
            root = root.join('/') + '/';
            this.load(path).then((gltf:any) => {
                console.log(gltf);

                let bufferTask = [];
                for(let {uri, byteLength} of gltf.buffers) {
                    bufferTask.push(this.loadBuffer(root+uri))
                }
                Promise.all(bufferTask).then(buffers => {
                    let screen = new Render('#screen');

                    console.log(buffers);
                    gltf.buffers = buffers;

                    let accessors: Accessor[] = [];
                    let gltfMesh = gltf.meshes[0].primitives[0];
                    console.log(gltfMesh);

                    //  Buffers
                    let views: bufferView[] = [];
                    for(let bv of gltf.bufferViews) {
                        views.push(new bufferView(gltf.buffers[bv.buffer], bv));
                    }

                    //  Vertexes
                    let {attributes} = gltfMesh;
                    for(let att in attributes) {
                        let acc = new Accessor(gltf.accessors[attributes[att]], att);
                        acc.bufferView = views[gltf.accessors[attributes[att]].bufferView];
                        accessors.push(acc);
                    }
                    console.log(accessors);

                    // Triangles
                    let ebo = new Accessor(gltf.accessors[gltfMesh.indices]);
                    ebo.bufferView = views[gltf.accessors[gltfMesh.indices].bufferView];

                    console.log(views);
                    let mesh = new Mesh(accessors, ebo, gltfMesh.mode);
                    console.log(mesh);

                    let P = glMatrix.mat4.create();
                    glMatrix.mat4.perspective(P, 45.0 * Math.PI / 180.0, screen.width/screen.height, 0.01, 100.0);
                    // glMatrix.mat4.perspective(P, 30, 1, 0, 100);
                    console.log(P);

                    let M = glMatrix.mat4.create();
                    glMatrix.mat4.rotateX(M, M, 45 * Math.PI / 180);
                    glMatrix.mat4.rotateY(M, M, 45 * Math.PI / 180);
                    let V = glMatrix.mat4.create();
                    glMatrix.mat4.lookAt(V, glMatrix.vec3.fromValues(0, 0, 3), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0, 1, 0));

                    let nM = glMatrix.mat4.create();
                    let yawSpeed = 1;
                    Material.LoadMaterial('test').then(mat => {
                        console.log(mat);
                        let mr = new MeshRenderer(screen, mesh, mat as Material);
                        mr.materials[0].setUniform('P', P);
                        mr.materials[0].setUniform('V', V);
                        mr.materials[0].setUniform('M', M);
                        mr.materials[0].setUniform('nM', nM);
                        console.log(mr);
                        let obj = Entity.createEntity();
                        Entity.addComponent(obj, mr);
                        console.log(obj);
                        let task = () => {
                            glMatrix.mat4.rotateY(M, M, yawSpeed * Math.PI / 180);
                            glMatrix.mat4.invert(nM, M);
                            glMatrix.mat4.transpose(nM, nM);
                            mr.materials[0].setUniform('M', M);
                            mr.materials[0].setUniform('nM', nM);
                            screen.clear();
                            mr.render();
                            requestAnimationFrame(task);
                        }
                        requestAnimationFrame(task)
                        // mr.render();
                    });
                    resolve(gltf);
                });
            })
        });
    }

    static loadBuffer(bufferPath) {
        return new Promise((resolve, rejects) => {
            this.load(bufferPath, 'arraybuffer').then(buffer => {
                resolve(buffer);
            });
        });
    }
}