import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
export default {
    input: 'source/index.ts',
    output: {
        format: 'umd',
        name: 'THHHHHHHH',
        file: 'build/ashes.main.js',
    },
    plugins: [
        typescript({
            typescript: require('typescript'),
        }),
    ],
}