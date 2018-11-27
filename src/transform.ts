import { vec3, mat4, vec4 } from "../node_modules/gl-matrix-ts/dist/index";

export class Transform {
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
        this.scale = vec3.fromValues(0, 0, 0);
        this.quaternion = vec4.fromValues(0, 0, 0, 1);
        // RTS
        this.localMatrix = mat4.create();
        this.worldMatrix = mat4.create();
        this.worldNormalMatrix = mat4.create();
        mat4.identity(this.localMatrix);
        mat4.identity(this.worldMatrix);
        mat4.identity(this.worldNormalMatrix);
    }
    static updateMatrix(trans: Transform, world: Float32Array = trans.worldMatrix) {
        trans.isDirty = false;
        // Calculate local matrix
        mat4.fromRotationTranslationScale(trans.localMatrix, trans.quaternion, trans.translate, trans.scale);
        // Calculate world matrix
        mat4.mul(trans.worldMatrix, trans.localMatrix, world);
    }
}