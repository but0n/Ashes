import { Transform } from "../transform";

interface gameObject extends HTMLElement {
    components: {};
}
export class Entity {
    static createEntity() {
        let gameObject = document.createElement('ash-entity') as gameObject;
        gameObject.components = {};
        this.addComponent(gameObject, new Transform());
        return gameObject;
    }

    static findEntity(selector:string) {
        return document.querySelectorAll(selector);
    }

    static addComponent(entity: gameObject, component: Object) {
        let componentName = component.constructor.name;
        entity.components[componentName] = component;
        entity.setAttribute(componentName, '');
    }
}