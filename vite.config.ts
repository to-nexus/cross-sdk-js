import { defineConfig } from 'vite';
import path from 'path';

const bundleInternally = new Set([
  "@reown/appkit",
  "@reown/appkit-adapter-ethers",
  "@reown/appkit-adapter-bitcoin",
  "@reown/appkit-adapter-polkadot",
  "@reown/appkit-adapter-solana",
  "@reown/appkit-adapter-wagmi",
  "@reown/appkit-utils",
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
  "@reown/appkit-wallet",
  "@reown/appkit-wallet-button",
]);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'packages/sdk/exports/index.ts'),
      name: 'CrossSDK',
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: (id) => {
        for (const pkg of bundleInternally) {
          if (id === pkg || id.startsWith(pkg + '/')) return false;
        }
        return true;
      }      
    }
  }
});
