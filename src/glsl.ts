import basic_vs from "../res/shader/basic.vs.glsl"
import basic_fs from "../res/shader/basic.fs.glsl"
import stylize_vs from "../res/shader/stylize.vs.glsl"
import stylize_fs from "../res/shader/stylize.fs.glsl"
import vignetting_vs from "../res/shader/vignetting.vs.glsl"
import vignetting_fs from "../res/shader/vignetting.fs.glsl"

export let glsl = {
    basic: {
        vs: basic_vs,
        fs: basic_fs,
    },
    sylize: {
        vs: stylize_vs,
        fs: stylize_fs,
    },
    vignetting: {
        vs: vignetting_vs,
        fs: vignetting_fs,
    },
};