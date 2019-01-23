import { Mesh } from "./mesh/mesh";
import { Material } from "./material";
import { Entity } from "./ECS/entityMgr";
import { Transform } from "./transform";
import { Screen } from "./webgl2/screen";
import { ComponentSystem } from "./ECS/component";
import { System } from "./ECS/system";

export class MeshRenderer {
    entity: Entity;
    mesh: Mesh;
    materials: Material[] = [];
    vao: WebGLVertexArrayObject;
    isDirty: boolean = true;
    SID: number;
    constructor(screen: Screen, mesh: Mesh, material: Material) {
        this.SID = MeshRendererSystem.regScreen(screen);
        this.mesh = mesh;
        MeshRendererSystem.attachMaterial(this, material);
    }


}

export class MeshRendererSystem extends ComponentSystem {
    group = [];
    depends = [
        MeshRenderer.name
    ];
    onUpdate() {
        for(let {components} of this.group) {
            MeshRendererSystem.render(components.MeshRenderer);
        }
    }

    static ctxCache: Screen[] = [];
    static regScreen(screen: Screen) {
        return this.ctxCache.push(screen)-1;
    }

    static useMaterial(mr: MeshRenderer, index) {
        Material.useMaterial(mr.materials[index], this.ctxCache[mr.SID].gl);
    }

    static attachMaterial(mr: MeshRenderer, mat: Material) {
        mr.materials.push(mat);
        Material.updateUniform(mat, this.ctxCache[mr.SID].gl); // the first time this material get context
        this.useMaterial(mr, 0);
        this.updateVAO(mr);
    }

    static bindVAO(mr: MeshRenderer, vao) {
        if(Screen.platform == 'iOS') {
            Mesh.bindAccessorsVBO(mr.mesh, this.ctxCache[mr.SID].gl, mr.materials[0].shader.attributes);
        } else {
            this.ctxCache[mr.SID].gl.bindVertexArray(vao);
        }
    }

    static updateVAO(mr: MeshRenderer) {
        if(mr.vao) {
            this.ctxCache[mr.SID].gl.deleteVertexArray(mr.vao);
        }
        mr.vao = this.ctxCache[mr.SID].gl.createVertexArray();
        this.bindVAO(mr, mr.vao);
        Mesh.bindAccessorsVBO(mr.mesh, this.ctxCache[mr.SID].gl, mr.materials[0].shader.attributes);
        this.bindVAO(mr, null);
    }

    static updateMaterial(target: MeshRenderer) {
        if(target.materials[0].isDirty) {
            Material.updateUniform(target.materials[0], this.ctxCache[target.SID].gl);
        }
    }


    static render(target: MeshRenderer) {
        if(!target.entity.components.Transform.isVisible)
            return;
        this.ctxCache[target.SID].beforeDrawcall();
        this.useMaterial(target, 0);  // Select material
        let trans: Transform = target.entity.components.Transform;
        Material.setUniform(target.materials[0], 'M', trans.worldMatrix);
        Material.setUniform(target.materials[0], 'nM', trans.worldNormalMatrix);
        this.updateMaterial(target);    // Update uniforms of material
        this.bindVAO(target, target.vao); // Bind VAO
        Mesh.bindIndecesEBO(target.mesh, this.ctxCache[target.SID].gl);
        Mesh.drawElement(target.mesh, this.ctxCache[target.SID].gl);
        this.ctxCache[target.SID].afterDrawcall();
        // Clean texture channels
        // Material.unbindAllTextures(target.materials[0], this.ctxCache[target.SID].gl);
    }
    // According those discussion below, having actors draw themselves is not a good design
    // https://gamedev.stackexchange.com/questions/50531/entity-component-based-engine-rendering-separation-from-logic
    // https://gamedev.stackexchange.com/questions/14133/should-actors-in-a-game-be-responsible-for-drawing-themselves/14138#14138


    static beforeRender() {

    }

    static afterRender() {

    }

} System.registSystem(new MeshRendererSystem());