import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
export default {
    input: 'src/index.ts',
    output: {
        format: 'umd',
        file: 'build/ashes.main.js',
    },
    plugins: [
        typescript({
            typescript: require('typescript'),
        }),
    ],
}