import { Render } from "../webgl2/render";
import { Entity, EntityMgr } from "../ECS/entityMgr";
import { Camera } from "../camera";
import { Transform } from "../transform";
import { vec3, mat4, vec4 } from "../../node_modules/gl-matrix/lib/gl-matrix";

export class OrbitControl {
    deltaX: number;
    deltaY: number;
    pitch: number;
    yaw: number;
    speed: number;
    distance: number;

    camera: Camera;
    trans: Transform;
    constructor(screen: Render, target: Entity, pitch = 90, yaw = 90, speed = 1) {
        this.pitch = pitch;
        this.yaw = yaw;
        this.speed = speed;
        this.camera = target.components.Camera;
        this.trans = target.components.Transform;
        this.distance = vec3.distance(this.trans.translate, this.camera.lookAt);

        EntityMgr.addComponent(target, this);

        OrbitControl.bindEvents(screen.canvas, this);
    }
    moveHandler = (e) => {
        let {movementX, movementY} = e;
        this.deltaX = movementX * this.speed;
        this.deltaY = -movementY * this.speed;
        this.pitch += this.deltaY;
        this.yaw += this.deltaX;
        this.pitch = Math.min(180, Math.max(0.01, this.pitch))
        OrbitControl.updatePosition(this);
        // console.log(this.pitch, this.yaw, trans.translate);
    }
    scrollHandler = ({deltaY}) => {
        console.log(deltaY);
        // vec3.scaleAndAdd(this.trans.translate, this.trans.translate, this.direction, deltaY);
        this.distance += deltaY * 0.1;
        OrbitControl.updatePosition(this);
    }

    static updatePosition(controler: OrbitControl) {
        // https://github.com/t01y/WebGL_Learning/blob/PBR/scripts/canvas.js#L752
        controler.trans.translate[0] = controler.distance * Math.sin(controler.pitch/180*Math.PI) * Math.cos(controler.yaw/180*Math.PI);
        controler.trans.translate[1] = controler.distance * Math.cos(controler.pitch/180*Math.PI);
        controler.trans.translate[2] = controler.distance * Math.sin(controler.pitch/180*Math.PI) * Math.sin(controler.yaw/180*Math.PI);
        controler.camera.isDirty = true;
    }
    static bindEvents(screen: HTMLElement, controler: OrbitControl) {
        screen.addEventListener('mousedown', () => {
            screen.addEventListener('mousemove', controler.moveHandler)
        })
        screen.addEventListener('mouseup', () => {
            screen.removeEventListener('mousemove', controler.moveHandler);
        })
        screen.addEventListener('wheel', controler.scrollHandler);
    }
}