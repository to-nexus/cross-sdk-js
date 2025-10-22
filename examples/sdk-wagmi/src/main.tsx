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
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [crossTestnet.id]: http(),
    [crossMainnet.id]: http(),
    [kaia.id]: http(),
    [kaiaTestnet.id]: http()
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
