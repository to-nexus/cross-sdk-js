/**
 * Cross SDK CDN Entry Point
 * Exports all Cross SDK functionality for browser usage
 */
import {
  AccountController,
  ConnectionController,
  ConnectorUtil,
  ConstantsUtil,
  type CrossSdkParams,
  type Metadata,
  SendController,
  UniversalProvider,
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  initCrossSdk,
  initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  useAppKitWallet
} from '@to-nexus/sdk'

// Export all SDK functionality
export {
  initCrossSdk,
  initCrossSdkWithParams,
  useAppKitWallet,
  ConnectionController,
  ConnectorUtil,
  SendController,
  AccountController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  kaiaMainnet,
  kaiaTestnet,
  etherMainnet,
  etherTestnet,
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
      ConnectorUtil: typeof ConnectorUtil
      SendController: typeof SendController
      AccountController: typeof AccountController
      crossMainnet: typeof crossMainnet
      crossTestnet: typeof crossTestnet
      bscMainnet: typeof bscMainnet
      bscTestnet: typeof bscTestnet
      kaiaMainnet: typeof kaiaMainnet
      kaiaTestnet: typeof kaiaTestnet
      etherMainnet: typeof etherMainnet
      etherTestnet: typeof etherTestnet
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
    ConnectorUtil,
    SendController,
    AccountController,
    crossMainnet,
    crossTestnet,
    bscMainnet,
    bscTestnet,
    kaiaMainnet,
    kaiaTestnet,
    etherMainnet,
    etherTestnet,
    UniversalProvider,
    ConstantsUtil
  }
}
