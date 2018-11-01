export class Mesh {
    constructor() {

    }
}

export class MeshAttribute {
    data: number | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer;
    size: number;
    type: number;
    normalized: boolean = false;
    stride: number = 0;
    offset: number = 0;
    usage: number = WebGL2RenderingContext.STATIC_DRAW;
}