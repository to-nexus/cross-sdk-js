import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.VITE_NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: ['@reown/appkit'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
