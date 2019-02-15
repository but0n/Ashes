import { Mesh, bufferView, Accessor } from "./mesh";

export class QuadMesh extends Mesh {
    constructor() {
        let meshVBO = new Float32Array([
            -1, -1, 0, 0, 0, 0, 0, 1,
            1, -1, 0, 1, 0, 0, 0, 1,
            1, 1, 0, 1, 1, 0, 0, 1,
            -1, 1, 0, 0, 1, 0, 0, 1
        ]);
        let meshEBO = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);
        let vbo = new bufferView(meshVBO.buffer, {
            byteOffset: meshVBO.byteOffset,
            byteLength: meshVBO.byteLength,
            byteStride: 8*4,
            target: WebGL2RenderingContext.ARRAY_BUFFER
        });
        let ebo = new bufferView(meshEBO.buffer, {
            byteOffset: meshEBO.byteOffset,
            byteLength: meshEBO.byteLength,
            byteStride: 0,
            target: WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER
        });

        let position = new Accessor({
            bufferView: vbo,
            componentType: WebGL2RenderingContext.FLOAT,
            byteOffset: 0,
            type: "VEC3",
            count: 4
        }, 'POSITION');
        let uv = new Accessor({
            bufferView: vbo,
            componentType: WebGL2RenderingContext.FLOAT,
            byteOffset: 3 * 4,
            type: "VEC2",
            count: 4
        }, 'TEXCOORD_0');
        let normal = new Accessor({
            bufferView: vbo,
            componentType: WebGL2RenderingContext.FLOAT,
            byteOffset: 5 * 4,
            type: "VEC3",
            count: 4
        }, 'NORMAL');
        let indices = new Accessor({
            bufferView: ebo,
            componentType: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteOffset: 0,
            type: "SCALAR",
            count: 6
        });
        super([position, uv, normal], indices);

    }
}