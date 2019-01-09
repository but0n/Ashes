import { EntityMgr } from "./ECS/entityMgr";
import { Accessor, bufferView, Mesh } from "./mesh/mesh";
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

        // Materials
        console.log(gltf.materials[0]);
        gltf.materials = gltf.materials.map(config => {
            let mat = new Material(gltf.commonShader, config.name);
            console.log(config);
            for(let key in config) {
                let {index, texCoord} = config[key];
                if(index != null) { // common texture
                    let {source, sampler} = gltf.textures[index];
                    let currentSampler;
                    if(gltf.samplers != null)
                        currentSampler = gltf.samplers[sampler];
                    let texture = new Texture(gltf.images[source], currentSampler);
                    Material.setTexture(mat, key, texture);
                }
                if(key == 'pbrMetallicRoughness') {
                    let pbrOptions = config[key];
                    for(let opt in pbrOptions) {
                        let {index, texCoord} = pbrOptions[opt];
                        if(index != null) { // common texture
                            let {source, sampler} = gltf.textures[index];
                            let currentSampler;
                            if(gltf.samplers != null)
                                currentSampler = gltf.samplers[sampler];
                            let texture = new Texture(gltf.images[source], currentSampler);

                            Material.setTexture(mat, opt, texture);
                        }
                    }
                }
            }
            Material.setTexture(mat, 'brdfLUT', new Texture(gltf.brdfLUT, {minFilter: WebGL2RenderingContext.LINEAR}));
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
            // Ensure current buffer type is exist, considering the target value is not required at glTF
            ebo.bufferView.target = WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER;

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