import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
export default {
    input: 'src/ashes.ts',
    output: {
        format: 'umd',
        name: 'Ashes',
        file: 'build/ashes.main.js',
    },
    plugins: [
        typescript({
            typescript: require('typescript'),
        }),
    ],
}