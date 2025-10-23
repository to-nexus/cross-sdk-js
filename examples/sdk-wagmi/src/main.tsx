import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@to-nexus/appkit'
import { WagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'
import {
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  kaiaMainnet,
  kaiaTestnet
} from '@to-nexus/appkit/networks'
import { http } from 'viem'
import { WagmiProvider } from 'wagmi'

import App from './app.jsx'
import './assets/main.css'
import { crossExtensionConnector } from './utils/custom-injected'

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
  etherMainnet,
  etherTestnet,
  bscMainnet,
  bscTestnet,
  crossTestnet,
  crossMainnet,
  kaiaMainnet,
  kaiaTestnet
] as const

// WagmiAdapter 생성
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [...networks],
  transports: {
    [etherMainnet.id]: http(etherMainnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [etherTestnet.id]: http(etherTestnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [bscMainnet.id]: http(bscMainnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [bscTestnet.id]: http(bscTestnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [crossTestnet.id]: http(crossTestnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [crossMainnet.id]: http(crossMainnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [kaiaMainnet.id]: http(kaiaMainnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    }),
    [kaiaTestnet.id]: http(kaiaTestnet.rpcUrls.default.http[0], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000
    })
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
