import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@to-nexus/webapp': resolve(__dirname, '../../packages/webapp/src/index.ts')
    }
  },
  server: {
    port: 5174,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});

