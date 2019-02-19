import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { Screen } from "./webgl2/screen";
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

    // Analyze
    static totalTask: number = 0;
    static finishedTask: number = 0;
    static addTask() {
        this.totalTask++;
        if (this.taskObserve)
            this.taskObserve(this.finishedTask, this.totalTask);
    };
    static finishTask() {
        this.finishedTask++;
        if(this.taskObserve)
            this.taskObserve(this.finishedTask, this.totalTask);
    };
    static taskObserve = null;

    static loadImage(url) {
        return new Promise((resolve, reject) => {
            this.addTask();
            let image = new Image();
            image.crossOrigin = "anonymous";
            image.src = url;
            image.onload = () => {
                resolve(image);
                this.finishTask();
            }
        });
    }

    static async loadGLTF(path: string, screen: Screen, envmap?: Texture, shader = 'stylize') {

        // parse current path
        let root: any = path.split('/');
        root.pop();
        root = root.join('/') + '/';
        // Load gltf
        let gltf: any = await (await fetch(path)).json();

        // Download buffers
        gltf.buffers = await Promise.all(gltf.buffers.map(({ uri }) => this.loadBuffer(root + uri)));

        // then download images
        if(gltf.images) {
            gltf.images = await Promise.all(gltf.images.map(({ uri }) => this.loadImage(root + uri)));
        }

        // Textures
        if (gltf.textures) {
            gltf.textures = gltf.textures.map(tex => {
                let { source, sampler } = tex;
                let currentSampler;
                if (gltf.samplers != null)
                    currentSampler = gltf.samplers[sampler];
                let texture = new Texture(gltf.images[source], currentSampler);
                Texture.createTexture(screen.gl, texture);
                return texture;
            })
        }

        // Load shader
        gltf.commonShader = await this.LoadShaderProgram(shader);

        // Load brdfLUT
        gltf.brdfLUT = await this.loadTexture('https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master/textures/brdfLUT.png', { minFilter: WebGL2RenderingContext.LINEAR });

        if(envmap != null) {
            gltf.hasEnvmap = true;
            gltf.envmap = envmap;
        } else {
            gltf.hasEnvmap = false;
        }

        // Parse scene
        let {scene} = await new gltfScene(gltf).assemble();

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
        this.addTask();
        let buffer = await (await fetch(bufferPath)).arrayBuffer()
        this.finishTask();
        return buffer;
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
        this.addTask();
        let shader = await this.LoadShaderProgram(matName);
        this.finishTask();
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