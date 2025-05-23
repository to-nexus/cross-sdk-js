/**
 * Due to some limitations on exporting multiple modules with UMD, we needed to export all of our modules in this file.
 * For now exporting only Wagmi and Solana adapters. Until we found a better workaround and need other adapters, we can keep it this way.
 */
import { createAppKit } from '@to-nexus/appkit'
import { SolanaAdapter } from '@to-nexus/appkit-adapter-solana'
import { WagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'
import '@reown/appkit-polyfills'
import * as AppKitNetworks from '@to-nexus/appkit/networks'

// -- Export Wagmi ------------------------------------------- //
export * as Viem from 'viem'
export * as Connectors from '@wagmi/connectors'
export * as WagmiCore from '@wagmi/core'

const networks = AppKitNetworks

export { createAppKit, networks, WagmiAdapter, SolanaAdapter }

declare global {
  interface Window {
    AppKit: {
      createAppKit: typeof createAppKit
      WagmiAdapter: typeof WagmiAdapter
      SolanaAdapter: typeof SolanaAdapter
      networks: typeof AppKitNetworks
    }
  }
}

// Assign to window.AppKit
if (typeof window !== 'undefined') {
  window.AppKit = {
    createAppKit,
    WagmiAdapter,
    SolanaAdapter,
    networks: AppKitNetworks
  }
}
