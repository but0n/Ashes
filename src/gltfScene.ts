import { EntityMgr, Entity } from "./ECS/entityMgr";
import { Accessor, Mesh } from "./mesh/mesh";
import { Texture } from "./texture";
import { Material, RenderQueue } from "./material";
import { vec3, vec4, mat4 } from "./math";
import { TransformSystem, Transform } from "./transform";
import { Skin } from "./skin";
import { Animation, AnimationChannel } from "./animation";
import { Camera } from "./camera";

export class gltfScene {
    gltf;
    scene = EntityMgr.create('scene');
    entities;
    constructor(gltf) {
        this.gltf = gltf;

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
            // if(gltf.skins) {
            //     mat.shader.macros['HAS_SKINS'] = '';
            // }
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
                let {attributes, targets} = meshData;

                // Pick up attributes
                let accessors: Accessor[] = [];
                for (let attr in attributes) {
                    let acc: Accessor = gltf.accessors[attributes[attr]];
                    acc.attribute = attr; // Set attribute name
                    accessors.push(acc);
                }

                // if(targets) {
                //     for (let target of targets) {
                //         for (let tar in target) {
                //             let acc: Accessor = gltf.accessors[target[tar]];
                //             acc.attribute = '_' + tar;
                //             accessors.push(acc);
                //         }
                //         break;
                //     }
                // }

                // Triangles
                let ebo = gltf.accessors[meshData.indices];

                let mf = new Mesh(accessors, ebo, meshData.mode);

                if (attributes.TANGENT == null && attributes.TEXCOORD_0 != null) {
                    console.warn('Using computed tagent!');
                    Mesh.preComputeTangent(mf);
                }

                let mat = gltf.materials[meshData.material || 0];

                if (attributes.JOINTS_0 != null) {
                    mat.shader.macros['HAS_SKINS'] = '';
                }


                return [mf, mat];
            })
        });

    }

    async assemble() {
        // Create entity instance for each node
        let gltf = this.gltf;
        let { scene, scenes, nodes, skins, animations } = gltf;
        this.entities = await Promise.all(gltf.nodes.map((node, index) => this.waitEntity(node, index)));


        if (skins) {
            skins = skins.map(skin => {
                skin.joints = skin.joints.map(jointIndex => this.entities[jointIndex].components.Transform);
                if(skin.entity == null) {
                    return;
                }
                let skinComp = new Skin();
                // Set up releated materials
                skinComp.materials = skin.materials;
                skinComp.joints = skin.joints;

                let acc: Accessor = gltf.accessors[skin.inverseBindMatrices];
                skinComp.ibm = Accessor.getFloat32Blocks(acc);
                skinComp.outputMat = new Float32Array(acc.count * acc.size);
                skinComp.jointMat = Accessor.getSubChunks(acc, skinComp.outputMat);
                // https://github.com/KhronosGroup/glTF/issues/1270
                // https://github.com/KhronosGroup/glTF/pull/1195

                // for (let mat of skin.materials) {
                //     mat.shader.macros['JOINT_AMOUNT'] = Math.min(skin.joints.length, 200);
                //     mat.shader.isDirty = true;
                // }

                for (let trans of skin.transforms as Transform[]) {
                    trans.jointsMatrices = skinComp.outputMat;
                    let mat = trans.entity.components.Material as Material;
                    mat.shader.macros['JOINT_AMOUNT'] = Math.min(skin.joints.length, 200);
                }

                if(skin.entity)
                    skin.entity.addComponent(skinComp);
                return skinComp;
            });
        }

        if (animations) {
            for (let { channels, samplers } of animations) {
                for (let { sampler, target } of channels) {
                    let e = this.entities[target.node];
                    let trans = e.components.Transform as Transform;
                    let controlChannel: Float32Array;
                    switch (target.path) {
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
                    if (controlChannel != null) {
                        let { input, interpolation, output } = samplers[sampler];
                        let timeline = gltf.accessors[input];
                        let keyframe = gltf.accessors[output];
                        if (e.components.Animation == null) {
                            e.addComponent(new Animation());
                        }
                        let anim = e.components.Animation as Animation;
                        Animation.attachChannel(anim, new AnimationChannel(controlChannel, timeline, keyframe))
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
        return this;
    }

    waitEntity(node, index) {
        return new Promise((resolve: (e:Entity)=>void, reject) => {
            setTimeout(() => {
                resolve(this.createEntity(node, index));
            }, 0);
        })
    }

    detectTexture(mat: Material, texName, texInfo) {
        let { index, texCoord } = texInfo;
        let gltf = this.gltf;
        if (index != null) { // common texture
            Material.setTexture(mat, texName, Texture.clone(gltf.textures[index]));
            // Multi UV
            if(texCoord) { // > 0
                mat.shader.macros[`${texName}_uv`] = `uv${texCoord}`;
            }
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
                    if(value != 'OPAQUE') {
                        mat.queue = RenderQueue.Blend;
                    }
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

    createEntity(node, index) {
        let { mesh, name, matrix, rotation, scale, translation, skin, camera } = node;
        name = name || 'node_' + index;
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
        let transCache = [];
        // let matCache = [];
        if (mesh != null) {
            let renderTarget = entity;
            let meshChunk = this.gltf.meshes[mesh];
            let hasSubnode = meshChunk.length - 1;
            for(let [i, meshData] of meshChunk.entries()) {
                let [mf, mat] = meshData;
                if (hasSubnode) {
                    renderTarget = entity.appendChild(EntityMgr.create('subNode_' + i));
                }
                renderTarget.addComponent(mf);
                renderTarget.addComponent(mat);
                transCache.push(renderTarget.components.Transform);
                // matCache.push(mat);
            }
        }
        if (skin != null) {
            this.gltf.skins[skin].entity = entity;
            if(!this.gltf.skins[skin].transforms) {
                this.gltf.skins[skin].transforms = [];
            }
            this.gltf.skins[skin].transforms.push(...transCache);
            // this.gltf.skins[skin].materials = matCache;
        }
        if (camera != null) {
            entity.addComponent(this.gltf.cameras[camera]);
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