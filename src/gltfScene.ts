import { EntityMgr } from "./ECS/entityMgr";
import { Accessor, bufferView, Mesh } from "./mesh/mesh";
import { Texture } from "./texture";
import { Material } from "./material";
import { vec3, vec4, mat4 } from "./math";
import { TransformSystem, Transform } from "./transform";
import { Shader } from "./shader";

export class gltfScene {
    gltf;
    scene = EntityMgr.create('scene');
    constructor(gltf) {
        this.gltf = gltf;
        let {scene, scenes, nodes} = gltf;
        //  BufferViews
        gltf.bufferViews = gltf.bufferViews.map(bv => new bufferView(gltf.buffers[bv.buffer], bv));

        // Materials
        // set default material if materials does not exist
        if(!gltf.materials) {
            gltf.materials = [{name: 'Default_Material'}];
        }
        gltf.materials = gltf.materials.map(config => {
            let mat = new Material(gltf.commonShader, config.name);
            console.log(config);
            for(let key in config) {

                this.detectMacro(mat.shader, key, config[key]);
                this.detectTexture(config, key, mat);

                if(key == 'pbrMetallicRoughness') {
                    let pbrOptions = config[key];
                    for(let opt in pbrOptions) {

                        this.detectMacro(mat.shader, opt, pbrOptions[opt]);
                        this.detectTexture(pbrOptions, opt, mat);
                    }
                }
            }
            Material.setTexture(mat, 'brdfLUT', Texture.clone(gltf.brdfLUT));
            if(gltf.hasEnvmap)
                Material.setTexture(mat, 'env', Texture.clone(gltf.envmap));
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
            return mesh.primitives.map(meshData => {
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
                let mat = gltf.materials[meshData.material || 0];
                return [mf, mat];
            })
        });

        let roots = scenes[scene || 0].nodes;
        for(let r of roots) {
            let root = this.parseNode(r, nodes);
            this.scene.appendChild(root);
        }
    }

    detectTexture(config, texName, mat) {
        let { index, texCoord } = config[texName];
        let gltf = this.gltf;
        if (index != null) { // common texture
            let { source, sampler } = gltf.textures[index];
            let currentSampler;
            if (gltf.samplers != null)
                currentSampler = gltf.samplers[sampler];
            let texture = new Texture(gltf.images[source], currentSampler);

            Material.setTexture(mat, texName, texture);
        }
    }

    detectMacro(shader: Shader, key: string, value) {
        switch(key) {
            // Textures
            case 'normalTexture':
                shader.macros['HAS_NORMAL_MAP'] = '';
                return;
            case 'occlusionTexture':
                shader.macros['HAS_AO_MAP'] = '';
                return;
            case 'baseColorTexture':
                shader.macros['HAS_BASECOLOR_MAP'] = '';
                return;
            case 'metallicRoughnessTexture':
                shader.macros['HAS_METALLIC_ROUGHNESS_MAP'] = '';
                return;
            case 'emissiveTexture':
                shader.macros['HAS_EMISSIVE_MAP'] = '';
                return;
            // Factors - pbrMetallicRoughness
            case 'baseColorFactor':
                shader.macros['BASECOLOR_FACTOR'] = `vec4(${value.join(',')})`;
                return;
            case 'metallicFactor':
                shader.macros['METALLIC_FACTOR'] = `float(${value})`;
                return;
            case 'roughnessFactor':
                shader.macros['ROUGHNESS_FACTOR'] = `float(${value})`;
                return;

            // Alpha Blend Mode
            case 'alphaMode':
                shader.macros[value] = '';
                return;
            case 'alphaCutoff':
                shader.macros['ALPHA_CUTOFF'] = `float(${value})`;
                return;

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
            }
            if (scale != null) {
                vec3.set(trans.scale, ...scale);
            }
            if (translation != null) {
                vec3.set(trans.translate, ...translation);
            }
        }
        TransformSystem.updateMatrix(trans);
        if(mesh != null) {
            let meshChunk = this.gltf.meshes[mesh];
            if(meshChunk.length > 1) {
                // Contains multiple mesh data
                // append as a group
                for(let meshData of meshChunk) {
                    let subMesh = EntityMgr.create(name);
                    let [mf, mat] = meshData;
                    EntityMgr.addComponent(subMesh, mf);
                    EntityMgr.addComponent(subMesh, mat);
                    entity.appendChild(subMesh);
                }
            } else {
                let [mf, mat] = meshChunk[0];
                EntityMgr.addComponent(entity, mf);
                EntityMgr.addComponent(entity, mat);
            }
        }
        if(node.children) {
            for(let child of node.children) {
                entity.appendChild(this.parseNode(child, nodeList));
            }
        }
        return entity;
    }
}