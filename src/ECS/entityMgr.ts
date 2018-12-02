import { Transform } from "../transform";

export interface Entity extends HTMLElement {
    components: any;
}
export class EntityMgr {
    static entityTag = 'ash-entity';
    static create(name: string = null) {
        let gameObject = document.createElement(this.entityTag) as Entity;
        if(name)
            gameObject.dataset.name = name;
        gameObject.components = {};
        this.addComponent(gameObject, new Transform());
        return gameObject;
    }

    static find(selector:string) {
        let nodes = Array.from(document.querySelectorAll(selector)); // convert NodeList to Array
        return nodes as Entity[];
    }

    static getComponents<T>(componentName: string) {
        return this.find(`${this.entityTag}[${componentName.toLowerCase()}]`).map(({components}) => components[componentName]) as T[];
    }

    static addComponent(entity: Entity, component: any) {
        let componentName = component.constructor.name;
        entity.components[componentName] = component;
        entity.setAttribute(componentName, '');
        component.entity = entity;
    }
}