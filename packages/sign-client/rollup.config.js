import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'

const input = './src/index.ts'
const plugins = [
  nodeResolve({ preferBuiltins: false, browser: true }),
  json(),
  commonjs(),
  esbuild({
    minify: false,
    tsconfig: './tsconfig.json',
    loaders: {
      '.json': 'json'
    }
  })
]

export default function createConfig(
  packageName,
  packageDependencies,
  umd = {},
  cjs = {},
  es = {}
) {
  return [
    {
      input,
      plugins,
      external: packageDependencies,
      output: [
        {
          file: './dist/index.cjs.js',
          format: 'cjs',
          exports: 'named',
          name: packageName,
          sourcemap: true,
          inlineDynamicImports: true,
          ...cjs
        },
        {
          file: './dist/index.es.js',
          format: 'es',
          exports: 'named',
          name: packageName,
          sourcemap: true,
          inlineDynamicImports: true,
          ...es
        }
      ]
    }
  ]
}
