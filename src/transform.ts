import { vec3, mat4, vec4 } from "../node_modules/gl-matrix/lib/gl-matrix";
import { Entity } from "./ECS/entityMgr";

export class Transform {
    entity: Entity;
    translate: Float32Array;
    rotate: Float32Array;
    scale: Float32Array;
    quaternion: Float32Array;
    localMatrix: Float32Array;
    worldMatrix: Float32Array;
    worldNormalMatrix: Float32Array;
    isDirty: boolean = false;
    constructor() {
        this.translate = vec3.fromValues(0, 0, 0);
        this.rotate = vec3.fromValues(0, 0, 0);
        this.scale = vec3.fromValues(1, 1, 1);
        this.quaternion = vec4.fromValues(0, 0, 0, 1);
        // RTS
        this.localMatrix = mat4.create();
        this.worldMatrix = mat4.create();
        this.worldNormalMatrix = mat4.create();
        mat4.identity(this.localMatrix);
        mat4.identity(this.worldMatrix);
        mat4.identity(this.worldNormalMatrix);
    }
    static decomposeMatrix(trans: Transform, matrix) {
        mat4.getRotation(trans.quaternion, matrix);
        mat4.getScaling(trans.scale, matrix);
        mat4.getTranslation(trans.translate, matrix);
    }
    static updateMatrix(trans: Transform) {
        trans.isDirty = false;
        // Calculate local matrix
        mat4.fromRotationTranslationScale(trans.localMatrix, trans.quaternion, trans.translate, trans.scale);
        mat4.invert(trans.worldNormalMatrix, trans.worldMatrix);
        mat4.transpose(trans.worldNormalMatrix, trans.worldNormalMatrix);
// Calculate world matrix
        let parent = trans.entity.parentElement as Entity;
        if(parent != null && parent.components) {
            let world: Transform = parent.components.Transform;
            // if(world.isDirty) {
            //     this.updateMatrix(world);
            // }
            mat4.mul(trans.worldMatrix, trans.localMatrix, world.worldMatrix);
        } else {    // if current node is the root of world
            mat4.copy(trans.worldMatrix, trans.localMatrix);
        }
    }
}