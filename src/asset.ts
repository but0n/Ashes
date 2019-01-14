import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { Render } from "./webgl2/render";
import { gltfScene } from "./gltfScene";
import { EntityMgr } from "./ECS/entityMgr";
import { Shader } from "./shader";
import { Mesh } from "./mesh/mesh";
import { Texture } from "./texture";

export class Asset {
    // static load(url, type: XMLHttpRequestResponseType = 'json') {
    //     return new Promise((resolve, reject) => {
    //         let xhr = new XMLHttpRequest();
    //         xhr.open('GET', url);
    //         xhr.responseType = type;
    //         xhr.onload = function () {
    //             if (this.status >= 200 && this.status < 300) {
    //                 resolve(xhr.response);
    //             } else {
    //                 reject(xhr.statusText);
    //             }
    //         }
    //         xhr.onerror = function () {
    //             reject(xhr.statusText);
    //         }
    //         xhr.send();
    //     });
    // }

    static loadImage(url) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.crossOrigin = "anonymous";
            image.src = url;
            image.onload = () => {
                resolve(image);
            }
        });
    }

    static async loadGLTF(path: string, screen: Render, shader = 'stylize') {

        // parse current path
        let root: any = path.split('/');
        root.pop();
        root = root.join('/') + '/';
        // Load gltf
        let gltf: any = await (await fetch(path)).json();

        // Download buffers
        gltf.buffers = await Promise.all(gltf.buffers.map(({ uri }) => this.loadBuffer(root + uri)));

        // then download images
        gltf.images = await Promise.all(gltf.images.map(({ uri }) => this.loadImage(root + uri)));

        // Load shader
        gltf.commonShader = await this.LoadShaderProgram(shader);

        // Load brdfLUT
        gltf.brdfLUT = await this.loadTexture('https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master/textures/brdfLUT.png', { minFilter: WebGL2RenderingContext.LINEAR });

        gltf.envmap = await this.loadCubemap('res/GoldenGateBridge2/');

        // Parse scene
        let {scene} = new gltfScene(gltf);

        // Create meshRenders
        // filter mesh & material which meshRenderer required
        let renderTargets = EntityMgr.getEntites([Mesh.name, Material.name], scene);
        for(let entity of renderTargets) {
            let mesh = entity.components.Mesh;
            let material = entity.components.Material;
            let mr = new MeshRenderer(screen, mesh, material);
            if(material.name == 'outline') {
                entity.components.Transform.isVisible = false;
            }
            EntityMgr.addComponent(entity, mr);
        }
        return scene;
    }

    static async loadBuffer(bufferPath) {
        return await (await fetch(bufferPath)).arrayBuffer();
        // return await fetch(bufferPath).then(e => e.arrayBuffer());
    }

    static async LoadShaderProgram(url) {
        url = Material.SHADER_PATH + url;
        let vertPath = url + '.vs.glsl';
        let fragPath = url + '.fs.glsl';
        let [vert, frag] = await Promise.all([vertPath, fragPath].map(path => fetch(path).then(e=>e.text())));
        // console.log(vert);
        // console.log(frag);
        return new Shader(vert, frag);
    }

    static async LoadMaterial(matName) {
        let shader = await this.LoadShaderProgram(matName);
        return new Material(shader);
    }

    static cubemapOrder = [
        'posx.',
        'negx.',
        'posy.',
        'negy.',
        'posz.',
        'negz.',
    ];
    static async loadCubeimg(folder, format = 'jpg') {
        return await Promise.all(this.cubemapOrder.map(name => this.loadImage(folder + name + format)));
    }
    static async loadCubemap(folder, format = 'jpg') {
        let rawImages = await this.loadCubeimg(folder, format);
        return new Texture(rawImages);
    }
    static async loadTexture(url: string, option) {
        let image = await this.loadImage(url);
        return new Texture(image, option);
    }
}