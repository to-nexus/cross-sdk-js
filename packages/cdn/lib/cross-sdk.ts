/**
 * Cross SDK CDN Entry Point
 * Exports all Cross SDK functionality for browser usage
 */
import {
  initCrossSdk,
  initCrossSdkWithParams,
  useAppKitWallet,
  ConnectionController,
  SendController,
  AccountController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  UniversalProvider,
  ConstantsUtil,
  type CrossSdkParams,
  type Metadata
  // @ts-ignore
} from '@to-nexus/sdk'

// Export all SDK functionality
export {
  initCrossSdk,
  initCrossSdkWithParams,
  useAppKitWallet,
  ConnectionController,
  SendController,
  AccountController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  UniversalProvider,
  ConstantsUtil
}

// Export types
export type { CrossSdkParams, Metadata }

declare global {
  interface Window {
    CrossSdk: {
      initCrossSdk: typeof initCrossSdk
      initCrossSdkWithParams: typeof initCrossSdkWithParams
      useAppKitWallet: typeof useAppKitWallet
      ConnectionController: typeof ConnectionController
      SendController: typeof SendController
      AccountController: typeof AccountController
      crossMainnet: typeof crossMainnet
      crossTestnet: typeof crossTestnet
      bscMainnet: typeof bscMainnet
      bscTestnet: typeof bscTestnet
      UniversalProvider: typeof UniversalProvider
      ConstantsUtil: typeof ConstantsUtil
    }
  }
}

// Assign to window.CrossSdk for global access
if (typeof window !== 'undefined') {
  window.CrossSdk = {
    initCrossSdk,
    initCrossSdkWithParams,
    useAppKitWallet,
    ConnectionController,
    SendController,
    AccountController,
    crossMainnet,
    crossTestnet,
    bscMainnet,
    bscTestnet,
    UniversalProvider,
    ConstantsUtil
  }
} 