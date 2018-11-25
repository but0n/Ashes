export class Entity {
    static createEntity() {
        let gameObject: any = document.createElement('ash-entity');
        gameObject.components = {};
        return gameObject;
    }

    static findEntity(selector:string) {
        return document.querySelectorAll(selector);
    }

    static addComponent(entity, component: Object) {
        let componentName = component.constructor.name;
        entity.components[componentName] = component;
        entity.dataset[componentName] = '';
    }
}