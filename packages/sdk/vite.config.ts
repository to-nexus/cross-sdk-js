import { defineConfig } from 'vite';
import path from 'path';

const bundleInternally = new Set([
  "@reown/appkit",
  "@reown/appkit-adapter-ethers",
  "@reown/appkit-adapter-bitcoin",
  "@reown/appkit-adapter-polkadot",
  "@reown/appkit-adapter-solana",
  "@reown/appkit-adapter-wagmi",
  "@reown/appkit-cdn",
  "@reown/appkit-cli",
  "@reown/appkit-common",
  "@reown/appkit-core",
  "@reown/appkit-experimental",
  "@reown/appkit-polyfills",
  "@reown/appkit-scaffold-ui",
  "@reown/appkit-siwe",
  "@reown/appkit-siwx",
  "@reown/appkit-ui",
  "@reown/appkit-ui-new",
  "@reown/appkit-utils",
  "@reown/appkit-wallet",
  "@reown/appkit-wallet-button",
]);

function isInternal(id: string) {
  // 노드 모듈 경로로 들어온 경우 추출
  const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)\//)
  const pkg = match?.[1] ?? id

  for (const internal of bundleInternally) {
    if (pkg === internal || pkg.startsWith(`${internal}/`)) return true
  }

  return false
}

const entryPath = path.resolve(__dirname, 'exports/index.ts')

export default defineConfig({
  resolve: {
    alias: {
      '@reown/appkit/react': path.resolve(__dirname, '../appkit/exports/react.ts'),
      '@reown/appkit': path.resolve(__dirname, '../appkit/exports'),
      '@reown/appkit-adapter-ethers': path.resolve(__dirname, '../adapters/ethers/src'),
      '@reown/appkit-adapter-bitcoin': path.resolve(__dirname, '../adapters/bitcoin/src'),
      '@reown/appkit-adapter-polkadot': path.resolve(__dirname, '../adapters/polkadot/src'),
      '@reown/appkit-adapter-solana': path.resolve(__dirname, '../adapters/solana/src'),
      '@reown/appkit-adapter-wagmi': path.resolve(__dirname, '../adapters/wagmi/src'),
      '@reown/appkit-cdn': path.resolve(__dirname, '../cdn/src'),
      '@reown/appkit-cli': path.resolve(__dirname, '../cli/src'),
      '@reown/appkit-common': path.resolve(__dirname, '../common/src'),
      '@reown/appkit-core/react': path.resolve(__dirname, '../core/exports/react.ts'),
      '@reown/appkit-core': path.resolve(__dirname, '../core/exports/index.ts'),
      '@reown/appkit-experimental': path.resolve(__dirname, '../experimental/src'),
      '@reown/appkit-polyfills': path.resolve(__dirname, '../polyfills/index.ts'),
      '@reown/appkit-scaffold-ui': path.resolve(__dirname, '../scaffold-ui/exports'),
      '@reown/appkit-siwe': path.resolve(__dirname, '../siwe/src'),
      '@reown/appkit-siwx': path.resolve(__dirname, '../siwx/src'),
      '@reown/appkit-ui': path.resolve(__dirname, '../ui/src/index.ts'),
      '@reown/appkit-ui-new': path.resolve(__dirname, '../ui-new/src'),
      '@reown/appkit-utils/ethers': path.resolve(__dirname, '../appkit-utils/exports/ethers.ts'),
      '@reown/appkit-utils/solana': path.resolve(__dirname, '../appkit-utils/exports/solana.ts'),
      '@reown/appkit-utils': path.resolve(__dirname, '../appkit-utils/exports'),
      '@reown/appkit-wallet': path.resolve(__dirname, '../wallet/src'),
      '@reown/appkit-wallet-button': path.resolve(__dirname, '../wallet-button/src'),
    }
  },
  build: {
    lib: {
      entry: entryPath,
      name: 'CrossSDK',
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: (id) => {
        if (id === entryPath) return false
        if (id.startsWith('.') || id.startsWith('/') || id.startsWith(process.cwd())) {
          return false
        }
        const shouldInclude = isInternal(id)
        if (shouldInclude) {
          console.log('✅ internal bundle:', id)
          return false
        }
        // console.log('❌ externalize:', id)
        return true
      }
    }
  }
});
