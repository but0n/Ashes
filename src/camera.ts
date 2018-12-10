import { EntityMgr, Entity } from "./ECS/entityMgr";
import { vec3, mat4, vec4 } from "../node_modules/gl-matrix/lib/gl-matrix";
import { Transform } from "./transform";
import { ComponentSystem } from "./ECS/component";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { System } from "./ECS/system";

export class Camera {
    entity: Entity;
    projection: Float32Array;
    view: Float32Array;
    fov: number;
    aspect: number;
    near: number;
    far: number;
    up: Float32Array;
    lookAt: Float32Array;
    isDirty: boolean = true;
    constructor(aspect: number = 1, fov = 45, near = 1, far = 10000) {
        this.aspect = aspect
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.projection = mat4.create();
        this.view = mat4.create();
        this.up = vec3.fromValues(0, 1, 0);
        this.lookAt = vec3.create();
        Camera.updateProjectionMatrix(this);
    }

    static updateProjectionMatrix(cam: Camera) {
        mat4.perspective(cam.projection, cam.fov * Math.PI / 180.0, cam.aspect, cam.near, cam.far);
    }
    static updateViewMatrix(cam: Camera) {
        let trans = cam.entity.components.Transform as Transform;
        mat4.lookAt(cam.view, trans.translate, cam.lookAt, cam.up);
    }
}

export class CameraSystem extends ComponentSystem {
    group = [];
    depends = [
        Camera.name
    ];
    onUpdate() {
        for(let {components} of this.group) {
            let camera = components.Camera as Camera;
            if(camera.isDirty) {
                Camera.updateViewMatrix(camera);
                // TODO: multiple scenes with multiple cameras
                let meshRenderers = EntityMgr.getComponents<MeshRenderer>(MeshRenderer.name);
                for(let mr of meshRenderers) {
                    Material.setUniform(mr.materials[0], 'P', camera.projection);
                    Material.setUniform(mr.materials[0], 'V', camera.view);
                }
                camera.isDirty = false;
            }
        }
    }
} System.registSystem(new CameraSystem());