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

export class Example {

    static async run() {
        let gltf = '/static/gltfsamples/BoxTextured/BoxTextured.gltf';
        // gltf = '/static/gltfsamples/Suzanne/Suzanne.gltf';
        // gltf = '/static/gltfsamples/toon_shader_tutorial_files/scene.gltf';
        // gltf = '/static/gltfsamples/nierautomata__2b/scene.gltf';
        gltf = '/static/gltfsamples/sketchfab_3d_editor_challenge_littlest_tokyo/scene.gltf';

        let commonMat = await Asset.LoadMaterial('test');
        let screen = new Render('#screen');

        let scene = await Asset.loadGLTF(gltf, screen);

        let quad = EntityMgr.create('test-quad');
        let qmesh = new QuadMesh();
        let quadMR = new MeshRenderer(screen, qmesh, commonMat);
        EntityMgr.addComponent(quad, quadMR);
        console.log(quadMR);


        let mainCamera = EntityMgr.create('camera');
        let cameraTrans = mainCamera.components.Transform as Transform;
        EntityMgr.addComponent(mainCamera, new Camera(screen.width / screen.height));
        vec3.set(cameraTrans.translate, 0, 0, 10);

        scene.appendChild(mainCamera);
        let control = new OrbitControl(screen, mainCamera);

        scene.appendChild(quad);

        document.querySelector('body').appendChild(scene)



    }
};

Example.run();

