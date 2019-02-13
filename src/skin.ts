import { mat4, quat, vec3 } from "./math";
import { Accessor } from "./mesh/mesh";
import { ComponentSystem } from "./ECS/component";
import { System } from "./ECS/system";
import { Transform } from "./transform";
import { Material } from "./material";

export class Skin {
    inverseBindMatrices: Accessor;
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
                skin.outputMat.set(skin.jointMat[i], i * 16);
                // Test joint
                joint.rotate[0] += Math.random() * 1;
                joint.rotate[1] += Math.random() * 1;
                joint.rotate[2] += Math.random() * 1;

                quat.fromEuler(joint.quaternion, ...joint.rotate);

            }
            // update matrices
            for(let mat of skin.materials) {
                Material.setUniform(mat, 'jointMat[0]', skin.outputMat);
            }
        }
    };
} System.registSystem(new SkinSystem());
