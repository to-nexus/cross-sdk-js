import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sdkVersion } from '@to-nexus/sdk'
import { WagmiProvider } from 'wagmi'

import App from './app.jsx'
import './assets/main.css'
import { wagmiConfig } from './wagmi-config'

;(window as any).__nexus = {
  sdkVersion
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
