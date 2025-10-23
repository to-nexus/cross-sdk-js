import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@to-nexus/appkit'
import { WagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'
import { http } from 'viem'
import { bsc, bscTestnet, mainnet, sepolia } from 'viem/chains'
import { WagmiProvider } from 'wagmi'

import App from './app.jsx'
import './assets/main.css'
import { crossExtensionConnector } from './utils/custom-injected'
import { crossMainnet, crossTestnet, kaia, kaiaTestnet } from './wagmi-config'

// WalletConnect project ID
const projectId = import.meta.env['VITE_PROJECT_ID'] || 'YOUR_PROJECT_ID'

// Metadata
const metadata = {
  name: 'Cross SDK Wagmi Example',
  description: 'Cross SDK with Wagmi Integration',
  url: 'http://localhost:3014',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

// Networks 설정
const networks = [
  mainnet,
  sepolia,
  bsc,
  bscTestnet,
  crossTestnet,
  crossMainnet,
  kaia,
  kaiaTestnet
] as const

// WagmiAdapter 생성
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [...networks],
  transports: {
    [mainnet.id]: http(
      'https://eth-mainnet.crosstoken.io/fad29a23391f6d6e8fb41fb8eecbcca82343b378',
      {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 30_000
      }
    ),
    [sepolia.id]: http('https://sepolia.crosstoken.io/8de52516c154dce8cc2ceaae39d657a1e1e74d2f', {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [bsc.id]: http('https://bsc-mainnet.crosstoken.io/2272489872e4f1475ff25d57ce93b51989f933c7', {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [bscTestnet.id]: http(
      'https://bsc-testnet.crosstoken.io/110ea3628b77f244e5dbab16790d81bba874b962',
      {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 30_000
      }
    ),
    [crossTestnet.id]: http('https://testnet.crosstoken.io:22001', {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [crossMainnet.id]: http('https://mainnet.crosstoken.io:22001', {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [kaia.id]: http(
      'https://kaia-mainnet-ext.crosstoken.io/815b8a6e389b34a4f82cfd1e501692dee2f4e8f5',
      {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 30_000
      }
    ),
    [kaiaTestnet.id]: http(
      'https://kaia-testnet.crosstoken.io/fda0d5a47e2d0768e9329444295a3f0681fff365',
      {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 30_000
      }
    )
  },
  // ✅ Cross Extension Connector 추가
  connectors: [crossExtensionConnector()]
})

// AppKit 생성 (Cross SDK + Wagmi 통합)
createAppKit({
  adapters: [wagmiAdapter],
  networks: [...networks],
  projectId,
  metadata,
  defaultNetwork: crossTestnet,
  features: {
    analytics: false, // ✅ Analytics 비활성화 (CORS 오류 방지)
    email: false,
    socials: false,
    emailShowWallets: false
  },
  // ✅ Cross Extension을 UI에 표시
  customWallets: [
    {
      id: 'cross-extension',
      name: 'Cross Extension',
      image_url: 'https://contents.crosstoken.io/wallet/token/images/CROSSx.svg',
      mobile_link: 'crossx://',
      desktop_link: undefined,
      webapp_link: undefined,
      app_store: 'https://apps.apple.com/us/app/crossx-games/id6741250674',
      play_store: 'https://play.google.com/store/apps/details?id=com.nexus.crosswallet',
      rdns: 'nexus.to.crosswallet.desktop',
      injected: [
        {
          injected_id: 'nexus.to.crosswallet.desktop'
        }
      ]
    }
  ]
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
