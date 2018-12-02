import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { vec3, mat4, quat } from "../node_modules/gl-matrix/lib/gl-matrix";
import { Render } from "./webgl2/render";
import { gltfScene } from "./gltfScene";
import { EntityMgr, Entity } from "./ECS/entityMgr";
import { Transform } from "./transform";
import { Shader } from "./shader";

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

    static loadImage(url) {
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

        // then download images
        gltf.images = await Promise.all(gltf.images.map(({ uri }) => this.loadImage(root + uri)));

        // Load shader
        gltf.commonShader = await this.LoadShaderProgram('test');



        let P = mat4.create();
        mat4.perspective(P, 45.0 * Math.PI / 180.0, screen.width / screen.height, 0.01, 100.0);

        let V = mat4.create();
        mat4.lookAt(V, vec3.fromValues(0, 8, 10), vec3.fromValues(0, 3, 0), vec3.fromValues(0, 1, 0));

        // let nM = glMatrix.mat4.create();
        let yawAngle = 1;

        let {scene} = new gltfScene(gltf, screen);
        console.log(scene);
        screen.canvas.appendChild(scene);

        let meshRendererComponents: MeshRenderer[] = EntityMgr.getComponents(MeshRenderer.name);
        console.log(meshRendererComponents);
        for(let mr of meshRendererComponents) {
            // Camera stuff
            Material.setUniform(mr.materials[0], 'P', P);
            Material.setUniform(mr.materials[0], 'V', V);
        }


        let cubeParent = meshRendererComponents[0].entity.parentElement as Entity;
        let parentTrans: Transform = cubeParent.components.Transform;
        quat.fromEuler(parentTrans.quaternion, 0, 0, 0);

        let transComponents: Transform[] = EntityMgr.getComponents(Transform.name);

        let task = () => {
            screen.clear();

            yawAngle += 1;
            let trans: Transform = scene.components.Transform;
            quat.fromEuler(trans.quaternion, 0, yawAngle, 0);

            for(let trans of transComponents) {
                // if(trans.isDirty)
                Transform.updateMatrix(trans);
            }


            for(let mr of meshRendererComponents) {
                MeshRenderer.render(mr);
                // break
            }
            requestAnimationFrame(task);
        }
        requestAnimationFrame(task);

        return gltf;

    }

    static async loadBuffer(bufferPath) {
        return await this.load(bufferPath, 'arraybuffer');
    }

    static async LoadShaderProgram(url) {
        url = Material.SHADER_PATH + url;
        let vertPath = url + '.vs.glsl';
        let fragPath = url + '.fs.glsl';
        let [vert, frag] = await Promise.all([vertPath, fragPath].map(path => Asset.load(path, 'text')));
        console.log(vert);
        console.log(frag);
        return new Shader(vert, frag);
    }

    static async LoadMaterial(matName) {
        let shader = await this.LoadShaderProgram(matName);
        return new Material(shader);
    }
}