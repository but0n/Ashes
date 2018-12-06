export abstract class ComponentSystem {
    abstract depends: string[];
    abstract onUpdate();
}

export class System {
    static lastTime: number = 0;
    static deltaTime: number = 0;
    private static PID: number;
    private static isStoped = true;
    static loop() {

        for(let name in this.sysQueue) {
            let sys = this.sysQueue[name] as ComponentSystem;
            sys.onUpdate();
        }
        this.deltaTime = Date.now() - this.lastTime;
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
        // cancelAnimationFrame(this.PID);
        this.isStoped = true;
    }

    private static sysQueue = {};
    static registSystem(system: ComponentSystem) {
        this.sysQueue[system.depends.toString()] = system;
    }
    static removeSystem(system: ComponentSystem) {
        this.sysQueue[system.depends.toString()] = null;
    }
}
