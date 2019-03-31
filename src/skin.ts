import { mat4, quat, vec3 } from "./math";
import { Accessor } from "./mesh/mesh";
import { ComponentSystem } from "./ECS/component";
import { System } from "./ECS/system";
import { Transform } from "./transform";
import { Material } from "./material/material";

export class Skin {
    inverseBindMatrices: Accessor;
    // Inverse Bind pose Matrices
    ibm: Float32Array[] = [];
    jointMat: Float32Array[] = [];
    joints: Transform[];
    materials: Material[];
    outputMat: Float32Array;
}

class SkinSystem extends ComponentSystem {
    group = [];
    depends = [
        Skin.name,
    ];
    onUpdate() {
        for(let {components} of this.group) {
            let skin = components.Skin as Skin;
            // global transform of node that the mesh ss attached to
            let trans = components.Transform as Transform;
            for(let [i, joint] of skin.joints.entries()) {
                mat4.mul(skin.jointMat[i], joint.worldMatrix, skin.ibm[i]);
                mat4.mul(skin.jointMat[i], trans.worldInverseMatrix, skin.jointMat[i]);
            }
            // if(!skin.materials) {
            //     skin.materials = [];
            //     let materials: any = trans.entity.parentElement.querySelectorAll('ash-entity[Material]');
            //     for(let entity of materials) {
            //         let mat = entity.components.Material as Material;
            //         // mat.shader.macros['HAS_SKINS'] = '';
            //         mat.shader.macros['JOINT_AMOUNT'] = Math.min(skin.jointMat.length, 200);
            //         mat.shader.isDirty = true;
            //         skin.materials.push(mat);
            //     }
            // }

            // update matrices
            // for(let mat of skin.materials) {
            //     Material.setUniform(mat, 'jointMat[0]', skin.outputMat);
            // }
            // let materials: any = trans.entity.querySelectorAll('Material');
            // for(let mat of materials) {
            //     Material.setUniform(mat, 'jointMat[0]', skin.outputMat);
            // }
        }
    };
} System.registSystem(new SkinSystem());
