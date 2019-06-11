import basic_vs from "../res/shader/basic.vs.glsl"
import basic_fs from "../res/shader/basic.fs.glsl"
import stylize_vs from "../res/shader/stylize.vs.glsl"
import stylize_fs from "../res/shader/stylize.fs.glsl"
import stylize2_vs from "../res/shader/stylize2.vs.glsl"
import stylize2_fs from "../res/shader/stylize2.fs.glsl"
import vignetting_vs from "../res/shader/vignetting.vs.glsl"
import vignetting_fs from "../res/shader/vignetting.fs.glsl"
import line_vs from "../res/shader/line.vs.glsl"
import line_fs from "../res/shader/line.fs.glsl"

export let glsl = {
    basic: {
        vs: basic_vs,
        fs: basic_fs,
    },
    stylize: {
        vs: stylize_vs,
        fs: stylize_fs,
    },
    stylize2: {
        vs: stylize2_vs,
        fs: stylize2_fs,
    },
    vignetting: {
        vs: vignetting_vs,
        fs: vignetting_fs,
    },
    line: {
        vs: line_vs,
        fs: line_fs,
    },
};