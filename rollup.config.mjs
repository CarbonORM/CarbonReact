import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import includePaths from 'rollup-plugin-includepaths';
import simplevars from 'postcss-simple-vars';
import nested from 'postcss-nested';
import autoprefixer from 'autoprefixer';

import {readFileSync} from "fs";

const pkg = JSON.parse(readFileSync('package.json', {encoding: 'utf8'}));
const config = JSON.parse(readFileSync('tsconfig.json', {encoding: 'utf8'}));

// @link https://stackoverflow.com/questions/63128597/how-to-get-rid-of-the-rollup-plugin-typescript-rollup-sourcemap-option-must
//const production = !process.env.ROLLUP_WATCH;

const postCss = postcss({
    sourceMap: true,
    plugins: [
        autoprefixer(),
        simplevars(),
        nested()
    ],
    extensions: ['.css'],
    extract: true,
    modules: true,
    syntax: 'postcss-scss',
    use: ['sass'],
})


const plugins = [
    includePaths({paths: [config.compilerOptions.baseUrl]}),
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
        sourceMap: true, // !production,
        inlineSources: false, // !production
    }),
    postCss
]

// noinspection JSUnresolvedReference
const externals = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ///.*\\.scss$/
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
            name: 'CarbonReact',
            file: pkg.browser,
            format: 'umd',
            globals: globals,
            sourcemap: true
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
            {file: pkg.main, format: 'cjs', sourcemap: true},
            {preserveModules: true, dir: pkg.module, format: 'es', sourcemap: true}
        ]
    }
];
