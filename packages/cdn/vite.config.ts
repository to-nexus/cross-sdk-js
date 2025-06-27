import { resolve } from 'path'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@to-nexus/sdk/react': resolve(__dirname, '../sdk/dist/esm/react.js'),
      '@to-nexus/sdk': resolve(__dirname, '../sdk/dist/esm/index.js')
    }
  },
  build: {
    lib: {
      entry: {
        'cross-sdk': resolve(__dirname, 'lib/cross-sdk.ts'),
        'cross-sdk-react': resolve(__dirname, 'lib/cross-sdk-react.ts')
      },
      name: 'CrossSdk',
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log']
      },
      mangle: {
        toplevel: true
      },
      format: {
        comments: false,
        beautify: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true
      }
    })
  ]
})
