import { Transform } from "../transform";

export interface Entity extends HTMLElement {
    components: {};
}
export class EntityMgr {
    static create() {
        let gameObject = document.createElement('ash-entity') as Entity;
        gameObject.components = {};
        this.addComponent(gameObject, new Transform());
        return gameObject;
    }

    static find(selector:string) {
        return document.querySelectorAll(selector);
    }

    static addComponent(entity: Entity, component: Object) {
        let componentName = component.constructor.name;
        entity.components[componentName] = component;
        entity.setAttribute(componentName, '');
    }
}