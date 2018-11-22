export class Mesh {
    accessors: Accessor[];
    bufferViews: bufferView[];

    indices: number;
    // Render mode
    mode: number;


    constructor(accessors: Accessor[], bufferViews: bufferView[], indices, mode) {
        this.accessors = accessors;
        this.bufferViews = bufferViews;
        this.indices = indices;
        this.mode = mode;
    }

    bindAccessorsVBO(gl: WebGL2RenderingContext, locationList) {
        for(let acc of this.accessors) {
            // Ignore indeces
            let loc = locationList[acc.attribute];
            if(acc.attribute && loc!=undefined) {
                let bufferView = this.bufferViews[acc.bufferView];
                bufferView.bindBuffer(gl);
                gl.enableVertexAttribArray(loc);
                let offset = acc.byteOffset;
                // let offset = bufferView.byteOffset + acc.byteOffset;
                gl.vertexAttribPointer(loc, acc.size, acc.componentType, acc.normalized, bufferView.byteStride, offset);
            } else {
                console.warn(`Attribute '${acc.attribute}' not found!`);
            }
        }
    }

    bindIndecesEBO(gl: WebGL2RenderingContext) {
        let acc = this.accessors[this.indices];
        let bufferView = this.bufferViews[acc.bufferView];
        bufferView.bindBuffer(gl);
    }

    drawElement(gl: WebGL2RenderingContext) {
        let acc = this.accessors[this.indices];
        let bufferView = this.bufferViews[acc.bufferView];
        // let offset = bufferView.byteOffset;
        let offset = acc.byteOffset;
        gl.drawElements(this.mode, acc.count, acc.componentType, offset);
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
    normalized: boolean;
    count: number;
    max: number[];
    min: number[];
    size: number;
    constructor({bufferView, byteOffset = 0, componentType, normalized = false, count, type, max, min}, name) {
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
}

export class bufferView {
    dataView: DataView;
    byteLength: number;
    byteOffset: number;
    byteStride: number;
    target: number;
    buffer: WebGLBuffer;
    constructor(rawData: ArrayBuffer, {byteOffset = 0, byteLength, byteStride = 0, target = 34962}) {
        // this.rawData = rawData;
        this.byteOffset = byteOffset;
        this.byteLength = byteLength;
        this.byteStride = byteStride;
        this.dataView = new DataView(rawData, this.byteOffset, this.byteLength);
        this.target = target;
    }
    updateBuffer(gl: WebGL2RenderingContext, usage = WebGL2RenderingContext.STATIC_DRAW) {
        if(this.buffer) {
            gl.deleteBuffer(this.buffer);
        }
        this.buffer = gl.createBuffer();
        gl.bindBuffer(this.target, this.buffer);
        gl.bufferData(this.target, this.dataView, usage);
    }
    bindBuffer(gl: WebGL2RenderingContext) {
        if(!this.buffer) {
            this.updateBuffer(gl);
        }
        gl.bindBuffer(this.target, this.buffer);
    }
}