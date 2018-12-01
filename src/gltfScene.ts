import { EntityMgr, Entity } from "./ECS/entityMgr";

export class gltfScene {
    constructor(gltf) {
        let {scene, scenes, nodes} = gltf;
        // console.log(gltf);
        let roots = scenes[scene].nodes;
        for(let r of roots) {
            let root = gltfScene.parseNode(r, nodes);
            console.warn(root);
        }
    }

    static parseNode(nodeIndex, nodeList) {
        let node = nodeList[nodeIndex];
        let entity = EntityMgr.create();
        if(node.children) {
            for(let child of node.children) {
                entity.appendChild(this.parseNode(child, nodeList));
            }
        }
        return entity;
    }
}