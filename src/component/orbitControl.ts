import { Render } from "../webgl2/render";
import { Entity } from "../ECS/entityMgr";
import { Camera } from "../camera";
import { Transform } from "../transform";
import { System } from "../ECS/system";
import { vec3, mat4, vec4 } from "../../node_modules/gl-matrix/lib/gl-matrix";

export class OrbitControl {
    deltaX: number;
    deltaY: number;
    entity: Entity;
    constructor(screen: Render) {
        OrbitControl.init(screen.canvas, this);
    }
    moveHandler = (e) => {
        let {movementX, movementY} = e;
        this.deltaX = -movementX * System.deltaTime;
        this.deltaY = -movementY * System.deltaTime;
        let camera = this.entity.components.Camera as Camera;
        let trans = this.entity.components.Transform as Transform;
        camera.isDirty = true;
        vec3.rotateX(trans.translate, trans.translate, camera.lookAt, this.deltaY);
        vec3.rotateY(trans.translate, trans.translate, camera.lookAt, this.deltaX);
        console.log(movementX, movementY, camera);
    }
    static init(screen: HTMLElement, controler: OrbitControl) {
        screen.addEventListener('mousedown', () => {
            screen.addEventListener('mousemove', controler.moveHandler)
        })
        screen.addEventListener('mouseup', () => {
            screen.removeEventListener('mousemove', controler.moveHandler);
        })
    }
}