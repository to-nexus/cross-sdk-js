import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  define: {
    'process.env.NEXT_PUBLIC_SECURE_SITE_ORIGIN': JSON.stringify('https://secure.walletconnect.org'),
    'process.env.NEXT_PUBLIC_SECURE_SITE_SDK_URL': JSON.stringify('https://secure.walletconnect.org/sdk'),
    'process.env.NEXT_PUBLIC_DEFAULT_LOG_LEVEL': JSON.stringify('error'),
    'process.env.NEXT_PUBLIC_SECURE_SITE_SDK_VERSION': JSON.stringify('3')
  },
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'exports/index.ts'),
        react: path.resolve(__dirname, 'exports/react.ts')
      },
      name: 'CrossSDK',
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: (id, importer, isResolved) => {
        // entry 파일은 내부로 처리해야 함
        if (
          id.includes('exports/index.ts') ||
          id.includes('exports/react.ts')
        ) return false

         // 내부 상대 경로 or 절대 경로는 번들 포함
         if (id.startsWith('.') || path.isAbsolute(id)) return false

        // 나머지는 external
        return true
      },
      output: {
        preserveModules: false,
        dir: 'dist/esm'
      }
    }
  }
});
