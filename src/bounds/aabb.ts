import { vec3 } from "../math";
import { Entity, EntityMgr } from "../ECS/entityMgr";
import { MeshRenderer } from "../meshRenderer";
import { Screen } from "../webgl2/screen";
import { Material } from "../material/material";
import { Shader } from "../shader";
import { glsl } from "../glsl";
import { Mesh, Accessor, bufferView } from "../mesh/mesh";

export class aabb {
    entity: Entity
    max = vec3.create();
    min = vec3.create();

    constructor(maxX = 0, maxY = 0, maxZ = 0, minX = 0, minY = 0, minZ = 0) {
        vec3.set(this.max, maxX, maxY, maxZ);
        vec3.set(this.min, minX, minY, minZ);
    }


    pointInsert(x, y, z) {
        if(x > this.max[0] || x < this.min[0]) return false;
        if(y > this.max[1] || y < this.min[1]) return false;
        if(z > this.max[2] || z < this.min[2]) return false;
        return true;
    }
    pointInsertX(x) {
        if(x > this.max[0] || x < this.min[0]) return false;
        return true;
    }
    pointInsertY(y) {
        if(y > this.max[1] || y < this.min[1]) return false;
        return true;
    }
    pointInsertZ(z) {
        if(z > this.max[2] || z < this.min[2]) return false;
        return true;
    }
    isCross(box: aabb) {
        if(!this.pointInsertX(box.max[0]) && !this.pointInsertX(box.min[0])) return false;
        if(!this.pointInsertY(box.max[1]) && !this.pointInsertY(box.min[1])) return false;
        if(!this.pointInsertZ(box.max[2]) && !this.pointInsertZ(box.min[2])) return false;
        return true;
    }
    update() {

    }

    reset() {
        vec3.set(this.max, 0, 0, 0);
        vec3.set(this.min, 0, 0, 0);
    }

    private _isVisible
    agent: Entity;
    screen: Screen;
    get visible() {
        return this._isVisible;
    }
    static mat = new Material(new Shader(glsl.line.vs, glsl.line.fs));
    set visible(status) {
        this._isVisible = status;

        if(status) {
            if(!this.agent) {
                this.agent = this.entity.appendChild(EntityMgr.create('aabb'));
                const size = vec3.create();
                vec3.sub(size, this.max, this.min);
                const mesh = this.createMesh();
                const mr = new MeshRenderer(this.screen, mesh, aabb.mat);
                this.agent.addComponent(mr);
            }
        }
    }

    createMesh() {
        const x = this.max[0];
        const y = this.max[1];
        const z = this.max[2];
        const x2 = this.min[0];
        const y2 = this.min[1];
        const z2 = this.min[2];
        let meshVBO = new Float32Array([
            //x x
            // \/\
            //  x x
            x, y, z,
            x, y2, z,
            x, y, z2,
            x, y2, z2,

            x2, y, z,
            x2, y2, z,
            x2, y, z2,
            x2, y2, z2,

        ]);
        let meshEBO = new Uint16Array([
            0, 1, 2,
            2, 1, 3,

            6, 7, 4,
            4, 7, 5,

            6, 4, 2,
            2, 4, 0,

            5, 7, 1,
            1, 7, 3,

            4, 5, 0,
            0, 5, 1,

            2, 3, 6,
            6, 3, 7,
        ]);
        let vbo = new bufferView(meshVBO.buffer, {
            byteOffset: meshVBO.byteOffset,
            byteLength: meshVBO.byteLength,
            byteStride: 3*4,
            target: WebGL2RenderingContext.ARRAY_BUFFER
        });
        let ebo = new bufferView(meshEBO.buffer, {
            byteOffset: meshEBO.byteOffset,
            byteLength: meshEBO.byteLength,
            byteStride: 0,
            target: WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER
        });

        let position = new Accessor({
            bufferView: vbo,
            componentType: WebGL2RenderingContext.FLOAT,
            byteOffset: 0,
            type: "VEC3",
            count: 8
        }, 'POSITION');
        let indices = new Accessor({
            bufferView: ebo,
            componentType: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteOffset: 0,
            type: "SCALAR",
            count: meshEBO.length
        });
        return new Mesh([position], indices, WebGL2RenderingContext.LINES);
    }


    append(x, y, z) {
        this.max[0] = Math.max(this.max[0], x);
        this.max[1] = Math.max(this.max[1], y);
        this.max[2] = Math.max(this.max[2], z);
        this.min[0] = Math.min(this.min[0], x);
        this.min[1] = Math.min(this.min[1], y);
        this.min[2] = Math.min(this.min[2], z);
    }

    private _center = vec3.create();
    get center() {
        return this._center;
    }
}