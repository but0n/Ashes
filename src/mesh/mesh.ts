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
    static getFloat32Blocks(acc: Accessor) {
        let blocks = [];
        let data = Accessor.newFloat32Array(acc);
        for (let i = 0; i < acc.count; i++) {
            let offset = i * acc.size;
            blocks.push(data.slice(offset, offset + acc.size));
        }
        return blocks;
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
    constructor(rawData: ArrayBuffer, {byteOffset = 0, byteLength, byteStride = 0, target = 34962}) {
        this.rawBuffer = rawData;
        this.byteOffset = byteOffset;
        this.byteLength = byteLength;
        this.byteStride = byteStride;
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