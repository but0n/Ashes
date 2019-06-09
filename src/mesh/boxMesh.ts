import { Mesh, bufferView, Accessor } from "./mesh";

export class BoxMesh extends Mesh {
    constructor(x = 1, y = 1, z = 1) {
        x/=2;
        y/=2;
        z/=2;
        let meshVBO = new Float32Array([
            //x x
            // \/\
            //  x x
            x, y, z,
            x, -y, z,
            x, y, -z,
            x, -y, -z,

            -x, y, z,
            -x, -y, z,
            -x, y, -z,
            -x, -y, -z,

        ]);
        let meshEBO = new Uint16Array([
            0, 1, 2,
            2, 1, 3,

            6, 7, 4,
            4, 7, 5,

            6, 4, 2,
            2, 4, 0,

            5, 7, 1,
            1, 7, 3,

            4, 5, 0,
            0, 5, 1,

            2, 3, 6,
            6, 3, 7,
        ]);
        let vbo = new bufferView(meshVBO.buffer, {
            byteOffset: meshVBO.byteOffset,
            byteLength: meshVBO.byteLength,
            byteStride: 3*4,
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
            count: 8
        }, 'POSITION');
        // TODO:
        // let uv = new Accessor({
        //     bufferView: vbo,
        //     componentType: WebGL2RenderingContext.FLOAT,
        //     byteOffset: 3 * 4,
        //     type: "VEC2",
        //     count: 4
        // }, 'TEXCOORD_0');
        // let normal = new Accessor({
        //     bufferView: vbo,
        //     componentType: WebGL2RenderingContext.FLOAT,
        //     byteOffset: 5 * 4,
        //     type: "VEC3",
        //     count: 4
        // }, 'NORMAL');
        let indices = new Accessor({
            bufferView: ebo,
            componentType: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteOffset: 0,
            type: "SCALAR",
            count: meshEBO.length
        });
        super([position], indices, WebGL2RenderingContext.LINES);

    }
}