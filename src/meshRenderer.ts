import { Mesh } from "./mesh/mesh";
import { Material } from "./material";
import { Entity, EntityMgr } from "./ECS/entityMgr";
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
    SID: number; // Screen ID
    constructor(screen: Screen, mesh: Mesh, material?: Material) {
        if(screen != null)
            this.SID = MeshRendererSystem.regScreen(screen);
        this.mesh = mesh;
        MeshRendererSystem.attachMaterial(this, material);
    }

    static clone(source: MeshRenderer) {
        let mr = new MeshRenderer(null, source.mesh);
        mr.SID = source.SID;
        for(let mat of source.materials) {
            MeshRendererSystem.attachMaterial(mr, mat);
        }
        return mr;
    }

}
EntityMgr.cloneMethods['MeshRenderer'] = MeshRenderer.clone;

class MeshRendererSystem extends ComponentSystem {
    group = [];
    depends = [
        MeshRenderer.name
    ];
    onUpdate() {
        // Before render
        for(let screen of MeshRendererSystem.ctxSet.values()) {
            if(screen.filters.length) {
                screen.capture.bind();
                screen.setViewport(screen.capture.width, screen.capture.height);
            }
            screen.clear();
        }
        for(let {components} of this.group) {
            MeshRendererSystem.render(components.MeshRenderer);
        }
        // After render
        for (let screen of MeshRendererSystem.ctxSet.values()) {

            // post effects
            for(let [i,ft] of screen.filters.entries()) {
                if(ft.renderToScreen) {
                    // Render to screen
                    ft.bind(null);
                    screen.setViewport();
                } else {
                    ft.bind();
                    screen.setViewport(ft.width, ft.height);
                    screen.clear(); // clear current framebuffer
                }
                MeshRendererSystem.render(ft.meshRender);
            }

            // // Render to screen
            // let lastft = screen.filters[screen.filters.length-1];
            // lastft.bind(null);
            // screen.setViewport();
            // MeshRendererSystem.render(lastft.meshRender);

        }
    }

    static ctxCache: Screen[] = [];
    static ctxSet: Set<Screen> = new Set();
    static regScreen(screen: Screen) {
        if(!this.ctxSet.has(screen)) {
            this.ctxSet.add(screen);
        }
        return this.ctxCache.push(screen)-1;
    }

    static useMaterial(mr: MeshRenderer, index) {
        Material.useMaterial(mr.materials[index], this.ctxCache[mr.SID].gl);
        return mr.materials[index];
    }

    static attachMaterial(mr: MeshRenderer, mat: Material) {
        if(mr.SID == null) return;
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
        let gl = this.ctxCache[target.SID].gl;
        // Enable material
        let idShader = 0;
        let needsUpdateTexture = target.materials[idShader].shader.isDirty;
        let currentMat = this.useMaterial(target, idShader);

        if(currentMat.doubleSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
        }

        if(target.entity) {
            if(!target.entity.components.Transform.isVisible)
                return;
            let trans: Transform = target.entity.components.Transform;
            Material.setUniform(currentMat, 'M', trans.worldMatrix);
            Material.setUniform(currentMat, 'nM', trans.worldNormalMatrix);
        }

        // Update uniforms of material
        this.updateMaterial(target);

        // Bind all textures
        Material.bindAllTextures(currentMat, gl, needsUpdateTexture);

        // Bind Mesh
        this.bindVAO(target, target.vao); // Bind VAO
        Mesh.bindIndecesEBO(target.mesh, gl);

        // Drawcall
        Mesh.drawElement(target.mesh, gl);

        // Clean texture channels
        // Material.unbindAllTextures(currentMat, gl);
    }
    // According those discussion below, having actors draw themselves is not a good design
    // https://gamedev.stackexchange.com/questions/50531/entity-component-based-engine-rendering-separation-from-logic
    // https://gamedev.stackexchange.com/questions/14133/should-actors-in-a-game-be-responsible-for-drawing-themselves/14138#14138


    static beforeRender() {

    }

    static afterRender() {

    }

} System.registSystem(new MeshRendererSystem());