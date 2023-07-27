import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';

import {readFileSync} from "fs";

const pkg = JSON.parse(readFileSync('package.json', {encoding: 'utf8'}));

// @link https://stackoverflow.com/questions/63128597/how-to-get-rid-of-the-rollup-plugin-typescript-rollup-sourcemap-option-must
const production = !process.env.ROLLUP_WATCH;

const plugins = [
    resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    commonjs({
        namedExports: {
            // This is needed because react/jsx-runtime exports jsx on the module export.
            // Without this mapping the transformed import {jsx as _jsx} from 'react/jsx-runtime' will fail.
            'react/jsx-runtime': ['jsx', 'jsxs', 'Fragment'],
        },
    }),
    typescript({
        sourceMap: !production,
        inlineSources: !production
    }),
    postcss({
        plugins: [autoprefixer()],
        sourceMap: true,
        extract: true,
        minimize: true
    }),
]

// noinspection JSUnresolvedReference
const externals = [
    ...Object.keys(pkg.peerDependencies),
    ...Object.keys(pkg.dependencies)
]

console.log('externals', externals)

const globals = []

externals.forEach((external) => {

    globals[external] = external

})

console.log(globals)

export default [
    // browser-friendly UMD build
    {

        input: 'src/index.ts',
        external: externals,
        output: {
            name: 'carbonNode',
            file: pkg.browser,
            format: 'umd',
            globals: globals
        },
        plugins: plugins
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {

        input: 'src/index.ts',
        external: externals,
        plugins: plugins,
        output: [
            {file: pkg.main, format: 'cjs'},
            {preserveModules: true, dir: pkg.module, format: 'es'}
        ]
    }
];
