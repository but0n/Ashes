/// <reference path="../node_modules/gl-matrix-ts/dist/index.d.ts" />
import { Mesh, Accessor, bufferView } from "./mesh";
import { Instance } from "./instance";
import { MeshRender } from "./meshRender";
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

                    let M = glMatrix.mat4.create();
                    glMatrix.mat4.perspective(M, 90, 1, 0, 100);
                    console.log(M);

                    let game = new Instance('#screen');
                    game.loadMaterial('/static/shader/test').then(mat => {
                        console.log(mat);
                        let mr = new MeshRender(game.renderer.gl, mesh, mat as Material);
                        mr.materials[0].uniforms[0].value = M;
                        console.log(mr);
                        game.renderer.setScreenSize();
                        let task = () => {
                            game.renderer.clear();
                            mr.render();
                            requestAnimationFrame(task);
                        }
                        requestAnimationFrame(task)
                        // mr.render();
                    });
                    // game.renderer.setScreenSize();
                    // let mesh = new Mesh()
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