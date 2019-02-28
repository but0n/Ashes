import { Filter } from "../filter";
import { Screen } from "../webgl2/screen";
import { Shader } from "../shader";
import { glsl } from "../glsl";

export class Vignetting extends Filter {
    constructor(screen: Screen, factor = 0.4, hardness = 1) {
        super(screen, new Shader(vig_vs, vig_fs, {
            FACTOR:     `float(${factor})`,
            HARDNESS:   `float(${hardness})`,
        }));
    }


}

let vig_vs = glsl.vignetting.vs;

let vig_fs = glsl.vignetting.fs;
