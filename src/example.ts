import { Asset } from "./asset";
import { EntityMgr } from "./ECS/entityMgr";
import { Camera } from "./camera";
import { vec3 } from "./math";
import { Transform } from "./transform";
import { Screen } from "./webgl2/screen";
import { QuadMesh } from "./mesh/quadMesh";
import { MeshRenderer } from "./meshRenderer";
import { OrbitControl } from "./component/orbitControl";
import { Bloom } from "./filter/bloom";
import { Filter } from "./filter";
import { Shader } from "./shader";
import { Material } from "./material";
import { Vignetting } from "./filter/vignetting";



// BoomBox
let gltf = 'gltfsamples/BoomBox.glb';
// gltf = 'res/project_polly.glb';
gltf = 'res/sci_fi_environment_tile_set.glb';

export class Example {

    static async run() {


        let screen = new Screen('#screen');
        screen.bgColor = [0.2, 0.2, 0.2, 1];
        // screen.bgColor = [1,1,1,1];


        let load = new demoLoad(screen);
        load.cb = () => {
            screen.deleteFilter(0);
            console.log('delete');
        }
        screen.attachFilter(load);
        Asset.taskObserve = (finished, total) => {
            let p = finished / total;
            load.cur = p;
        }
        // Filters
        // Bloom.initFilters(screen, 0.6, 80, 1.2);
        // screen.attachFilter(new Vignetting(screen));



        let scene = EntityMgr.create('root - (Click each bar which has yellow border to toggle visible)');
        document.querySelector('body').appendChild(scene);

        let skybox = await Asset.loadCubemap('res/envmap/GoldenGateBridge2/');



        // Camera and controls
        let mainCamera = EntityMgr.create('camera');
        let cameraTrans = mainCamera.components.Transform;
        let cam = EntityMgr.addComponent(mainCamera, new Camera(screen.width / screen.height));
        vec3.set(cameraTrans.translate, 0, 10, 10);

        scene.appendChild(mainCamera);
        EntityMgr.addComponent(mainCamera, new OrbitControl(screen, mainCamera));


        // Model

        let gltfroot = await Asset.loadGLTF(gltf, screen, skybox);
        scene.appendChild(gltfroot);




        let root = gltfroot.components.Transform;
        root.translate[1] = -2;
        vec3.scale(root.scale, root.scale, 0.01)


    }
}



class demoLoad extends Filter {
    cur;
    stop;
    cb;
    constructor(screen: Screen) {
        let macro = {
        }
        let shader = new Shader(loading_vs, loading_fs, macro);
        super(screen, shader);
        this.cur = 0;
        this.stop = false;
        let cur = 0;
        Material.setUniform(this.material, 'cur', this.cur);
        let loop = () => {
            cur += (this.cur - cur) * 0.05;
            Material.setUniform(this.material, 'cur', cur);
            Material.setUniform(this.material, 'powcur', Math.pow(cur, 8));
            if(cur < 0.999) {
                requestAnimationFrame(loop);
            } else {
                Material.setUniform(this.material, 'cur', 1);
                Material.setUniform(this.material, 'powcur', 1);
                if(this.cb) this.cb();
            }
        }
        loop();
    }


}

let loading_vs = `
attribute vec3 POSITION;
attribute vec2 TEXCOORD_0;

varying vec2 uv;
varying vec4 pos;

void main() {
  uv = TEXCOORD_0;
  vec4 position = vec4(POSITION, 1);
  pos = position;
  gl_Position = position;
}
`;

let loading_fs = `
precision mediump float;
uniform sampler2D base;
uniform float cur;
uniform float powcur;

varying vec2 uv;
varying vec4 pos;

void main() {
    vec4 base = texture2D(base, uv);
    float prog = abs(uv.y - 0.5) * 2.;

    // Middle out


    if(cur < prog) {
        gl_FragColor = vec4(1);
    } else {
        gl_FragColor = vec4(base.rgb * powcur, base.a);
    }
}
`;






Example.run();
