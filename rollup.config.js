import typescript from '@rollup/plugin-typescript';
import commonjs from 'rollup-plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.ts',
    output: {
        dir: 'public',
        format: 'cjs'
    },
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: true
        }),
        commonjs(),
        typescript()
    ]
};