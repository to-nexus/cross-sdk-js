import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CROSSxWebApp',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') {
          return 'crossx-webapp.esm.js';
        }
        return 'crossx-webapp.umd.js';
      }
    },
    outDir: 'dist/cdn',
    minify: 'terser'
  },
  server: {
    port: 5173,
    open: '/example.html'
  }
});

