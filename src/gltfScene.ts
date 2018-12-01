import { EntityMgr, Entity } from "./ECS/entityMgr";
import { Accessor, bufferView, Mesh } from "./mesh";
import { MeshRenderer } from "./meshRenderer";
import { Render } from "./webgl2/render";

export class gltfScene {
    gltf;
    screen: Render;
    scene = EntityMgr.create();
    constructor(gltf, screen: Render) {
        this.screen = screen;
        this.gltf = gltf;
        let {scene, scenes, nodes} = gltf;
        //  BufferViews
        gltf.bufferViews = gltf.bufferViews.map((bv) => new bufferView(gltf.buffers[bv.buffer], bv));

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

            return new Mesh(accessors, ebo, meshData.mode);
        });

        let roots = scenes[scene].nodes;
        for(let r of roots) {
            let root = this.parseNode(r, nodes);
            console.log(root);
            this.scene.appendChild(root);
        }
        console.log(gltf);
    }

    parseNode(nodeIndex, nodeList) {
        let node = nodeList[nodeIndex];
        let entity = EntityMgr.create();
        let {mesh} = node;
        if(mesh != null) {
            let mf = this.gltf.meshes[mesh];
            EntityMgr.addComponent(entity, mf);
            let mr = new MeshRenderer(this.screen, mf, this.gltf.defaultMat)
            EntityMgr.addComponent(entity, mr);
        }
        if(node.children) {
            for(let child of node.children) {
                entity.appendChild(this.parseNode(child, nodeList));
            }
        }
        return entity;
    }
}