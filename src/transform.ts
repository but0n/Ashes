import { vec3, mat4, vec4 } from "../node_modules/gl-matrix/lib/gl-matrix";
import { Entity, EntityMgr } from "./ECS/entityMgr";
import { ComponentSystem } from "./ECS/component";
import { System } from "./ECS/system";

export class Transform {
    entity: Entity;
    worldPos: Float32Array;
    translate: Float32Array;
    rotate: Float32Array;
    scale: Float32Array;
    quaternion: Float32Array;
    localMatrix: Float32Array;
    worldMatrix: Float32Array;
    worldNormalMatrix: Float32Array;
    isVisible: boolean = true;
    isDirty: boolean = false;
    constructor() {
        this.worldPos = vec3.fromValues(0, 0, 0);
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
} EntityMgr.getDefaultComponent = () => new Transform();

export class TransformSystem extends ComponentSystem {
    group = [];
    depends = [Transform.name];
    onUpdate() {
        for(let {components} of this.group) {
            // if(trans.isDirty)
            TransformSystem.updateMatrix(components.Transform);
        }
    }
    static decomposeMatrix(trans: Transform, mat = trans.localMatrix) {
        // https://math.stackexchange.com/questions/237369/given-this-transformation-matrix-how-do-i-decompose-it-into-translation-rotati
        // Get scaling
        vec3.set(trans.translate, mat[0], mat[1], mat[2]);  // temp
        let sx = vec3.len(trans.translate);
        vec3.set(trans.translate, mat[4], mat[5], mat[6]);  // temp
        let sy = vec3.len(trans.translate);
        vec3.set(trans.translate, mat[8], mat[9], mat[10]);  // temp
        let sz = vec3.len(trans.translate);
        vec3.set(trans.scale, sx, sy, sz);

        if(mat4.determinant(mat) < 0) {
            sx = -sx;
        }

        // Get translation
        vec3.set(trans.translate, mat[12], mat[13], mat[14]);
        mat[12] = mat[13] = mat[14] = 0;

        // Get rotation
        mat[0] /= sx;
        mat[1] /= sx;
        mat[2] /= sx;

        mat[4] /= sy;
        mat[5] /= sy;
        mat[6] /= sy;

        mat[8] /= sz;
        mat[9] /= sz;
        mat[10] /= sz;

        mat4.getRotation(trans.quaternion, mat);
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
            // Update world matrix
            mat4.mul(trans.worldMatrix, world.worldMatrix, trans.localMatrix);
            // Update world position
            vec3.transformMat4(trans.worldPos, trans.translate, trans.worldMatrix);
        } else {    // if current node is the root of world
            mat4.copy(trans.worldMatrix, trans.localMatrix);
        }
    }
} System.registSystem(new TransformSystem());
// (!) Circular dependency: src/ECS/system.ts -> src/ECS/entityMgr.ts -> src/transform.ts -> src/ECS/system.ts