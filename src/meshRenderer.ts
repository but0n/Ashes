import { Mesh } from "./mesh/mesh";
import { Material, RenderQueue } from "./material/material";
import { Entity, EntityMgr } from "./ECS/entityMgr";
import { Transform } from "./transform";
import { Screen } from "./webgl2/screen";
import { ComponentSystem } from "./ECS/component";
import { System } from "./ECS/system";
import { mat4 } from "./math";

export class MeshRenderer {
    entity: Entity;
    mesh: Mesh;
    materials: Material[] = [];
    vao: WebGLVertexArrayObject;
    isDirty: boolean = true;
    SID: string; // Screen ID
    constructor(screen: Screen, mesh: Mesh, material?: Material) {
        if(screen != null)
            this.SID = screen.id;
        this.mesh = mesh;

        // specify the length of each attribute, considering the vertices color could be or vec4
        // FIXME:
        for(let att of mesh.attributes) {
            material.shader.macros[`${att.attribute}_SIZE_${att.size}`] = '';
        }

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
    onUpdate(deltaTime: number) {
        // Before render
        for (let id in Screen.list) {
            let screen = Screen.list[id] as Screen;
            if(screen.filters.length) {
                screen.capture.bind();
                screen.setViewport(screen.capture.width, screen.capture.height);
            }
            screen.clear();
        }
        for(let {components} of this.group) {
            MeshRendererSystem.render(components.MeshRenderer, RenderQueue.Opaque);
        }
        for (let { components } of this.group) {
            // TODO: handle multiple transparent objects
            const mr = components.MeshRenderer as MeshRenderer;
            MeshRendererSystem.render(components.MeshRenderer, RenderQueue.Blend);
        }
        // After render
        for (let id in Screen.list) {
            let screen = Screen.list[id] as Screen;
            screen.gl.depthFunc(WebGL2RenderingContext.ALWAYS);
            screen.gl.disable(WebGL2RenderingContext.BLEND);

            // post effects
            for(let [i,ft] of screen.filters.entries()) {
                if(ft.renderToScreen) {
                    // Render to screen
                    ft.bind(null);
                    screen.setViewport();
                } else {
                    ft.bind();
                    screen.setViewport(ft.width, ft.height);
                }
                if(ft.onRender)
                    ft.onRender(deltaTime);
                MeshRendererSystem.render(ft.meshRender);
            }
            screen.gl.enable(WebGL2RenderingContext.BLEND);
            screen.gl.depthFunc(WebGL2RenderingContext.LESS);
            // // Render to screen
            // let lastft = screen.filters[screen.filters.length-1];
            // lastft.bind(null);
            // screen.setViewport();
            // MeshRendererSystem.render(lastft.meshRender);

        }
    }


    static useMaterial(mr: MeshRenderer, index) {
        Material.useMaterial(mr.materials[index], Screen.list[mr.SID].gl);
    }

    static attachMaterial(mr: MeshRenderer, mat: Material) {
        if(mr.SID == null || mat == null) return;
        mat.ref++;
        mr.materials.push(mat);
        this.useMaterial(mr, 0);
        Material.updateUniform(mat); // the first time this material get context
        this.updateVAO(mr);
    }

    static bindVAO(mr: MeshRenderer, vao) {
        if(Screen.platform == 'iOS') {
            Mesh.bindAccessorsVBO(mr.mesh, Screen.list[mr.SID].gl, mr.materials[0].shader.attributes);
        } else {
            Screen.list[mr.SID].gl.bindVertexArray(vao);
        }
    }

    static updateVAO(mr: MeshRenderer) {
        if(mr.vao) {
            Screen.list[mr.SID].gl.deleteVertexArray(mr.vao);
        }
        mr.vao = Screen.list[mr.SID].gl.createVertexArray();
        this.bindVAO(mr, mr.vao);
        Mesh.bindAccessorsVBO(mr.mesh, Screen.list[mr.SID].gl, mr.materials[0].shader.attributes);
        this.bindVAO(mr, null);
    }

    static updateMaterial(target: MeshRenderer) {
        if(target.materials[0].isDirty) {
            Material.updateUniform(target.materials[0]);
        }
    }

    static render(target: MeshRenderer, queue = RenderQueue.Opaque) {
        let screen = Screen.list[target.SID] as Screen;
        let {gl, mainCamera} = screen;
        // Enable material
        let idShader = 0;
        const currentMat = target.materials[idShader];
        if(currentMat.queue != queue)
            return;
        let needsUpdateTexture = currentMat.shader.isDirty;
        this.useMaterial(target, idShader);

        if(currentMat.doubleSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
        }

        if(target.entity) {
            if(!target.entity.components.Transform.isVisible)
                return;
            let trans: Transform = target.entity.components.Transform;
            if(mainCamera) {
                Material.setUniform(currentMat, 'VP', mainCamera.vp);
                Material.setUniform(currentMat, 'u_Camera', mainCamera.entity.components.Transform.worldPos);
            }

            Material.setUniform(currentMat, 'M', trans.worldMatrix);
            Material.setUniform(currentMat, 'nM', trans.worldNormalMatrix);
            if(trans.jointsMatrices) {
                Material.setUniform(currentMat, 'jointMat[0]', trans.jointsMatrices);
            }
        }

        // Update uniforms of material
        this.updateMaterial(target);

        // Bind all textures
        Material.bindAllTextures(currentMat, gl, needsUpdateTexture);

        // Bind Mesh
        this.bindVAO(target, target.vao); // Bind VAO

        // Drawcall
        Mesh.drawcall(target.mesh, gl);

        // Clean texture channels
        // Material.unbindAllTextures(currentMat, gl);
    }
    // According those discussion below, having actors draw themselves is not a good design
    // https://gamedev.stackexchange.com/questions/50531/entity-component-based-engine-rendering-separation-from-logic
    // https://gamedev.stackexchange.com/questions/14133/should-actors-in-a-game-be-responsible-for-drawing-themselves/14138#14138

} System.registSystem(new MeshRendererSystem());