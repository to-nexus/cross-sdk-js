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

export default [
  // ES/CJS 빌드 (code-splitting 허용)
  {
    input,
    plugins,
    external: [
      '@to-nexus/sign-client',
      '@walletconnect/types',
      '@walletconnect/utils' /* 기타 외부 의존성들 */
    ],
    output: [
      {
        file: './dist/index.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: './dist/index.es.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      }
    ]
  }
]
