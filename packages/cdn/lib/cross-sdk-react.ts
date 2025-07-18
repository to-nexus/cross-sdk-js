/**
 * Cross SDK React CDN Entry Point
 * Exports all Cross SDK React functionality for browser usage
 */
// @ts-ignore
import {
  initCrossSdk,
  initCrossSdkWithParams,
  useAppKit,
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
  useAppKitNetwork,
  useDisconnect,
  useAppKitProvider,
  useAppKitWallet,
  ConnectionController,
  SendController,
  AccountController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  UniversalProvider,
  getUniversalProvider,
  ConstantsUtil,
  type CrossSdkParams,
  type Metadata
  // @ts-ignore
} from '@to-nexus/sdk/react'

// Export all SDK React functionality
export {
  initCrossSdk,
  initCrossSdkWithParams,
  useAppKit,
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
  useAppKitNetwork,
  useDisconnect,
  useAppKitProvider,
  useAppKitWallet,
  ConnectionController,
  SendController,
  AccountController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  UniversalProvider,
  getUniversalProvider,
  ConstantsUtil
}

// Export types
export type { CrossSdkParams, Metadata }

declare global {
  interface Window {
    CrossSdkReact: {
      initCrossSdk: typeof initCrossSdk
      initCrossSdkWithParams: typeof initCrossSdkWithParams
      useAppKit: typeof useAppKit
      useAppKitState: typeof useAppKitState
      useAppKitTheme: typeof useAppKitTheme
      useAppKitEvents: typeof useAppKitEvents
      useAppKitAccount: typeof useAppKitAccount
      useWalletInfo: typeof useWalletInfo
      useAppKitNetwork: typeof useAppKitNetwork
      useDisconnect: typeof useDisconnect
      useAppKitProvider: typeof useAppKitProvider
      useAppKitWallet: typeof useAppKitWallet
      ConnectionController: typeof ConnectionController
      SendController: typeof SendController
      AccountController: typeof AccountController
      crossMainnet: typeof crossMainnet
      crossTestnet: typeof crossTestnet
      bscMainnet: typeof bscMainnet
      bscTestnet: typeof bscTestnet
      UniversalProvider: typeof UniversalProvider
      getUniversalProvider: typeof getUniversalProvider
      ConstantsUtil: typeof ConstantsUtil
    }
  }
}

// Assign to window.CrossSdkReact for global access
if (typeof window !== 'undefined') {
  window.CrossSdkReact = {
    initCrossSdk,
    initCrossSdkWithParams,
    useAppKit,
    useAppKitState,
    useAppKitTheme,
    useAppKitEvents,
    useAppKitAccount,
    useWalletInfo,
    useAppKitNetwork,
    useDisconnect,
    useAppKitProvider,
    useAppKitWallet,
    ConnectionController,
    SendController,
    AccountController,
    crossMainnet,
    crossTestnet,
    bscMainnet,
    bscTestnet,
    UniversalProvider,
    getUniversalProvider,
    ConstantsUtil
  }
} 