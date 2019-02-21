export interface Entity extends HTMLElement {
    components: any;
}
export class EntityMgr {
    static entityTag = 'ash-entity';
    static getDefaultComponent;
    static hasNewMember: boolean = false;
    static create(name: string = null, pure = false) {
        this.hasNewMember = true;
        let gameObject = document.createElement(this.entityTag) as Entity;
        if(name) {
            gameObject.dataset.name = name;
            gameObject.textContent = name;
        }
        gameObject.components = {};
        if(this.getDefaultComponent && !pure)
            this.addComponent(gameObject, this.getDefaultComponent());
        // Debug envent
        gameObject.addEventListener('pointerdown', e => {
            console.log('\t|-' + gameObject.dataset.name);
            console.log(gameObject.components);
            let trans = gameObject.components.Transform;
            // toggle visible
            if(trans != null) {
                trans.isVisible = !trans.isVisible;
            }
            e.stopPropagation();
        })
        return gameObject;
    }
    static cloneMethods = {};
    static clone(entity: Entity) {
        let temp = this.create(entity.dataset.name, true);
        this.addComponent(temp, this.cloneMethods['_Transform'](entity.components.Transform));
        for(let comp in entity.components) {
            if(this.cloneMethods[comp]) {
                this.addComponent(temp, this.cloneMethods[comp](entity.components[comp]));
            }
        }
        for(let i = 0; i < entity.childElementCount; i++) {
            temp.appendChild(this.clone(entity.children[i] as Entity));
        }
        return temp;
    }

    static find(selector:string, root:any = document) {
        let nodes = Array.from(root.querySelectorAll(selector)); // convert NodeList to Array
        return nodes as Entity[];
    }

    static getComponents<T>(componentName: string) {
        return this.find(`${this.entityTag}[${componentName.toLowerCase()}]`).map(({components}) => components[componentName]) as T[];
    }

    static getEntites(deps: string[], root:any = document) {
        return this.find(`${this.entityTag}[${deps.join('][')}]`, root);
    }

    static addComponent(entity: Entity, component: any) {
        let componentName = component.constructor.name;
        entity.components[componentName] = component;
        entity.setAttribute(componentName, '');
        component.entity = entity;
        return component;
    }
}