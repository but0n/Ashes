import { vec2, vec3, mat4, vec4, quat } from "../math";
export class Mesh {
    attributes: Accessor[]; // AKA Vertexes
    indices: Accessor;      // AKA Triangles
    // Render mode
    mode: number;


    constructor(attributes: Accessor[], indices: Accessor, mode = WebGL2RenderingContext.TRIANGLES) {
        this.attributes = attributes;
        this.indices = indices;
        this.mode = mode;
    }

    static bindAccessorsVBO(target: Mesh, gl: WebGL2RenderingContext, locationList) {
        for(let acc of target.attributes) {
            // Ignore indeces
            let loc = locationList[acc.attribute];
            if(acc.attribute && loc!=undefined) {
                bufferView.bindBuffer(acc.bufferView, gl);
                gl.enableVertexAttribArray(loc);
                let offset = acc.byteOffset;
                gl.vertexAttribPointer(loc, acc.size, acc.componentType, acc.normalized, acc.bufferView.byteStride, offset);
            } else {
                console.warn(`Attribute '${acc.attribute}' not found!`);
            }
        }
    }

    static bindIndecesEBO(target: Mesh, gl: WebGL2RenderingContext) {
        bufferView.bindBuffer(target.indices.bufferView, gl);
    }

    static drawElement(target: Mesh, gl: WebGL2RenderingContext) {
        let acc = target.indices;
        gl.drawElements(target.mode, acc.count, acc.componentType, acc.byteOffset);
    }

    static preComputeTangent(mesh: Mesh) {
        // http://www.opengl-tutorial.org/cn/intermediate-tutorials/tutorial-13-normal-mapping/
        // https://learnopengl-cn.readthedocs.io/zh/latest/05%20Advanced%20Lighting/04%20Normal%20Mapping/
        let indices = mesh.indices;
        let atts = {};
        for(let acc of mesh.attributes) {
            if(acc.attribute != 'POSITION' && acc.attribute != 'TEXCOORD_0')
                continue;
            let data = Accessor.newFloat32Array(acc);
            let chunks = Accessor.getSubChunks(acc, data);
            atts['_'+acc.attribute] = data;
            atts[acc.attribute] = chunks;
            if(acc.attribute == 'POSITION') {
                atts['_TANGENT'] = new Float32Array(data.length);
                atts['TANGENT'] = Accessor.getSubChunks(acc, atts['_TANGENT']);
            }
        }
        atts['i'] = Accessor.newUint16Array(indices);
        let pos: Float32Array[] = atts['POSITION'];
        let uv = atts['TEXCOORD_0'];
        let ind = atts['i'];
        let tangent = atts['TANGENT'];
        // Temp
        let edge1 = vec3.create();
        let edge2 = vec3.create();
        let duv1 = vec2.create();
        let duv2 = vec2.create();
        for(let i = 0, l = ind.length; i < l; i+=3) {
            let i0 = ind[i];
            let i1 = ind[i+1];
            let i2 = ind[i+2];
            let p1 = pos[i0];
            let p2 = pos[i1];
            let p3 = pos[i2];
            let uv1 = uv[i0];
            let uv2 = uv[i1];
            let uv3 = uv[i2];

            vec3.sub(edge1, p2, p1);
            vec3.sub(edge2, p3, p1);
            vec3.sub(duv1, uv2, uv1);
            vec3.sub(duv2, uv3, uv1);

            let tan = tangent[i0];

            let f = 1.0 / (duv1[0] * duv2[1] - duv2[0] * duv1[1]);

            tan[0] = f * (duv2[1] * edge1[0] - duv1[1] * edge2[0]);
            tan[1] = f * (duv2[1] * edge1[1] - duv1[1] * edge2[1]);
            tan[2] = f * (duv2[1] * edge1[2] - duv1[1] * edge2[2]);

            vec3.normalize(tan, tan);
            vec3.copy(tangent[i1], tan);
            vec3.copy(tangent[i2], tan);
        }

        let tangentBuffer = new bufferView();
        tangentBuffer.dataView = atts['_TANGENT'];
        mesh.attributes.push(new Accessor(
            {
                bufferView: tangentBuffer,
                byteOffset: 0,
                componentType: 5126,
                count: tangent.length,
                type: 'VEC3',
            },
            'TANGENT'
        ))

        // return atts;
    }

}

export class Accessor {
    static types = {
        "SCALAR": 1,
        'VEC1': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4,
        "MAT2": 4,
        "MAT3": 9,
        "MAT4": 16,
    };
    attribute: string;
    bufferView: bufferView;
    byteOffset: number;
    componentType: number;
    normalized: boolean;
    count: number;
    max: number[];
    min: number[];
    size: number;
    constructor({bufferView, byteOffset = 0, componentType, normalized = false, count, type, max = [], min = []}, name = '') {
        this.attribute = name;
        this.bufferView = bufferView;
        this.byteOffset = byteOffset;
        this.componentType = componentType;
        this.normalized = normalized;
        this.count = count;
        this.max = max;
        this.min = min;
        this.size = Accessor.types[type];
    }
    static newFloat32Array(acc: Accessor) {
        return new Float32Array(acc.bufferView.rawBuffer, acc.byteOffset + acc.bufferView.byteOffset, acc.size * acc.count);
    }
    static getSubChunks(acc, data) {
        let blocks = [];
        for (let i = 0; i < acc.count; i++) {
            let offset = i * acc.size;
            blocks.push(data.subarray(offset, offset + acc.size));
        }
        return blocks;
    }
    static getFloat32Blocks(acc: Accessor) {
        return this.getSubChunks(acc, Accessor.newFloat32Array(acc));
    }
    static newUint16Array(acc: Accessor) {
        return new Uint16Array(acc.bufferView.rawBuffer, acc.byteOffset + acc.bufferView.byteOffset, acc.size * acc.count);
    }
    static getUint16Blocks(acc: Accessor) {
        return this.getSubChunks(acc, Accessor.newUint16Array(acc));
    }
}

export class bufferView {
    rawBuffer: ArrayBuffer;
    dataView: DataView;
    byteLength: number;
    byteOffset: number;
    byteStride: number;
    target: number;
    buffer: WebGLBuffer = null;
    constructor(rawData?: ArrayBuffer, {byteOffset = 0, byteLength = 0, byteStride = 0, target = 34962} = {}) {
        this.rawBuffer = rawData;
        this.byteOffset = byteOffset;
        this.byteLength = byteLength;
        this.byteStride = byteStride;
        if(rawData)
            this.dataView = new DataView(rawData, this.byteOffset, this.byteLength);
        this.target = target;
    }
    static updateBuffer(bView: bufferView, gl: WebGL2RenderingContext, usage = WebGL2RenderingContext.STATIC_DRAW) {
        if(bView.buffer) {
            gl.deleteBuffer(bView.buffer);
        }
        bView.buffer = gl.createBuffer();
        gl.bindBuffer(bView.target, bView.buffer);
        gl.bufferData(bView.target, bView.dataView, usage);
    }
    static bindBuffer(bView: bufferView, gl: WebGL2RenderingContext) {
        if(!bView.buffer) {
            this.updateBuffer(bView, gl);
        }
        gl.bindBuffer(bView.target, bView.buffer);
    }
}