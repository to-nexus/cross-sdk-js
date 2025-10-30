import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import { initCrossSdk } from '@to-nexus/sdk/react'
import { WagmiProvider } from 'wagmi'

import App from './app.jsx'
import './assets/main.css'

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
  networks: [...networks]
})

initCrossSdk(projectId, 'http://localhost:3014', metadata, 'dark', crossMainnet, [wagmiAdapter])

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
