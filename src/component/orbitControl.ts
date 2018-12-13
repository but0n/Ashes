import { Render } from "../webgl2/render";
import { Entity, EntityMgr } from "../ECS/entityMgr";
import { Camera, CameraSystem } from "../camera";
import { Transform } from "../transform";
import { vec3, mat4, vec4 } from "../../node_modules/gl-matrix/lib/gl-matrix";
import { ComponentSystem } from "../ECS/component";
import { System } from "../ECS/system";

export class OrbitControl {
    deltaX: number;
    deltaY: number;
    pitch: number;
    yaw: number;
    speed: number;
    distance: number;

    // Damping stuff
    vyaw = 0;
    vpitch = 0;
    vscale = 0;
    threshold = 0.001;
    damping: number;


    camera: Camera;
    trans: Transform;
    constructor(screen: Render, target: Entity, pitch = 90, yaw = 90, speed = 0.2, damping = 0.9) {
        this.pitch = pitch;
        this.yaw = yaw;
        this.speed = speed;
        this.damping = damping;

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
        this.vpitch += this.deltaY;
        this.vyaw += this.deltaX;
        // OrbitControlSystem.updatePosition(this);
    }
    scrollHandler = ({deltaY}) => {
        // vec3.scaleAndAdd(this.trans.translate, this.trans.translate, this.direction, deltaY);
        this.vscale += deltaY * this.speed * 0.05;
        // OrbitControlSystem.updatePosition(this);
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

export class OrbitControlSystem extends ComponentSystem {
    group = [];
    depends = [
        OrbitControl.name
    ];
    onUpdate() {
        for(let {components} of this.group) {
            OrbitControlSystem.updatePosition(components.OrbitControl);
        }
    }

    static updatePosition(ctr: OrbitControl) {
        if(Math.abs(ctr.vyaw) > ctr.threshold) {
            ctr.yaw += ctr.vyaw;
            ctr.vyaw *= ctr.damping;
        }
        if(Math.abs(ctr.vpitch) > ctr.threshold) {
            ctr.pitch += ctr.vpitch;
            ctr.vpitch *= ctr.damping;
        }
        if(Math.abs(ctr.vscale) > ctr.threshold) {
            ctr.distance += ctr.vscale;
            ctr.distance = Math.max(ctr.distance, 1.0);
            ctr.vscale *= ctr.damping;
        }
        ctr.pitch = Math.min(180, Math.max(0.01, ctr.pitch))
        // https://github.com/t01y/WebGL_Learning/blob/PBR/scripts/canvas.js#L752
        ctr.trans.translate[0] = ctr.camera.lookAt[0] + ctr.distance * Math.sin(ctr.pitch/180*Math.PI) * Math.cos(ctr.yaw/180*Math.PI);
        ctr.trans.translate[1] = ctr.camera.lookAt[1] + ctr.distance * Math.cos(ctr.pitch/180*Math.PI);
        ctr.trans.translate[2] = ctr.camera.lookAt[2] + ctr.distance * Math.sin(ctr.pitch/180*Math.PI) * Math.sin(ctr.yaw/180*Math.PI);
        ctr.camera.isDirty = true;
    }
} System.registSystem(new OrbitControlSystem());