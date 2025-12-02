/**
 * Cross SDK CDN Entry Point
 * Exports all Cross SDK functionality for browser usage
 */
import {
  AccountController,
  ChainController,
  ConnectionController,
  ConnectorUtil,
  ConstantsUtil,
  CoreHelperUtil,
  type CrossSdkParams,
  type Metadata,
  OptionsController,
  SendController,
  UniversalProvider,
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  createDefaultSIWXConfig,
  etherMainnet,
  etherTestnet,
  initCrossSdk,
  initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  roninMainnet,
  roninTestnet,
  sdkVersion,
  useAppKitWallet
} from '@to-nexus/sdk'

// Export all SDK functionality
export {
  initCrossSdk,
  initCrossSdkWithParams,
  useAppKitWallet,
  createDefaultSIWXConfig,
  ConnectionController,
  ConnectorUtil,
  SendController,
  AccountController,
  ChainController,
  CoreHelperUtil,
  OptionsController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  kaiaMainnet,
  kaiaTestnet,
  etherMainnet,
  etherTestnet,
  roninMainnet,
  roninTestnet,
  UniversalProvider,
  ConstantsUtil,
  sdkVersion
}

// Export types
export type { CrossSdkParams, Metadata }

declare global {
  interface Window {
    CrossSdk: {
      initCrossSdk: typeof initCrossSdk
      initCrossSdkWithParams: typeof initCrossSdkWithParams
      useAppKitWallet: typeof useAppKitWallet
      createDefaultSIWXConfig: typeof createDefaultSIWXConfig
      ConnectionController: typeof ConnectionController
      ConnectorUtil: typeof ConnectorUtil
      SendController: typeof SendController
      AccountController: typeof AccountController
      ChainController: typeof ChainController
      CoreHelperUtil: typeof CoreHelperUtil
      OptionsController: typeof OptionsController
      crossMainnet: typeof crossMainnet
      crossTestnet: typeof crossTestnet
      bscMainnet: typeof bscMainnet
      bscTestnet: typeof bscTestnet
      kaiaMainnet: typeof kaiaMainnet
      kaiaTestnet: typeof kaiaTestnet
      etherMainnet: typeof etherMainnet
      etherTestnet: typeof etherTestnet
      roninMainnet: typeof roninMainnet
      roninTestnet: typeof roninTestnet
      UniversalProvider: typeof UniversalProvider
      ConstantsUtil: typeof ConstantsUtil
      sdkVersion: typeof sdkVersion
    }
  }
}

// Assign to window.CrossSdk for global access
if (typeof window !== 'undefined') {
  window.CrossSdk = {
    initCrossSdk,
    initCrossSdkWithParams,
    useAppKitWallet,
    createDefaultSIWXConfig,
    ConnectionController,
    ConnectorUtil,
    SendController,
    AccountController,
    ChainController,
    CoreHelperUtil,
    OptionsController,
    crossMainnet,
    crossTestnet,
    bscMainnet,
    bscTestnet,
    kaiaMainnet,
    kaiaTestnet,
    etherMainnet,
    etherTestnet,
    roninMainnet,
    roninTestnet,
    UniversalProvider,
    ConstantsUtil,
    sdkVersion
  }
}
