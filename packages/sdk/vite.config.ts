import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        react: resolve(__dirname, 'src/react.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'ethers',
        '@reown/appkit',
        '@reown/appkit-adapter-ethers',
        '@reown/appkit/networks',
        '@reown/appkit/react',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          ethers: 'ethers',
        },
      },
    },
  },
}) 