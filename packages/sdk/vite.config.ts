import { defineConfig } from 'vite';
import path from 'path';

const bundleInternally = new Set([
  "@reown/appkit-adapter-bitcoin",
  "@reown/appkit-adapter-polkadot",
  "@reown/appkit-adapter-solana",
  "@reown/appkit-adapter-wagmi",
  "@reown/appkit-cdn",
  "@reown/appkit-cli",
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

function isInternal(id: string) {
  // Extract package name from import path
  const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)\//)
  const pkg = match?.[1] ?? id;

  return bundleInternally.has(pkg) || 
         Array.from(bundleInternally).some(internal => pkg.startsWith(`${internal}/`));
}

export default defineConfig({
  build: {
    lib: {
      entry: {
        'index': path.resolve(__dirname, 'exports/index.ts'),
        'react': path.resolve(__dirname, 'exports/react.ts')
      },
      name: 'CrossSDK',
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: (id) => {
        // Don't externalize the entry point
        if (id === path.resolve(__dirname, 'exports/index.ts') || 
            id === path.resolve(__dirname, 'src/react.ts')) {
          return false;
        }
        
        // Don't externalize local files
        if (id.startsWith('.') || id.startsWith('/') || id.startsWith(process.cwd())) {
          return false;
        }
        
        // Don't externalize internal packages
        if (isInternal(id)) {
          return false;
        }
        
        // Externalize everything else
        return true;
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: "exports",
        dir: 'dist/esm',
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
      }
    }
  }
});