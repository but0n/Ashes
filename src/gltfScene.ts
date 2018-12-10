import { EntityMgr } from "./ECS/entityMgr";
import { Accessor, bufferView, Mesh } from "./mesh";
import { Texture } from "./texture";
import { Material } from "./material";
import { vec3, vec4, mat4 } from "../node_modules/gl-matrix/lib/gl-matrix";
import { TransformSystem, Transform } from "./transform";

export class gltfScene {
    gltf;
    scene = EntityMgr.create('scene');
    constructor(gltf) {
        this.gltf = gltf;
        let {scene, scenes, nodes} = gltf;
        //  BufferViews
        gltf.bufferViews = gltf.bufferViews.map(bv => new bufferView(gltf.buffers[bv.buffer], bv));

        // Textures
        gltf.textures = gltf.textures.map(({source, sampler}) => new Texture(gltf.images[source], gltf.samplers[sampler]));

        // Materials
        console.log(gltf.materials[0]);
        gltf.materials = gltf.materials.map(config => {
            let mat = new Material(gltf.commonShader, config.name);
            console.log(config);
            for(let key in config) {
                let {index, texCoord, baseColorTexture} = config[key];
                if(index != null && texCoord != null) {
                    let texture = gltf.textures[index];
                    Material.setTexture(mat, key, texture);
                } else if(baseColorTexture != null) {
                    let {index, texCoord} = baseColorTexture;
                    let texture = gltf.textures[index];
                    Material.setTexture(mat, 'baseColorTexture', texture);
                }
            }
            return mat;
        });

        // Set up all Vertexes
        gltf.accessors = gltf.accessors.map(acc => {
            let attr = new Accessor(acc);
            attr.bufferView = gltf.bufferViews[acc.bufferView];
            return attr;
        });
        // Create mesh
        gltf.meshes = gltf.meshes.map(mesh => {
            let meshData = mesh.primitives[0];
            let {attributes} = meshData;

            // Pick up attributes
            let accessors: Accessor[] = [];
            for (let attr in attributes) {
                let acc: Accessor = gltf.accessors[attributes[attr]];
                acc.attribute = attr; // Set attribute name
                accessors.push(acc);
            }

            // Triangles
            let ebo = gltf.accessors[meshData.indices];

            let mf = new Mesh(accessors, ebo, meshData.mode);
            let mat = gltf.materials[meshData.material];
            return [mf, mat];
        });

        let roots = scenes[scene].nodes;
        for(let r of roots) {
            let root = this.parseNode(r, nodes);
            this.scene.appendChild(root);
        }
    }

    parseNode(nodeIndex, nodeList) {
        let node = nodeList[nodeIndex];
        let {mesh, name, matrix, rotation, scale, translation} = node;
        let entity = EntityMgr.create(name);
        let trans = entity.components.Transform as Transform;
        if(matrix != null) {
            mat4.set(trans.localMatrix, ...matrix);
            TransformSystem.decomposeMatrix(trans);
        } else {
            if(rotation != null) {
                vec4.set(trans.quaternion, ...rotation);
            } else if (scale != null) {
                vec3.set(trans.scale, ...scale);
            } else if (translation != null) {
                vec3.set(trans.translate, ...translation);
            }
        }
        TransformSystem.updateMatrix(trans);
        if(mesh != null) {
            let [mf, mat] = this.gltf.meshes[mesh];
            EntityMgr.addComponent(entity, mf);
            EntityMgr.addComponent(entity, mat);
        }
        if(node.children) {
            for(let child of node.children) {
                entity.appendChild(this.parseNode(child, nodeList));
            }
        }
        return entity;
    }
}