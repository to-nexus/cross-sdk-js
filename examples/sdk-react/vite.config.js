import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/react/' : '/',
  define: {
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.VITE_NODE_ENV || 'development')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: [
      {
        // SDK 패키지의 서브패스를 직접 파일 경로로 매핑
        find: /^@to-nexus\/sdk\/react$/,
        replacement: path.resolve(__dirname, '../../packages/sdk/dist/esm/react.js')
      },
      {
        find: /^@to-nexus\/sdk$/,
        replacement: path.resolve(__dirname, '../../packages/sdk/dist/esm/index.js')
      }
    ]
  },
  server: {
    // 필요한 경우 HMR 관련 설정 추가
    hmr: {
      // 워크스페이스 패키지의 변경 사항을 감지하도록 설정
      clientPort: 3012
    }
  }
})
