import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from '@carbonorm/rollup-plugin-postcss';
import includePaths from 'rollup-plugin-includepaths';
import simpleVars from 'postcss-simple-vars';
import nested from 'postcss-nested';
import autoprefixer from 'autoprefixer';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const config = JSON.parse(readFileSync('tsconfig.json', 'utf8'));

const externals = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
];

// -------------------------
// Shared (safe) plugins
// -------------------------
const sharedPlugins = [
    includePaths({
        paths: [config.compilerOptions.baseUrl],
    }),
    typescript({
        declaration: true,
        sourceMap: true,
    }),
    postcss({
        sourceMap: true,
        plugins: [autoprefixer(), simpleVars(), nested()],
        extensions: ['.css', '.scss'],
        extract: true,
        modules: {
            localsConvention: 'all',
            generateScopedName: '[hash:base64:7]',
        },
        syntax: 'postcss-scss',
        use: ['sass'],
    }),
];

// -------------------------
// ESM build (SSR SAFE)
// -------------------------
const esmBuild = {
    input: 'src/index.ts',
    external: externals,
    plugins: [
        resolve({
            exportConditions: ['import'],
        }),
        ...sharedPlugins,
    ],
    output: {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
    },
};

// -------------------------
// CJS build (Node legacy)
// -------------------------
const cjsBuild = {
    input: 'src/index.ts',
    external: externals,
    plugins: [
        resolve({
            exportConditions: ['require'],
        }),
        commonjs({
            namedExports: {
                'react/jsx-runtime': ['jsx', 'jsxs', 'Fragment'],
            },
        }),
        ...sharedPlugins,
    ],
    output: {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
    },
};

export default [esmBuild, cjsBuild];
