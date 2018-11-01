export class Attribute {
    name: string;
    location: number;
    constructor(name: string, location: number) {
        this.name = name;
        this.location = location;
    }
}

export class Uniform {
    name: string;
    location: WebGLUniformLocation;
    type: GLenum;
    setter: string;
    constructor(name: string, location: WebGLUniformLocation, type: GLenum) {
        this.name = name;
        this.location = location;
        this.type = type;
        this.setter = Uniform.getUnifSetter(type);
    }

    static getUnifSetter(type: GLenum) {
        switch (type) {
            case WebGLRenderingContext.FLOAT:
                return 'uniform1f';
            case WebGLRenderingContext.FLOAT_VEC2:
                return 'uniform2f';
            case WebGLRenderingContext.FLOAT_VEC3:
                return 'uniform3f';
            case WebGLRenderingContext.FLOAT_VEC4:
                return 'uniform4f';

            case WebGLRenderingContext.INT:
                return 'uniform1i';
            case WebGLRenderingContext.INT_VEC2:
                return 'uniform2i';
            case WebGLRenderingContext.INT_VEC3:
                return 'uniform3i';
            case WebGLRenderingContext.INT_VEC4:
                return 'uniform4i';

            // case WebGLRenderingContext.BOOL:
            //     return WebGLRenderingContext.uniform1f;
            // case WebGLRenderingContext.BOOL_VEC2:
            //     return WebGLRenderingContext.uniform1f;
            // case WebGLRenderingContext.BOOL_VEC3:
            //     return WebGLRenderingContext.uniform1f;
            // case WebGLRenderingContext.BOOL_VEC4:
            //     return WebGLRenderingContext.uniform1f;

            case WebGLRenderingContext.FLOAT_MAT2:
                return 'uniformMatrix2fv';
            case WebGLRenderingContext.FLOAT_MAT3:
                return 'uniformMatrix3fv';
            case WebGLRenderingContext.FLOAT_MAT4:
                return 'uniformMatrix4fv';

            case WebGLRenderingContext.SAMPLER_2D:
                return 'uniform1i';
            case WebGLRenderingContext.SAMPLER_CUBE:
                return 'uniform1i';
        }
    }
}