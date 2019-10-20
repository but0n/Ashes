export class Texture {

    static defaultData = new Uint8Array([
        1, 1, 1, 1,
        1, 0.5, 0.4, 1,
        0.4, 0.5, 1, 1,
        1, 1, 1, 1,
    ].map(v=>v*255))

    image: HTMLImageElement;
    sampler: Sampler;
    // channel: number = null;
    isDirty: boolean = true;
    glType = WebGL2RenderingContext.TEXTURE_2D;
    isCubetex = false;
    width: number;
    height: number;
    border: number;
    data = null;

    level: number = 0;
    internalformat: number = WebGL2RenderingContext.RGBA;
    format: number = WebGL2RenderingContext.RGBA;
    type: number = WebGL2RenderingContext.UNSIGNED_BYTE;

    flipY = false;

    constructor(rawImage, sampler = undefined, width = 2, height = 2, border = 0) {
        this.sampler = new Sampler(sampler);
        this.image = rawImage;

        this.width = width;
        this.height = height;
        this.border = border;

        if (rawImage && rawImage.length == 6) {
            this.isCubetex = true;
            this.glType = WebGL2RenderingContext.TEXTURE_CUBE_MAP;
        }
    }

    static clone(origin: Texture) {
        let temp = new Texture(origin.image, origin.sampler);
        // temp.sampler = origin.sampler;
        // temp.sampler = new Sampler(origin.sampler);
        // temp.sampler.texture = null;
        temp.flipY = origin.flipY;
        temp.data = origin.data;
        temp.width = origin.width;
        temp.height = origin.height;
        temp.isCubetex = origin.isCubetex;
        temp.glType = origin.glType;
        temp.border = origin.border;
        temp.level = origin.level;
        temp.internalformat = origin.internalformat;
        temp.format = origin.format;
        temp.type = origin.type;
        return temp;
    }

    static cubetexOrder = [
        WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    ];

    static createTexture(gl: WebGL2RenderingContext, tex: Texture) {
        if(tex.sampler.texture) {   // if the texuter is already exist
            gl.deleteTexture(tex.sampler.texture);
        }
        tex.sampler.texture = gl.createTexture();
        gl.bindTexture(tex.glType, tex.sampler.texture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, tex.flipY ? 1 : 0);

        if(tex.isCubetex) {
            for(let i in this.cubetexOrder) {
                if(tex.image) {
                    gl.texImage2D(this.cubetexOrder[i], tex.level, tex.internalformat, tex.format, tex.type, tex.image[i]);
                } else {
                    gl.texImage2D(this.cubetexOrder[i], tex.level, tex.internalformat, tex.width, tex.height, 0, tex.format, tex.type, tex.data[i]);
                }
            }
        } else {
            if(tex.image) {
                gl.texImage2D(tex.glType, tex.level, tex.internalformat, tex.format, tex.type, tex.image);
            } else { // Data texture
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                gl.texImage2D(tex.glType, tex.level, tex.internalformat, tex.width, tex.height, tex.border, tex.format, tex.type, tex.data);
            }
        }

        gl.texParameterf(tex.glType, gl.TEXTURE_WRAP_S, tex.sampler.wrapS);
        gl.texParameterf(tex.glType, gl.TEXTURE_WRAP_T, tex.sampler.wrapT);
        gl.texParameterf(tex.glType, gl.TEXTURE_MAG_FILTER, tex.sampler.magFilter);
        gl.texParameterf(tex.glType, gl.TEXTURE_MIN_FILTER, tex.sampler.minFilter);

        if(tex.sampler.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST
            || tex.sampler.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR
            || tex.sampler.minFilter == WebGL2RenderingContext.LINEAR_MIPMAP_NEAREST
            || tex.sampler.minFilter == WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR) {
            gl.generateMipmap(tex.glType);

        } else {
            // gl.texParameterf(tex.glType, gl.TEXTURE_MIN_FILTER, tex.sampler.minFilter);
            // gl.texParameterf(tex.glType, gl.TEXTURE_MAG_FILTER, tex.sampler.magFilter);
        }
        // gl.texParameterf(tex.glType, gl.TEXTURE_MIN_FILTER, tex.sampler.minFilter);

        gl.bindTexture(tex.glType, null);
    }

    static unbindTexture(gl: WebGL2RenderingContext, tex: Texture, channel: number) {
        if(channel != null) {
            gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + channel);
        }
        gl.bindTexture(tex.glType, null);
    }

    static bindTexture(gl: WebGL2RenderingContext, tex: Texture, channel: number) {
        if(channel != null) {
            gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + channel);
        }
        if(tex.sampler.texture == null || (tex.isDirty && (tex.data || tex.image))) {
            // Ignore texture belongs to framebuffer after created once
            this.createTexture(gl, tex);
        }
        gl.bindTexture(tex.glType, tex.sampler.texture);
    }
}

export class Sampler {
    magFilter;
    minFilter;
    wrapS;
    wrapT;
    texture?: WebGLTexture = null;
    constructor({magFilter = WebGL2RenderingContext.NEAREST, minFilter = WebGL2RenderingContext.NEAREST, wrapS = 10497, wrapT = 10497, texture = null} = {magFilter: WebGL2RenderingContext.NEAREST, minFilter: WebGL2RenderingContext.NEAREST, wrapS: 10497, wrapT: 10497, texture: null}) {
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.texture = texture;
    }
}