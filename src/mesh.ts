export class Mesh {
    accessor: MeshAttribute[];
    buffer;
    constructor(buffer) {
        this.buffer = buffer;
    }

    update() {
    }
}

export class MeshAttribute {
    name: string;
    data: number | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer;
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
    constructor(name, data:number | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer, size, type, normalized = false, stride = 0, offset = 0) {
        this.name = name;
        this.data = data;
        this.size = size;
        this.type = type;
        this.normalized = normalized;
        this.stride = stride;
        this.offset = offset;
    }
    update(gl: WebGL2RenderingContext, location) {
        // NOTE: You MUST bind the buffer which will be operate before call this method

        // Assume current buffer is already been bind
        gl.vertexAttribPointer(location, this.size, this.type, this.normalized, this.stride, this.offset);
        gl.enableVertexAttribArray(location);
    }
}