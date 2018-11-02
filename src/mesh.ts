import { accessSync } from "fs";

export class Mesh {
    // database
    buffers: WebGLBuffer[];
    accessors: Accessor[];
    bufferViews: bufferView[];

    // reference
    attributes: {};
    indeces: number;
    // Render mode
    mode: number;


    constructor(buffers, accessors, bufferViews, indeces) {
        this.buffers = buffers;
        this.accessors = accessors;
        this.bufferViews = bufferViews;
        this.indeces = indeces;
    }

    bindAccessorsVBO(gl: WebGL2RenderingContext, locationList) {
        for(let acc of this.accessors) {
            // Ignore indeces
            let loc = locationList[acc.attribute];
            if(acc.attribute && loc) {
                let bufferView = this.bufferViews[acc.bufferView];
                gl.bindBuffer(bufferView.target, this.buffers[bufferView.buffer]);
                gl.enableVertexAttribArray(loc);
                let offset = bufferView.byteOffset + acc.byteOffset;
                gl.vertexAttribPointer(loc, acc.size, acc.componentType, false, bufferView.byteStride, offset);
            }
        }
    }

    bindIndecesEBO(gl: WebGL2RenderingContext) {
        let acc = this.accessors[this.indeces];
        let bufferView = this.bufferViews[acc.bufferView];
        gl.bindBuffer(bufferView.target, this.buffers[bufferView.buffer]);
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
    bufferView: number;
    byteOffset: number;
    componentType: number;
    count: number;
    max: number[];
    min: number[];
    size: number;
    constructor({bufferView, byteOffset = 0, componentType, count, max, min, type}, name) {
        this.attribute = name;
        this.bufferView = bufferView;
        this.byteOffset = byteOffset;
        this.componentType = componentType;
        this.count = count;
        this.max = max;
        this.min = min;
        this.size = Accessor.types[type];
    }
}

export class bufferView {
    buffer: number;
    byteLength: number;
    byteOffset: number;
    byteStride: number;
    target: number;
    constructor({buffer, byteLength, byteOffset, target, byteStride = 0}) {
        this.buffer = buffer;
        this.byteLength = byteLength;
        this.byteOffset = byteOffset;
        this.target = target;
        this.byteStride = byteStride;
    }
}