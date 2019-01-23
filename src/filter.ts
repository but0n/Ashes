import { Texture, Sampler } from "./texture";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { Mesh } from "./mesh/mesh";
import { QuadMesh } from "./mesh/quadMesh";
import { Shader } from "./shader";
import { Screen } from "./webgl2/screen";

// Post effect
export class Filter {
    static sampleOpt: Sampler = {
        magFilter: WebGL2RenderingContext.LINEAR,
        minFilter: WebGL2RenderingContext.LINEAR,
        wrapS: 10497,
        wrapT: 10497,
    };
    ctx: WebGL2RenderingContext;
    width: number;
    height: number;
    buffer: WebGLFramebuffer;
    color: Texture[] = [];
    depth: Texture[] = [];
    meshRender: MeshRenderer;
    material: Material;
    mesh: Mesh;
    constructor(screen: Screen, shader: Shader, width: number, height: number) {
        this.ctx = screen.gl;
        this.width = width;
        this.height = height;

        // Create framebuffer
        this.buffer = this.ctx.createFramebuffer();
        this.bind();

        this.attachTexture();

        this.mesh = new QuadMesh();
        this.material = new Material(shader);
        this.meshRender = new MeshRenderer(screen, this.mesh, this.material);
    }

    private static COLOR_ATTACH_BASE = WebGL2RenderingContext.COLOR_ATTACHMENT0;
    private static FRAMEBUFFER = WebGL2RenderingContext.FRAMEBUFFER;

    bind(target = this.buffer) {
        this.ctx.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, target);
    }

    attachTexture() {
        let color = new Texture(null, Filter.sampleOpt, this.width, this.height);
        Texture.createTexture(this.ctx, color);
        this.ctx.framebufferTexture2D(Filter.FRAMEBUFFER, Filter.COLOR_ATTACH_BASE + this.color.length, color.glType, color.texture, 0);
        this.color.push(color);
    }
}