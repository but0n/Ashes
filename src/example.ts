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



// BoomBox
let gltf = 'gltfsamples/BoomBox.glb';


export class Example {

    static async run() {
        let progressBar: any = document.querySelector('#progress');


        let screen = new Screen('#screen');
        screen.bgColor = [0.2, 0.2, 0.2, 1];
        screen.bgColor = [1,1,1,1];


        let load = new demoLoad(screen);
        screen.attachFilter(load);
        Asset.taskObserve = (finished, total) => {
            let p = finished / total;
            // progressBar.value = p;
            load.cur = p;
        }
        // Filters
        Bloom.initFilters(screen, 0.6, 80, 1.2);
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
        // scene.appendChild(gltfroot);




        let root = gltfroot.components.Transform;
        // root.translate[1] = yoffset || 0;
        vec3.scale(root.scale, root.scale, 200)



        progressBar.parentElement.style.display = 'none';

    }
}



class demoLoad extends Filter {
    cur;
    stop;
    constructor(screen: Screen) {
        let macro = {
        }
        let shader = new Shader(loading_vs, loading_fs, macro);
        super(screen, shader);
        this.cur = 0;
        this.stop = false;
        Material.setUniform(this.material, 'cur', this.cur);
        let d = 0;
        let loop = () => {
            d += (1 / 60 / 3);
            Material.setUniform(this.material, 'cur', d);
            if(!this.stop)
                requestAnimationFrame(loop);
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

varying vec2 uv;
varying vec4 pos;

void main() {
    vec4 base = texture2D(base, uv);
    float prog = abs(uv.y - 0.5) * 2.;

    // Middle out


    if(cur < prog) {
        gl_FragColor = vec4(vec3(0), 1);
    } else {
        gl_FragColor = base;
    }
}
`;






Example.run();
