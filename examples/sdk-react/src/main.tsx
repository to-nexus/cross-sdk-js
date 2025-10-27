import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sdkVersion } from '@to-nexus/sdk'
import { WagmiProvider } from 'wagmi'

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'

import App from './app.jsx'
import './assets/main.css'

;(window as any).__nexus = {
  sdkVersion
}

// MetaMask용 Reown 프로젝트 ID (cross-stake-fe와 동일)
const metamaskProjectId = 'a48aa6e93d89fbc0f047637579e65356'

// Wagmi Adapter 생성 (MetaMask용)
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, sepolia],
  projectId: metamaskProjectId
})

// MetaMask용 AppKit 생성 (고유 instanceId로 Cross SDK와 격리)
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia],
  projectId: metamaskProjectId,
  features: {
    analytics: false, // analytics 비활성화로 SVG 이슈 방지
    email: false, // 이메일 로그인 비활성화
    socials: false // 소셜 로그인 비활성화
  },
  themeMode: 'dark',
  allWallets: 'HIDE', // All Wallets 버튼 숨김
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96' // MetaMask
  ],
  // @ts-ignore - instanceId는 @reown/appkit에서 공식 지원하지 않지만 내부적으로 작동
  instanceId: 'reown-metamask-appkit',
  // @ts-ignore - modalZIndex도 추가
  modalZIndex: 9000
})

// QueryClient 생성 (Wagmi를 위해 필요)
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
