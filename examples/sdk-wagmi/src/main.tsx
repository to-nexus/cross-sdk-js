import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { crossMainnet } from '@to-nexus/appkit/networks'
import { ConstantsUtil, initCrossSdk } from '@to-nexus/sdk/react'

import { mainnet } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'

import App from './app.jsx'
import './assets/main.css'
import WalletProvider from './providers/WalletProvider'
import {
  crossSdkProjectId,
  networks,
  projectId,
  sdkWagmiAdapter,
  siwxConfig,
  wagmiAdapter
} from './utils/wagmi-utils'

// ========================================
// 1. Reown AppKit 초기화 (MetaMask용)
// ========================================
if (!projectId) {
  throw new Error('Reown AppKit Project ID is missing')
}

createAppKit({
  adapters: [wagmiAdapter], // ← MetaMask용 adapter 전달 (중요!)
  projectId: projectId,
  networks: networks as any, // Type assertion for tuple requirement
  defaultNetwork: crossMainnet, // Cross Mainnet을 기본으로 설정
  metadata: {
    name: 'Cross Wagmi SDK Example',
    description: 'Cross SDK with Wagmi Integration - Dual Wallet Support',
    url: 'http://localhost:3014',
    icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false
  },
  themeVariables: {
    '--w3m-accent': '#00D5AA'
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: false
})

console.log('✅ Reown AppKit initialized for MetaMask')

// ========================================
// 2. CROSS SDK 초기화 (CrossWallet용)
// ========================================
if (!crossSdkProjectId) {
  throw new Error('Cross SDK Project ID is missing')
}

initCrossSdk(
  crossSdkProjectId,
  'http://localhost:3014',
  {
    name: 'Cross Wagmi SDK Example',
    description: 'Cross SDK with Wagmi Integration - Dual Wallet Support',
    url: 'http://localhost:3014',
    icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
  },
  'dark', // theme
  crossMainnet, // default network
  [sdkWagmiAdapter], // ← CrossWallet용 adapter 전달 (중요!)
  ConstantsUtil.getUniversalLink(), // ← Universal Link (환경변수 또는 기본값)
  siwxConfig // ✅ SIWX 설정 추가 - Connect + Auth 기능 활성화!
)

console.log('✅ Cross SDK initialized for CrossWallet')

// ========================================
// 3. React 앱 렌더링
// ========================================
const queryClient = new QueryClient()

// 클라이언트 쿠키에서 현재 지갑 읽기
function getCurrentWalletFromCookie(): 'cross_wallet' | 'metamask' | undefined {
  if (typeof document === 'undefined') return undefined

  const cookies = document.cookie.split(';')
  const walletCookie = cookies.find(c => c.trim().startsWith('currentWallet='))
  const value = walletCookie?.split('=')[1]

  if (value === 'cross_wallet' || value === 'metamask') {
    return value
  }

  return undefined
}

const initialWallet = getCurrentWalletFromCookie()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WalletProvider currentWalletCookie={initialWallet}>
        <App />
      </WalletProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
