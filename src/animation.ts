import { ComponentSystem } from "./ECS/component";
import { System } from "./ECS/system";
import { Accessor } from "./mesh/mesh";
import { vec3, quat } from "./math";
import { Entity } from "./ECS/entityMgr";

export class Animation {
    channels: AnimationChannel[] = [];
    static totalTime = 0;
    static attachChannel(anim: Animation, chan: AnimationChannel) {
        anim.channels.push(chan);
        this.totalTime = Math.max(this.totalTime, chan.endTime);
    }
}


export class AnimationChannel {
    entity: Entity;
    isBezier;
    isKeyframe;
    isLoop = true;
    timeline: Float32Array;
    keyframe: Float32Array[];
    channel: Float32Array;
    pause = false;
    currentTime = 0;
    startTime = 0;
    endTime = 0;
    totalTime = 0;
    step = 0;
    speed = 1;
    constructor(pTarget, timeline: Accessor, keyframe: Accessor) {
        this.channel = pTarget;
        this.timeline = Accessor.newFloat32Array(timeline);
        this.endTime = this.timeline[this.timeline.length-1];

        this.keyframe = Accessor.getFloat32Blocks(keyframe);

        if(this.timeline.length != 1) {
            this.currentTime = this.startTime = this.timeline[0];
        } else {
            this.currentTime = this.endTime;
        }
    }
}

class AnimationSystem extends ComponentSystem {
    group = [];
    depends = [
        Animation.name,
    ];
    reset(anim: AnimationChannel) {
        anim.step = 0;
        anim.currentTime = 0;
    }
    static defaultQuat = quat.create();
    static defaultVec3 = vec3.create();
    static step(anim: AnimationChannel) {
        let rigLength = anim.channel.length;
        let prevKey = anim.step;
        let nextKey = prevKey+1;

        let prevTime, prevFrame, nextTime, nextFrame;

        if (anim.timeline.length == 1) { // Single frame
            nextKey = 0;
            prevTime = 0;
            anim.pause = true;
        } else {
            prevTime = anim.timeline[prevKey];
            prevFrame = anim.keyframe[prevKey];
        }

        nextTime = anim.timeline[nextKey];
        nextFrame = anim.keyframe[nextKey];


        let scopeTime = nextTime - prevTime;



        // Confirm
        if (anim.currentTime < prevTime || anim.currentTime > nextTime) {
            console.error('Wrong step!', anim.currentTime, prevTime, nextTime);
            console.log(anim.timeline);
            return;
        }

        let interpolationValue = scopeTime
            ? (anim.currentTime - prevTime) / scopeTime
            : 1;

        switch (rigLength) {
            case 4:
                quat.slerp(anim.channel, prevFrame||this.defaultQuat, nextFrame, interpolationValue);
                break;
            case 3:
                vec3.lerp(anim.channel, prevFrame||this.defaultVec3, nextFrame, interpolationValue);
                break;
        }
    }
    playStep(anim: AnimationChannel, dt: number) {
        if (!anim.pause) {

            if (anim.currentTime > Animation.totalTime) {
                this.reset(anim);
                if (!anim.isLoop) {
                    anim.pause = true;
                    // execute the last frame even already missed?
                    // anim.currentTime = anim.endTime;
                    console.log('stop');
                }
                return;
            }

            while(anim.currentTime > anim.timeline[anim.step + 1]) {
                anim.step++;
            }

            if(anim.currentTime > anim.startTime && anim.currentTime <= anim.endTime) {
                AnimationSystem.step(anim);
            }

            anim.currentTime += dt * anim.speed;

        }

    }
    onUpdate(dt) {
        for (let { components } of this.group) {
            if(dt > 0.016) dt = 0.016;
            let anim = components.Animation as Animation;
            for(let channel of anim.channels) {
                this.playStep(channel, dt);
            }
        }
    };
} System.registSystem(new AnimationSystem());