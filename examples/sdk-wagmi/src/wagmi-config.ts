import { createConfig, http } from 'wagmi'
import { bsc, bscTestnet, mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

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

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, bsc, bscTestnet, crossTestnet, crossMainnet, kaia, kaiaTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: true
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
  }
})
