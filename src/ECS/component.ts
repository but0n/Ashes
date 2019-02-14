export abstract class ComponentSystem {
    abstract group: any[];
    abstract depends: string[];
    abstract onUpdate(deltaTime: number);
}