export class Texture {
    image: HTMLImageElement;
    sampler: Sampler;
    texture: WebGLTexture = null;
    channel: number = null;
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

    constructor(rawImage, sampler = undefined, width = 256, height = 256, border = 0) {
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
        return new Texture(origin.image, origin.sampler);
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
        if(tex.texture) {   // if the texuter is already exist
            gl.deleteTexture(tex.texture);
        }
        tex.texture = gl.createTexture();
        gl.bindTexture(tex.glType, tex.texture);

        if(tex.isCubetex) {
            for(let i in this.cubetexOrder) {
                gl.texImage2D(this.cubetexOrder[i], tex.level, tex.internalformat, tex.format, tex.type, tex.image[i]);
            }
        } else {
            if(tex.image) {
                gl.texImage2D(tex.glType, tex.level, tex.internalformat, tex.format, tex.type, tex.image);
            } else { // Data texture
                gl.texImage2D(tex.glType, tex.level, tex.internalformat, tex.width, tex.height, tex.border, tex.format, tex.type, tex.data);
            }
        }

        gl.texParameterf(tex.glType, gl.TEXTURE_WRAP_S, tex.sampler.wrapS);
        gl.texParameterf(tex.glType, gl.TEXTURE_WRAP_T, tex.sampler.wrapT);

        if(tex.sampler.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST || tex.sampler.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR || tex.sampler.minFilter == WebGL2RenderingContext.LINEAR_MIPMAP_NEAREST || tex.sampler.minFilter == WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR) {
            gl.generateMipmap(tex.glType);

        } else {
            gl.texParameterf(tex.glType, gl.TEXTURE_MIN_FILTER, tex.sampler.minFilter);
            gl.texParameterf(tex.glType, gl.TEXTURE_MAG_FILTER, tex.sampler.magFilter);
        }

        gl.bindTexture(tex.glType, null);
    }

    // Reduce GC
    static texChannels = [
        WebGL2RenderingContext.TEXTURE0,
        WebGL2RenderingContext.TEXTURE1,
        WebGL2RenderingContext.TEXTURE2,
        WebGL2RenderingContext.TEXTURE3,
        WebGL2RenderingContext.TEXTURE4,
        WebGL2RenderingContext.TEXTURE5,
        WebGL2RenderingContext.TEXTURE6,
        WebGL2RenderingContext.TEXTURE7,
    ];

    static unbindTexture(gl: WebGL2RenderingContext, tex: Texture) {
        if(tex.channel != null) {
            gl.activeTexture(this.texChannels[tex.channel]);
        }
        gl.bindTexture(tex.glType, null);
    }

    static bindTexture(gl: WebGL2RenderingContext, tex: Texture) {
        if(tex.channel != null) {
            gl.activeTexture(this.texChannels[tex.channel]);
        }
        if(tex.texture == null) {
            this.createTexture(gl, tex);
        }
        gl.bindTexture(tex.glType, tex.texture);
    }
}

export class Sampler {
    magFilter;
    minFilter;
    wrapS;
    wrapT;
    constructor({magFilter = WebGL2RenderingContext.NEAREST, minFilter = WebGL2RenderingContext.NEAREST, wrapS = 10497, wrapT = 10497} = {magFilter: WebGL2RenderingContext.NEAREST, minFilter: WebGL2RenderingContext.NEAREST, wrapS: 10497, wrapT: 10497}) {
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
    }
}