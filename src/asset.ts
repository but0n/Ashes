import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material/material";
import { Screen } from "./webgl2/screen";
import { gltfScene } from "./gltfScene";
import { EntityMgr } from "./ECS/entityMgr";
import { Shader } from "./shader";
import { Mesh, bufferView, Accessor } from "./mesh/mesh";
import { Texture } from "./texture";
import { glsl } from "./glsl";
import { Camera } from "./camera";

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
    static loadBufferImage(buffer: DataView, mimeType) {
        return new Promise((resolve, reject) => {
            var blob = new Blob([buffer], { type: mimeType });
            var url = URL.createObjectURL(blob);

            let image = new Image();
            image.src = url;
            image.onload = () => {
                resolve(image);
            }
        })

    }

    static adjustDataUri(root, uri) {
        return uri.substr(0, 5) == "data:" ? uri : root + uri;
    }

    static glbMagic = 0x46546C67;
    static decoder = new TextDecoder();
    static async glbParse(path: string) {
        let json, bin = [];
        let glb = await this.loadBuffer(path);
        let offset = 0;

        // HEADER
        let header = new Int32Array(glb, offset, 3);
        offset += 3*4;

        let [magic, version, length] = header;
        if(magic != this.glbMagic) {
            console.error('Magic number incorrect! - ' + header[0]);
            return;
        }

        while(offset < length) {
            let [chunkLength, chunkType] = new Int32Array(glb, offset, 2);
            offset += 2*4;
            let chunkData = glb.slice(offset, offset + chunkLength)
            switch(chunkType) {
                // JSON
                case 0x4E4F534A:
                    json = JSON.parse(this.decoder.decode(chunkData));
                    break;
                // BIN
                case 0x004E4942:
                    bin.push(chunkData);
                    break;
            }
            offset += chunkLength;
        }

        return {
            json: json,
            bin: bin
        }
    }

    static brdfLUT: Texture;

    static async loadGLTF(path: string, screen: Screen, envmap?: Texture, diffmap?: Texture, shader?) {
        let gltf;
        // parse current path
        let root: any = path.split('/');
        let [filename, format] = root.pop().split('.');
        root = root.join('/') + '/';

        if(format == 'glb') {

            let glb = await this.glbParse(path);
            gltf = glb.json;
            gltf.buffers = glb.bin;

            //  BufferViews
            gltf.bufferViews = gltf.bufferViews.map(bv => new bufferView(gltf.buffers[bv.buffer], bv));

            if (gltf.images) {
                gltf.images = await Promise.all(gltf.images.map(i => this.loadBufferImage(gltf.bufferViews[i.bufferView].dataView, i.mimeType)));
            }


        } else if(format == 'gltf') {

            // Load gltf
            gltf = await (await fetch(path)).json();

            // Download buffers
            gltf.buffers = await Promise.all(gltf.buffers.map(({ uri }) => this.loadBuffer(this.adjustDataUri(root, uri))));

            //  BufferViews
            gltf.bufferViews = gltf.bufferViews.map(bv => new bufferView(gltf.buffers[bv.buffer], bv));

            // then download images
            if (gltf.images) {
                gltf.images = await Promise.all(gltf.images.map(({ uri }) => this.loadImage(this.adjustDataUri(root, uri))));
            }

        } else {
            console.error('Wrong file!');
            return;
        }

        // Camera components
        if(gltf.cameras) {
            gltf.cameras = gltf.cameras.map(cam => {
                if(cam.perspective) {
                    // NOTE: Infinite perspective camera is not support yet
                    let { aspectRatio, yfov, znear, zfar } = cam.perspective;
                    let camera = new Camera(screen.width/screen.height, yfov*180/Math.PI, znear, zfar);
                    camera.name = cam.name;
                    return camera;
                }
            });
        }

        // Textures
        if (gltf.textures) {
            gltf.textures = gltf.textures.map(tex => {
                let { source, sampler } = tex;
                let currentSampler;
                if (gltf.samplers != null)
                    currentSampler = gltf.samplers[sampler];
                let texture = new Texture(gltf.images[source], currentSampler);
                return texture;
            })
        }

        // Load shader
        gltf.commonShader = shader || Screen.platform == 'iOS'
            ? new Shader(glsl.stylize.vs, glsl.stylize.fs)
            : new Shader(glsl.stylize2.vs, glsl.stylize2.fs);

        // Load brdfLUT
        if(this.brdfLUT === undefined) {
            const brdfurl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Viewer/master/assets/images/brdfLUT.png'
            this.brdfLUT = await this.loadTexture(brdfurl, { minFilter: WebGL2RenderingContext.LINEAR });
        }

        gltf.brdfLUT = this.brdfLUT;

        if(envmap != null) {
            gltf.hasEnvmap = true;
            gltf.envmap = envmap;
            gltf.diffmap = diffmap;
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
            if(material.name == 'outline') {
                entity.components.Transform.isVisible = false;
            }
            entity.addComponent(new MeshRenderer(screen, mesh, material));
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

    static HDRParse(raw: ArrayBuffer) {
        const data = new Uint8Array(raw);
        let p = 0;
        while (!(data[p] == 10 && data[p+1] == 10)) {
            p++;
        }
        let info = this.decoder.decode(data.subarray(0, p)).split('\n');
        if (info[0] != '#?RADIANCE') {
            console.table(info);
        }
        p += 2;
        const size_start = p;
        while (data[++p] != 10) {
        }
        let size: any[] = this.decoder.decode(data.subarray(size_start, p)).split(' ');
        // let buffer = raw.slice(p+1);
        let rgbeData = data.subarray(p+1);
        size[1] *= 1;
        size[3] *= 1;
        const total = size[1] * size[3];

        let scanline_num = size[1];
        let scanline_width = size[3];

        let buffer = new Float32Array(total * 3);

        let ptr = 0;
        if(total * 4 != rgbeData.length) {
            const rle_start = Date.now();
            console.error('RLE encoding!');
            // 4 channels
            for(let y = 0; y < scanline_num; y++) {
                let flag = rgbeData.subarray(ptr, ptr+4);
                ptr += 4;
                if(flag[0] != 2 || flag[1] != 2) {
                    console.log('this file is not run length encoded');
                } else {
                    // const scanline_buf = [[], [], [], []];
                    const scanline_buf = [
                        new Uint8Array(scanline_width),
                        new Uint8Array(scanline_width),
                        new Uint8Array(scanline_width),
                        new Uint8Array(scanline_width),
                    ];
                    for(let ch = 0; ch < 4; ch++) {
                        let line_p = 0;

                        const line = scanline_buf[ch];
                        while(line_p < scanline_width) {
                        // while(line.length < scanline_width) {
                            let count = 0;
                            let data = rgbeData.subarray(ptr, ptr+2);
                            ptr += 2;
                            if(data[0] > 128) {
                                count = data[0] - 128;
                                while(count--)
                                    line[line_p++] = data[1];
                                    // line.push(data[1]);
                            } else {
                                count = data[0] - 1;
                                line[line_p++] = data[1];
                                // line.push(data[1]);
                                while(count--)
                                    line[line_p++] = rgbeData.subarray(ptr, ++ptr)[0];
                                    // line.push(rgbeData.subarray(ptr, ++ptr)[0])
                            }
                        }
                    }
                    for(let x = 0; x < scanline_width; x++) {
                        // const [r, g, b, e] = scanline_buf[0][1];
                        const r = scanline_buf[0][x];
                        const g = scanline_buf[1][x];
                        const b = scanline_buf[2][x];
                        const e = scanline_buf[3][x];
                        const pixel = buffer.subarray((y * scanline_width + x) * 3, (y * scanline_width + (x + 1)) * 3);
                        if(e != 0) {
                            pixel[0] = r * Math.pow(2, e - 128 - 8);
                            pixel[1] = g * Math.pow(2, e - 128 - 8);
                            pixel[2] = b * Math.pow(2, e - 128 - 8);
                        }

                    }

                }
            }
            console.log(`RLE decoding cost ${Date.now() - rle_start}ms`);
        } else {
            for(let x = 0; x < total; x++) {
                const [r, g, b, e] = rgbeData.subarray(x * 4, (x + 1) * 4);
                const pixel = buffer.subarray(x * 3, (x + 1) * 3);
                if(e != 0) {
                    pixel[0] = r * Math.pow(2, e - 128 - 8);
                    pixel[1] = g * Math.pow(2, e - 128 - 8);
                    pixel[2] = b * Math.pow(2, e - 128 - 8);
                }
            }
        }
        return {size, buffer};
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
        let rawImages;
        if(format == 'hdr') {
            rawImages = await Promise.all(this.cubemapOrder.map(name => fetch(folder + name + format)));
            rawImages = await Promise.all(rawImages.map(raw => raw.arrayBuffer()));
        } else {
            rawImages = await this.loadCubeimg(folder, format);
        }
        let tex = new Texture(rawImages, {
            magFilter: WebGL2RenderingContext.LINEAR,
            minFilter: WebGL2RenderingContext.LINEAR,
            wrapS: WebGL2RenderingContext.CLAMP_TO_EDGE,
            wrapT: WebGL2RenderingContext.CLAMP_TO_EDGE,
        });
        if(format == 'hdr') {
            // Parse
            let s;
            tex.data = rawImages.map(raw => {
                const {size, buffer} = this.HDRParse(raw);
                s = size;
                return buffer;
            });

            tex.height = s[1];
            tex.width = s[3];
            tex.format = WebGL2RenderingContext.RGB;
            tex.internalformat = WebGL2RenderingContext.RGB32F;
            tex.type = WebGL2RenderingContext.FLOAT;
            // tex.internalformat = WebGL2RenderingContext.RGB16F;
            // tex.type = WebGL2RenderingContext.HALF_FLOAT;
            tex.glType = WebGL2RenderingContext.TEXTURE_CUBE_MAP;

            tex.image = null;
            tex.isDirty = true;

        }
        return tex;
    }
    static async loadTexture(url: string, option) {
        const format = url.split('.').pop();
        if(format == 'hdr') {
            let raw = await (await fetch(url)).arrayBuffer();
            const {size, buffer} = this.HDRParse(raw);
            const tex = new Texture(null, {
                magFilter: WebGL2RenderingContext.LINEAR,
                minFilter: WebGL2RenderingContext.LINEAR,
                wrapS: WebGL2RenderingContext.CLAMP_TO_EDGE,
                wrapT: WebGL2RenderingContext.CLAMP_TO_EDGE,
            });
            tex.data = buffer;
            tex.height = size[1];
            tex.width = size[3];
            tex.format = WebGL2RenderingContext.RGB;
            tex.internalformat = WebGL2RenderingContext.RGB32F;
            tex.type = WebGL2RenderingContext.FLOAT;
            tex.image = null;
            tex.isDirty = true;
            return tex;
        } else {
            let image = await this.loadImage(url);
            return new Texture(image, option);
        }
    }
}