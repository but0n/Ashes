import { Transform } from "../transform";

export interface Entity extends HTMLElement {
    components: any;
}
export class EntityMgr {
    static create() {
        let gameObject = document.createElement('ash-entity') as Entity;
        gameObject.components = {};
        this.addComponent(gameObject, new Transform());
        return gameObject;
    }

    static find(selector:string) {
        let nodes = Array.from(document.querySelectorAll(selector)); // convert NodeList to Array
        return nodes as Entity[];
    }

    static addComponent(entity: Entity, component: Object) {
        let componentName = component.constructor.name;
        entity.components[componentName] = component;
        entity.setAttribute(componentName, '');
    }
}