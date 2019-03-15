import { Texture, Sampler } from "./texture";
import { MeshRenderer } from "./meshRenderer";
import { Material } from "./material";
import { Mesh, Accessor, bufferView } from "./mesh/mesh";
import { Shader } from "./shader";
import { Screen } from "./webgl2/screen";

// Post effect
export class Filter {
    static sampleColor: Sampler = {
        magFilter: WebGL2RenderingContext.LINEAR,
        minFilter: WebGL2RenderingContext.LINEAR,
        wrapS: WebGL2RenderingContext.REPEAT,
        wrapT: WebGL2RenderingContext.REPEAT,
    };
    static sampleDepth: Sampler = {
        magFilter: WebGL2RenderingContext.NEAREST,
        minFilter: WebGL2RenderingContext.NEAREST,
        wrapS: WebGL2RenderingContext.REPEAT,
        wrapT: WebGL2RenderingContext.REPEAT,
    };
    ctx: WebGL2RenderingContext;
    width: number;
    height: number;
    buffer: WebGLFramebuffer;
    color: Texture[] = [];
    input: Texture;
    output: Texture;
    depth: Texture[] = [];
    meshRender: MeshRenderer;
    material: Material;
    mesh: Mesh;
    renderToScreen = true;
    screen: Screen;
    constructor(screen: Screen, shader: Shader, width: number = screen.width, height: number = screen.height) {
        this.ctx = screen.gl;
        this.screen = screen;
        this.width = width;
        this.height = height;

        // Create framebuffer
        this.buffer = this.ctx.createFramebuffer();

        this.output = this.attachTexture();

        this.mesh = new fill();
        this.material = new Material(shader);
        this.meshRender = new MeshRenderer(screen, this.mesh, this.material);
    }

    clone(screen: Screen = this.screen) {
        return new Filter(screen, Shader.clone(this.material.shader), this.width, this.height);
    }
    setInput(tex: Texture, channel = 'base') {
        this.input = tex;
        Material.setTexture(this.material, channel, tex);
        this.material.isDirty = true;
    }

    private static COLOR_ATTACH_BASE = WebGL2RenderingContext.COLOR_ATTACHMENT0;
    private static DEPTH_ATTACHMENT = WebGL2RenderingContext.DEPTH_ATTACHMENT;
    private static FRAMEBUFFER = WebGL2RenderingContext.FRAMEBUFFER;

    bind(target = this.buffer) {
        this.ctx.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, target);
    }

    attachTexture() {
        this.bind();

        let color = new Texture(null, Filter.sampleColor, this.width*this.screen.ratio, this.height*this.screen.ratio);
        Texture.createTexture(this.ctx, color);
        this.ctx.framebufferTexture2D(Filter.FRAMEBUFFER, Filter.COLOR_ATTACH_BASE + this.color.length, color.glType, color.sampler.texture, color.level);
        this.color.push(color);

        let depth = new Texture(null, Filter.sampleDepth, this.width*this.screen.ratio, this.height*this.screen.ratio);
        depth.internalformat = WebGL2RenderingContext.DEPTH_COMPONENT24;
        depth.format = WebGL2RenderingContext.DEPTH_COMPONENT;
        depth.type = WebGL2RenderingContext.UNSIGNED_INT;
        Texture.createTexture(this.ctx, depth);
        this.ctx.framebufferTexture2D(Filter.FRAMEBUFFER, Filter.DEPTH_ATTACHMENT, depth.glType, depth.sampler.texture, depth.level);
        this.depth.push(depth);

        this.bind(null);

        return color;
    }
}

class fill extends Mesh {
    constructor() {
        let vert = new Float32Array([
            -1, 3, 0, -1, -1, 0, 3, -1, 0
        ]);
        let vbo = new bufferView(vert.buffer, {
            byteOffset: vert.byteOffset,
            byteLength: vert.byteLength,
            byteStride: 3 * 4,
            target: WebGL2RenderingContext.ARRAY_BUFFER
        });
        let position = new Accessor({
            bufferView: vbo,
            componentType: WebGL2RenderingContext.FLOAT,
            byteOffset: 0,
            type: "VEC3",
            count: 3
        }, 'POSITION');
        super([position]);

    }
}