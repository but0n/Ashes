import { Render } from "../webgl2/render";
import { Entity } from "../ECS/entityMgr";
import { Camera } from "../camera";
import { Transform } from "../transform";
import { vec3, mat4, vec4 } from "../../node_modules/gl-matrix/lib/gl-matrix";

export class OrbitControl {
    deltaX: number;
    deltaY: number;
    pitch: number;
    yaw: number;
    speed: number;
    entity: Entity;
    constructor(screen: Render, pitch = 90, yaw = 90, speed = 1) {
        this.pitch = pitch;
        this.yaw = yaw;
        this.speed = speed;
        OrbitControl.init(screen.canvas, this);
    }
    moveHandler = (e) => {
        let {movementX, movementY} = e;
        this.deltaX = movementX * this.speed;
        this.deltaY = -movementY * this.speed;
        this.pitch += this.deltaY;
        this.yaw += this.deltaX;
        this.pitch = Math.min(180, Math.max(0.01, this.pitch))
        let camera = this.entity.components.Camera as Camera;
        let trans = this.entity.components.Transform as Transform;
        camera.isDirty = true;
        // https://github.com/t01y/WebGL_Learning/blob/PBR/scripts/canvas.js#L752
        let len = vec3.distance(trans.translate, camera.lookAt);
        trans.translate[0] = len * Math.sin(this.pitch/180*Math.PI) * Math.cos(this.yaw/180*Math.PI);
        trans.translate[1] = len * Math.cos(this.pitch/180*Math.PI);
        trans.translate[2] = len * Math.sin(this.pitch/180*Math.PI) * Math.sin(this.yaw/180*Math.PI);
        // console.log(this.pitch, this.yaw, trans.translate);
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