export class Entity {
    static createEntity() {
        return document.createElement('ash-entity');
    }

    static findEntity(selector:string) {
        return document.querySelectorAll(selector);
    }
}