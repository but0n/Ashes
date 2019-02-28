import typescript from 'rollup-plugin-typescript2'
import glsl from 'rollup-plugin-glsl';
export default {
    input: 'src/ashes.ts',
    output: {
        format: 'umd',
        name: 'Ashes',
        file: 'build/ashes.main.js',
    },
    plugins: [
        glsl({
            include: 'res/**/*.glsl',
            sourceMap: false
        }),
        typescript({
            typescript: require('typescript'),
        }),
    ],
}