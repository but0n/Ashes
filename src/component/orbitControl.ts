import { Screen } from "../webgl2/screen";
import { Entity, EntityMgr } from "../ECS/entityMgr";
import { Camera, CameraSystem } from "../camera";
import { Transform, TransformSystem } from "../transform";
import { vec3, mat4 } from "../math";
import { ComponentSystem } from "../ECS/component";
import { System } from "../ECS/system";

export class OrbitControl {
    pitch: number;
    yaw: number;
    speed: number;
    distance: number;
    movement: Float32Array = vec3.create();
    unprojectMatrix: Float32Array = mat4.create();
    private X = vec3.fromValues(1, 0, 0);
    private Y = vec3.fromValues(0, 1, 0);
    private Z = vec3.fromValues(0, 0, 1);

    vx = 0;
    vy = 0;
    vz = 0;

    // Damping stuff
    vyaw = 0;
    vpitch = 0;
    vscale = 0;
    threshold = 0.001;
    damping: number;

    lastalpha;
    lastbeta;


    camera: Camera;
    trans: Transform;
    constructor(screen: Screen, target: Entity, pitch = 90, yaw = 90, speed = 0.2, damping = 0.92) {
        this.pitch = pitch;
        this.yaw = yaw;
        this.speed = speed;
        this.damping = damping;

        this.camera = target.components.Camera;
        this.trans = target.components.Transform;
        this.distance = vec3.distance(this.trans.translate, this.camera.lookAt);

        // EntityMgr.addComponent(target, this);

        // Regist current camera as main camera (backward compatibility)
        screen.mainCamera = this.camera;

        OrbitControl.bindEvents(screen.canvas, this);
        OrbitControlSystem.updatePosition(this);
    }
    moveHandler = (e) => {
        let {movementX, movementY, buttons} = e;
        if(buttons == 2) {  // Drag
            // // this.vx += dx * speed;
            // // this.vy += dy * speed;


            // this.movement[0] = (movementX / window.innerWidth) * 2 - 1;
            // this.movement[1] = -(movementY / window.innerHeight) * 2 + 1;
            // this.movement[2] = 0.5;
            // mat4.invert(this.unprojectMatrix, this.camera.projection);
            // mat4.mul(this.unprojectMatrix, this.unprojectMatrix, this.camera.view);

            // vec3.transformMat4(this.movement, this.movement, this.unprojectMatrix);

            // vec3.add(this.camera.lookAt, this.camera.lookAt, this.movement);


        } else {    // Rotate
            let deltaX = movementX * this.speed;
            let deltaY = -movementY * this.speed;
            this.vpitch += deltaY;
            this.vyaw += deltaX;
        }
        // OrbitControlSystem.updatePosition(this);
    }
    touchHandler = (() => {
        let lastX, lastY;
        return (e)=>{
            let {pageX, pageY} = e.touches[0];
            if(lastX || lastY) {
                let dX = pageX - lastX;
                let dY = pageY - lastY;
                this.vpitch += -dY * this.speed;
                this.vyaw += dX * this.speed;
            }
            lastY = pageY;
            lastX = pageX;
        }
    });
    scrollHandler = ({deltaY}) => {
        // vec3.scaleAndAdd(this.trans.translate, this.trans.translate, this.direction, deltaY);
        this.vscale += deltaY * this.speed * 0.01;
        // OrbitControlSystem.updatePosition(this);
    }

    orientationHandler = (e) => {
        // if (this.ctr_initial_m) {
        //     const delX = e.gamma - this.ctr.x;
        //     const delY = e.beta - this.ctr.y;
        //     vx -= delX * 0.09;
        //     vy -= delY * 0.09;
        // } else {
        //     this.ctr_initial_m = true;
        // }
        // this.ctr.x = e.gamma;
        // this.ctr.y = e.beta;
        if(!this.lastalpha || !this.lastbeta) {
            this.lastalpha = e.alpha;
            this.lastbeta = e.beta;
        }
        let dalpha = e.alpha - this.lastalpha;
        let dbeta = e.beta - this.lastbeta;
        // this.vpitch += dbeta * this.speed;
        // this.vyaw += dgamma * this.speed;
        this.pitch = this.lastbeta + dbeta * 0.1;
        this.yaw = this.lastalpha + dalpha * 0.1;
        // this.pitch = e.beta;
        // this.yaw = e.alpha;

    }


    static bindEvents(screen: HTMLElement, controler: OrbitControl) {
        screen.oncontextmenu = () => false;
        screen.addEventListener('mousedown', () => {
            screen.addEventListener('mousemove', controler.moveHandler)
        })
        screen.addEventListener('mouseup', () => {
            screen.removeEventListener('mousemove', controler.moveHandler);
        })
        screen.addEventListener('wheel', controler.scrollHandler);

        // Mobile device
        screen.addEventListener('touchstart', () => {
            let handler = controler.touchHandler();
            screen.addEventListener('touchmove', handler)
            screen.addEventListener('touchend', () => {
                screen.removeEventListener('touchmove', handler);
            })
        })
        screen.addEventListener('wheel', controler.scrollHandler);

        // try {
        //     window.addEventListener("deviceorientation", controler.orientationHandler, false);
        // } catch (e) {
        //     console.log(e);
        // }

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
        // TODO: enhance
        TransformSystem.updateMatrix(ctr.trans);
    }
} System.registSystem(new OrbitControlSystem());