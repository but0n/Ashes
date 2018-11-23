/// <reference path="../node_modules/gl-matrix-ts/dist/index.d.ts" />
import { Mesh, Accessor, bufferView } from "./mesh";
import { Instance } from "./instance";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import * as glMatrix from "../node_modules/gl-matrix-ts/dist/index";

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
                    let game = new Instance('#screen');

                    console.log(buffers);
                    gltf.buffers = buffers;

                    let accessors: Accessor[] = [];
                    let gltfMesh = gltf.meshes[0].primitives[0];
                    console.log(gltfMesh);
                    let {attributes} = gltfMesh;
                    accessors.push(new Accessor(gltf.accessors[0], ''))
                    for(let att in attributes) {
                        accessors.push(new Accessor(gltf.accessors[attributes[att]], att));
                    }
                    console.log(accessors);

                    let views: bufferView[] = [];
                    for(let bv of gltf.bufferViews) {
                        views.push(new bufferView(gltf.buffers[bv.buffer], bv));
                    }
                    console.log(views);
                    let mesh = new Mesh(accessors, views, gltfMesh.indices, gltfMesh.mode);
                    console.log(mesh);

                    let P = glMatrix.mat4.create();
                    glMatrix.mat4.perspective(P, 45.0 * Math.PI / 180.0, game.renderer.width/game.renderer.height, 0.01, 100.0);
                    // glMatrix.mat4.perspective(P, 30, 1, 0, 100);
                    console.log(P);

                    let M = glMatrix.mat4.create();
                    glMatrix.mat4.rotateX(M, M, 45 * Math.PI / 180);
                    glMatrix.mat4.rotateY(M, M, 45 * Math.PI / 180);
                    let V = glMatrix.mat4.create();
                    glMatrix.mat4.lookAt(V, glMatrix.vec3.fromValues(0, 0, 5), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0, 1, 0));
                    let yawSpeed = 1;
                    Material.LoadMaterial('test').then(mat => {
                        console.log(mat);
                        let mr = new MeshRenderer(game.renderer.gl, mesh, mat as Material);
                        mr.materials[0].setUniform('P', P);
                        mr.materials[0].setUniform('V', V);
                        mr.materials[0].setUniform('M', M);
                        console.log(mr);
                        let task = () => {
                            glMatrix.mat4.rotateY(M, M, yawSpeed * Math.PI / 180);
                            mr.materials[0].setUniform('M', M);
                            game.renderer.clear();
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