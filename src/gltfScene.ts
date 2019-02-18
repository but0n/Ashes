import { EntityMgr, Entity } from "./ECS/entityMgr";
import { Accessor, bufferView, Mesh } from "./mesh/mesh";
import { Texture } from "./texture";
import { Material } from "./material";
import { vec3, vec4, mat4 } from "./math";
import { TransformSystem, Transform } from "./transform";
import { Skin } from "./skin";
import { Animation, AnimationChannel } from "./animation";

export class gltfScene {
    gltf;
    scene = EntityMgr.create('scene');
    entities: Entity[];
    constructor(gltf) {
        this.gltf = gltf;
        let {scene, scenes, nodes, skins, animations} = gltf;
        //  BufferViews
        gltf.bufferViews = gltf.bufferViews.map(bv => new bufferView(gltf.buffers[bv.buffer], bv));

        // Materials
        // set default material if materials does not exist
        if(!gltf.materials) {
            gltf.materials = [{name: 'Default_Material'}];
        }
        gltf.materials = gltf.materials.map(config => {
            let mat = new Material(gltf.commonShader, config.name, config.doubleSided);
            console.log(config);
            this.detectConfig(mat, config);

            Material.setTexture(mat, 'brdfLUT', Texture.clone(gltf.brdfLUT));
            if(gltf.hasEnvmap) {
                mat.shader.macros['HAS_ENV_MAP'] = '';
                Material.setTexture(mat, 'env', Texture.clone(gltf.envmap));
            }
            if(skins) {
                mat.shader.macros['HAS_SKINS'] = '';
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

        // Create entity instance for each node
        this.entities = gltf.nodes.map(node => this.createEntity(node));

        if(skins) {
            skins = skins.map(skin => {
                skin.joints = skin.joints.map(jointIndex => this.entities[jointIndex].components.Transform);
                let skinComp = new Skin();
                skinComp.materials = gltf.materials;
                skinComp.joints = skin.joints;
                for(let mat of skinComp.materials) {
                    mat.shader.macros['JOINT_AMOUNT'] = Math.min(skin.joints.length, 200);
                }

                let acc: Accessor = gltf.accessors[skin.inverseBindMatrices];
                skinComp.ibm = Accessor.getFloat32Blocks(acc);
                for(let i = 0; i < acc.count; i++) {
                    skinComp.jointMat.push(mat4.create());
                }
                skinComp.outputMat = new Float32Array(acc.count * acc.size);
                EntityMgr.addComponent(this.entities[skin.skeleton|0], skinComp);
                return skinComp;
            });
        }

        if(animations) {
            for (let { channels, samplers} of animations) {
                for (let { sampler, target} of channels) {
                    let e = this.entities[target.node];
                    let trans = e.components.Transform as Transform;
                    let controlChannel: Float32Array;
                    switch(target.path) {
                        case 'translation':
                            controlChannel = trans.translate;
                            break;
                        case 'rotation':
                            controlChannel = trans.quaternion;
                            break;
                        case 'scale':
                            controlChannel = trans.scale;
                            break;
                        case 'weights':
                            break;
                    }
                    if(controlChannel != null) {
                        let { input, interpolation, output } = samplers[sampler];
                        let timeline = gltf.accessors[input];
                        let keyframe = gltf.accessors[output];
                        if(e.components.Animation == null) {
                            EntityMgr.addComponent(e, new Animation());
                        }
                        let anim = e.components.Animation as Animation;
                        anim.channels.push(new AnimationChannel(controlChannel, timeline, keyframe));
                        // console.log(anim);
                    }
                }
            }
        }

        // assemble scene tree
        let roots = scenes[scene || 0].nodes;
        for (let r of roots) {
            let root = this.parseNode(r, nodes);
            this.scene.appendChild(root);
        }

        console.log(this);
    }

    detectTexture(mat: Material, texName, texInfo) {
        let { index, texCoord } = texInfo;
        let gltf = this.gltf;
        if (index != null) { // common texture
            Material.setTexture(mat, texName, Texture.clone(gltf.textures[index]));
        }
    }

    detectConfig(mat: Material, config) {
        let shader = mat.shader;
        for(let key in config) {
            let value = config[key];
            // assueme current property is an texture info
            this.detectTexture(mat, key, value);
            switch(key) {
                // Textures
                case 'normalTexture':
                    shader.macros['HAS_NORMAL_MAP'] = '';
                    break;
                case 'occlusionTexture':
                    shader.macros['HAS_AO_MAP'] = '';
                    break;
                case 'baseColorTexture':
                    shader.macros['HAS_BASECOLOR_MAP'] = '';
                    break;
                case 'metallicRoughnessTexture':
                    shader.macros['HAS_METALLIC_ROUGHNESS_MAP'] = '';
                    break;
                case 'emissiveTexture':
                    shader.macros['HAS_EMISSIVE_MAP'] = '';
                    break;
                // Factors - pbrMetallicRoughness
                case 'baseColorFactor':
                    shader.macros['BASECOLOR_FACTOR'] = `vec4(${value.join(',')})`;
                    break;
                case 'metallicFactor':
                    shader.macros['METALLIC_FACTOR'] = `float(${value})`;
                    break;
                case 'roughnessFactor':
                    shader.macros['ROUGHNESS_FACTOR'] = `float(${value})`;
                    break;

                // Alpha Blend Mode
                case 'alphaMode':
                    shader.macros[value] = '';
                    break;
                case 'alphaCutoff':
                    shader.macros['ALPHA_CUTOFF'] = `float(${value})`;
                    break;
                case 'pbrMetallicRoughness':
                    this.detectConfig(mat, value);
                    break;
            }
        }
    }

    createEntity(node) {
        let { mesh, name, matrix, rotation, scale, translation } = node;
        let entity = EntityMgr.create(name);
        let trans = entity.components.Transform as Transform;
        if (matrix != null) {
            mat4.set(trans.localMatrix, ...matrix);
            TransformSystem.decomposeMatrix(trans);
        } else {
            if (rotation != null) {
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
        if (mesh != null) {
            let meshChunk = this.gltf.meshes[mesh];
            if (meshChunk.length > 1) {
                // Contains multiple mesh data
                // append as a group
                for (let meshData of meshChunk) {
                    let subMesh = EntityMgr.create(name);
                    let [mf, mat] = meshData;
                    EntityMgr.addComponent(subMesh, mf);
                    EntityMgr.addComponent(subMesh, mat);
                    entity.appendChild(subMesh);
                }
            } else {
                // attach mesh directly
                let [mf, mat] = meshChunk[0];
                EntityMgr.addComponent(entity, mf);
                EntityMgr.addComponent(entity, mat);
            }
        }
        return entity;
    }

    parseNode(nodeIndex, nodeList) {
        let node = nodeList[nodeIndex];
        let entity = this.entities[nodeIndex];
        if(node.children) {
            for(let child of node.children) {
                entity.appendChild(this.parseNode(child, nodeList));
            }
        }
        return entity;
    }
}