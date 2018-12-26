import { Asset } from "./asset";
import { EntityMgr } from "./ECS/entityMgr";
import { Camera } from "./camera";
import { vec3, mat4, quat } from "../node_modules/gl-matrix/lib/gl-matrix";
import { Transform } from "./transform";
import { Render } from "./webgl2/render";
import { QuadMesh } from "../mesh/quadMesh";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { OrbitControl } from "./component/orbitControl";
import { Texture } from "./texture";

export class Example {

    static async run() {
        let gltf = '/static/gltfsamples/BoxTextured/BoxTextured.gltf';
        // gltf = '/static/gltfsamples/Suzanne/Suzanne.gltf';
        gltf = '/static/gltfsamples/toon_shader_tutorial_files/scene.gltf';
        // gltf = '/static/gltfsamples/nierautomata__2b/scene.gltf';
        // gltf = '/static/gltfsamples/sketchfab_3d_editor_challenge_littlest_tokyo/scene.gltf';
        // gltf = '/static/gltfsamples/hylian_shield/scene.gltf';
        gltf = 'static/gltfsamples/FlightHelmet/glTF/FlightHelmet.gltf';
        // gltf = '/static/gltfsamples/futuristic_safe/scene.gltf';

        let screen = new Render('#screen');

        let scene = EntityMgr.create('root');
        let gltfroot = await Asset.loadGLTF(gltf, screen);
        scene.appendChild(gltfroot);
        let root = gltfroot.components.Transform as Transform;
        root.scale[0] = root.scale[1] = root.scale[2] = 20;


        let mainCamera = EntityMgr.create('camera');
        let cameraTrans = mainCamera.components.Transform as Transform;
        let cam: Camera = EntityMgr.addComponent(mainCamera, new Camera(screen.width / screen.height));
        vec3.set(cameraTrans.translate, 0, 0, 10);

        scene.appendChild(mainCamera);
        let control = new OrbitControl(screen, mainCamera);

        // BRDF test
        let brdf = await Asset.LoadMaterial('brdf');

        let quad = EntityMgr.create('test-quad');
        let qmesh = new QuadMesh();
        let quadMR = new MeshRenderer(screen, qmesh, brdf);
        EntityMgr.addComponent(quad, quadMR);
        console.log(quadMR);
        quad.components.Transform.translate[0] = 2;

        // scene.appendChild(quad);

        document.querySelector('body').appendChild(scene)



    }
};

Example.run();

