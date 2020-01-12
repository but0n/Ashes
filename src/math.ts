export { vec2, vec3, vec4, mat3, mat4, quat } from "../node_modules/gl-matrix/lib/gl-matrix";
import { vec2, vec3, vec4, mat3, mat4, quat } from "../node_modules/gl-matrix/lib/gl-matrix";

export class vec3Pool {
    private static pool = [];
    static create() {
        if(this.pool.length) {
            return this.pool.pop();
        }
        return vec3.create();
    }
    static delete(vec) {
        vec3.set(vec, 0, 0, 0);
        this.pool.push(vec);
    }
}