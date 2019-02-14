import { EntityMgr } from "./entityMgr";
import { ComponentSystem } from "./component";

export class System {
    static lastTime: number = 0;
    static deltaTime: number = 0;
    private static PID: number;
    private static isStoped = true;
    static loop() {
        for(let name in this.sysQueue) {
            let sys = this.sysQueue[name] as ComponentSystem;
            if(EntityMgr.hasNewMember || sys.group.length == 0) {
                sys.group = EntityMgr.getEntites(sys.depends);
            }
            sys.onUpdate(this.deltaTime);
        }
        EntityMgr.hasNewMember = false;
        this.deltaTime = (Date.now() - this.lastTime)/1000;
        this.lastTime = Date.now();
        if(!this.isStoped)
            requestAnimationFrame(this.loop.bind(this));
    }
    static start() {
        if(!this.isStoped)
            return;
        this.isStoped = false;
        this.PID = requestAnimationFrame(this.loop.bind(this));
    }
    static stop() {
        cancelAnimationFrame(this.PID);
        this.isStoped = true;
    }

    private static sysQueue = {};
    static registSystem(system: ComponentSystem) {
        this.sysQueue[system.depends.toString()] = system;
    }
    static getSystem(system: ComponentSystem) {
        return this.sysQueue[system.depends.toString()];
    }
    static removeSystem(system: ComponentSystem) {
        this.sysQueue[system.depends.toString()] = null;
    }
} System.start();