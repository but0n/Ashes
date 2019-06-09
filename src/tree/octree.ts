import { Mesh, Accessor } from "../mesh/mesh";
import { aabb } from "../bounds/aabb"
import { Entity } from "../ECS/entityMgr";
import { Screen } from "../webgl2/screen";

export class octree {
    data;
    face;
    pos: Accessor;
    entity: Entity;
    screen: Screen;

    tree: node;

    maxLength = 200;

    constructor(mesh: Mesh, screen: Screen) {
        this.screen = screen;
        if(!mesh) {
            console.error('Mesh not found!');
            return;
        }
        this.entity = mesh['entity'];
        this.data = mesh.data;
        this.pos = this.data.POSITION;
        this.face = mesh.indices.data;
        let root = new node();
        root.bound = new aabb();
        root.bound.entity = this.entity;
        root.bound.screen = this.screen;

        // Generate triangle indices
        let triangleList = [];
        for(let i = 0, l = this.face.length / 3; i < l; i++) {
            triangleList.push(i);
            // initial aabb
            let f = i * 3, p;
            p = this.pos[this.face[f++]];
            root.bound.append(p[0], p[1], p[2]);
            p = this.pos[this.face[f++]];
            root.bound.append(p[0], p[1], p[2]);
            p = this.pos[this.face[f++]];
            root.bound.append(p[0], p[1], p[2]);
        }
        root.bound.visible = true;

        this.tree = this.buildNode(null, triangleList, root.bound);
        // display
        // this.visible(tree);

    }

    visible(n: node = this.tree) {
        if(!n || n.data.length < this.maxLength)
            return;


        n.bound.visible = true;
        for(let c of n.child) {
            this.visible(c);
        }
    }

    temp = new aabb();
    trangleIntersection(face: number, box: aabb) {
        // AABB for current triangle
        this.temp.reset();
        let f = face * 3, p;
        p = this.pos[this.face[f++]];
        this.temp.append(p[0], p[1], p[2]);
        p = this.pos[this.face[f++]];
        this.temp.append(p[0], p[1], p[2]);
        p = this.pos[this.face[f++]];
        this.temp.append(p[0], p[1], p[2]);
        return box.isCross(this.temp);
    }

    buildNode(pre, triangleList: number[], bound: aabb) {
        let n = new node();
        n.bound = bound;
        bound.entity = this.entity;
        bound.screen = this.screen;
        n.data = triangleList;

        if(!triangleList)
            return null;

        if(triangleList.length < this.maxLength) {
            n.data = triangleList;
            return n;
        }


        const {max}= bound;
        const {min}= bound;
        // Split space
        let midX = (max[0] - min[0]) / 2 + min[0];
        let midY = (max[1] - min[1]) / 2 + min[1];
        let midZ = (max[2] - min[2]) / 2 + min[2];
        let chunks = [
            // [max, min]
            // Top
            new aabb(max[0], max[1], max[2], midX, midY, midZ),
            new aabb(max[0], max[1], midZ, midX, midY, min[2]),
            new aabb(midX, max[1], midZ, min[0], midY, min[2]),
            new aabb(midX, max[1], max[2], min[0], midY, midZ),
            // Bottom
            new aabb(max[0], midY, max[2], midX, min[1], midZ),
            new aabb(max[0], midY, midZ, midX, min[1], min[2]),
            new aabb(midX, midY, midZ, min[0], min[1], min[2]),
            new aabb(midX, midY, max[2], min[0], min[1], midZ),
        ]
        for(let chunk of chunks) {
            let list = [];
            for(let f of triangleList) {
                if(this.trangleIntersection(f, chunk))
                    list.push(f);
            }
            if(pre && list.length && list.length == pre.data.length) {
                n.child.push(null);
                break;
            }
            n.child.push(this.buildNode(n, list, chunk));
        }

        return n;
    }

}

class node {
    data = [];
    child = [];
    bound;
}