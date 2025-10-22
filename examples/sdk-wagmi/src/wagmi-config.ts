import { createConfig, http } from 'wagmi'
import { bsc, bscTestnet, mainnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet, walletConnect } from 'wagmi/connectors'

import { crossExtensionConnector } from './utils/custom-injected'

// Cross Chain configurations
export const crossTestnet = {
  id: 612044,
  name: 'Cross Testnet',
  nativeCurrency: { name: 'CROSS', symbol: 'CROSS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.crossvaluescan.com'] }
  },
  blockExplorers: {
    default: { name: 'CrossValueScan', url: 'https://testnet.crossvaluescan.com' }
  },
  testnet: true
} as const

export const crossMainnet = {
  id: 612055,
  name: 'Cross Mainnet',
  nativeCurrency: { name: 'CROSS', symbol: 'CROSS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.crossvaluescan.com'] }
  },
  blockExplorers: {
    default: { name: 'CrossValueScan', url: 'https://mainnet.crossvaluescan.com' }
  }
} as const

export const kaia = {
  id: 8217,
  name: 'Kaia',
  nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://public-en.node.kaia.io'] }
  },
  blockExplorers: {
    default: { name: 'KaiaScan', url: 'https://kaiascan.io' }
  }
} as const

export const kaiaTestnet = {
  id: 1001,
  name: 'Kaia Testnet',
  nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://public-en-kairos.node.kaia.io'] }
  },
  blockExplorers: {
    default: { name: 'KaiaScan', url: 'https://kairos.kaiascan.io' }
  },
  testnet: true
} as const

// WalletConnect project ID
const projectId = import.meta.env['VITE_PROJECT_ID'] || 'YOUR_PROJECT_ID'

// Metadata for WalletConnect
const metadata = {
  name: 'Cross SDK Wagmi Example',
  description: 'Cross SDK with Wagmi Integration',
  url: 'http://localhost:3014',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, bsc, bscTestnet, crossTestnet, crossMainnet, kaia, kaiaTestnet],
  connectors: [
    // Cross Extension Wallet (커스텀 connector로 명시적 감지)
    crossExtensionConnector(),
    // WalletConnect v2 with QR modal
    walletConnect({
      projectId,
      metadata,
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '9999'
        }
      }
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0]
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [crossTestnet.id]: http(),
    [crossMainnet.id]: http(),
    [kaia.id]: http(),
    [kaiaTestnet.id]: http()
  },
  // EIP-6963을 통해 여러 injected provider를 자동으로 감지
  // MetaMask와 다른 EIP-6963 호환 지갑들이 자동으로 감지됨
  multiInjectedProviderDiscovery: true
})
