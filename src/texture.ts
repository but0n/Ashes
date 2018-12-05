export class Texture {
    uniform: string;
    image: HTMLImageElement;
    sampler: Sampler;
    texture: WebGLTexture = null;
    channel: number = null;
    isDirty: boolean = true;
    constructor(rawImage: HTMLImageElement, sampler) {
        this.image = rawImage;
        this.sampler = new Sampler(sampler);
    }

    static createTexture(gl: WebGL2RenderingContext, tex: Texture) {
        if(tex.texture) {   // if the texuter is already exist
            gl.deleteTexture(tex.texture);
        }
        tex.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex.texture);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, tex.sampler.magFilter);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, tex.sampler.magFilter);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, tex.sampler.wrapS);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, tex.sampler.wrapT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
    }

    static bindTexture(gl: WebGL2RenderingContext, tex: Texture) {
        if(tex.channel != null) {
            gl.activeTexture([
                gl.TEXTURE0,
                gl.TEXTURE1,
                gl.TEXTURE2,
                gl.TEXTURE3,
                gl.TEXTURE4,
                gl.TEXTURE5,
                gl.TEXTURE6,
                gl.TEXTURE7
            ][tex.channel]);
        }
        if(tex.texture == null) {
            this.createTexture(gl, tex);
        }
        gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    }
}

class Sampler {
    magFilter;
    minFilter;
    wrapS;
    wrapT;
    constructor({magFilter, minFilter, wrapS = 10497, wrapT = 10497}) {
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
    }
}