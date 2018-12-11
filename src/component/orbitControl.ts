import { Render } from "../webgl2/render";
import { Entity } from "../ECS/entityMgr";
import { Camera } from "../camera";
import { Transform } from "../transform";
import { System } from "../ECS/system";

export class OrbitControl {
    deltaX: number;
    deltaY: number;
    entity: Entity;
    constructor(screen: Render) {
        OrbitControl.init(screen.canvas, this);
    }
    moveHandler = (e) => {
        let {movementX, movementY} = e;
        this.deltaX = movementX;
        this.deltaY = movementY;
        let camera = this.entity.components.Camera as Camera;
        let trans = this.entity.components.Transform as Transform;
        camera.isDirty = true;
        trans.translate[0] += movementX * System.deltaTime;
        trans.translate[2] += movementY * System.deltaTime;
        camera.lookAt[0] += movementX * System.deltaTime;
        camera.lookAt[2] += movementY * System.deltaTime;
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