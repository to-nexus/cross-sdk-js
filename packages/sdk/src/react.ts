import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import {
  AccountController,
  ApiController,
  ConnectionController,
  ConstantsUtil,
  SendController,
  type ThemeMode
} from '@to-nexus/appkit-core'
import type { AppKitNetwork } from '@to-nexus/appkit/networks'
import { bscMainnet, bscTestnet, crossMainnet, crossTestnet } from '@to-nexus/appkit/networks'
import {
  type AppKit as AppKitType,
  createAppKit,
  getUniversalProvider,
  useAppKit,
  useAppKitAccount,
  useAppKitEvents,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
  useAppKitTheme,
  useAppKitWallet,
  useDisconnect,
  useWalletInfo
} from '@to-nexus/appkit/react'
import UniversalProvider from '@to-nexus/universal-provider'

export type {
  SendTransactionArgs,
  WriteContractArgs,
  AssetFilterType,
  SignTypedDataV4Args,
  TypedDataDomain,
  TypedDataTypes,
  TypedDataField
} from '@to-nexus/appkit-core'

const ethersAdapter = new EthersAdapter()

export type Metadata = {
  name: string
  description: string
  url: string
  icons: string[]
}

type SupportedNetworks =
  | typeof crossTestnet
  | typeof crossMainnet
  | typeof bscTestnet
  | typeof bscMainnet

const defaultMetadata: Metadata = {
  name: 'Cross SDK',
  description: 'Cross SDK for React',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/wallet/token/images/CROSSx.svg']
}

export type CrossSdkParams = {
  projectId: string
  redirectUrl?: string
  metadata?: Metadata
  themeMode?: ThemeMode
}

const initCrossSdkWithParams = (params: CrossSdkParams) => {
  const { projectId, redirectUrl, metadata, themeMode } = params

  return initCrossSdk(projectId, redirectUrl, metadata, themeMode)
}

// Create modal
const initCrossSdk = (
  projectId: string,
  redirectUrl?: string,
  metadata?: Metadata,
  themeMode?: ThemeMode,
  defaultNetwork?: SupportedNetworks
) => {
  const mergedMetadata = {
    ...defaultMetadata,
    ...metadata,
    redirect: {
      universal: redirectUrl
    }
  }

  // 기존 코드 수정
  const changeNetwork = () => {
    const allNetworks = [crossMainnet, crossTestnet, bscTestnet, bscMainnet]

    if (!defaultNetwork?.id) {
      return allNetworks as unknown as [AppKitNetwork, ...AppKitNetwork[]]
    }

    const matchedNetwork = allNetworks.find(network => network.id === defaultNetwork.id)
    const otherNetworks = allNetworks.filter(network => network.id !== defaultNetwork.id)

    return (matchedNetwork ? [matchedNetwork, ...otherNetworks] : allNetworks) as unknown as [
      AppKitNetwork,
      ...AppKitNetwork[]
    ]
  }

  const networks = changeNetwork()

  return createAppKit({
    adapters: [ethersAdapter],
    networks,
    defaultNetwork,
    metadata: mergedMetadata,
    projectId,
    themeMode: themeMode || 'light',
    features: {
      swaps: false,
      onramp: false,
      receive: false,
      send: false,
      email: false,
      emailShowWallets: false,
      socials: false,
      history: false,
      analytics: false,
      legalCheckbox: false
    },
    enableCoinbase: false,
    customWallets: [
      {
        id: 'cross_wallet',
        name: 'Cross Wallet',
        image_url: 'https://contents.crosstoken.io/wallet/token/images/CROSSx.svg',
        mobile_link: 'crossx://',
        app_store: 'https://apps.apple.com/us/app/crossx-games/id6741250674',
        play_store: 'https://play.google.com/store/apps/details?id=com.nexus.crosswallet'
      }
    ],
    allWallets: 'HIDE'
  })
}

// Create modal
const initChainNetwork = (
  projectId: string,
  redirectUrl?: string,
  metadata?: Metadata,
  themeMode?: ThemeMode,
  defaultNetwork?: SupportedNetworks
) => {
  const mergedMetadata = {
    ...defaultMetadata,
    ...metadata,
    redirect: {
      universal: redirectUrl
    }
  }

  console.log('###?? initCrossSdk : defaultNetwork ', defaultNetwork)

  const changeNetwork = () => {
    const allNetworks = [crossMainnet, crossTestnet, bscTestnet, bscMainnet]

    if (!defaultNetwork?.id) {
      return allNetworks as unknown as [AppKitNetwork, ...AppKitNetwork[]]
    }

    const matchedNetwork = allNetworks.find(network => network.id === defaultNetwork.id)
    const otherNetworks = allNetworks.filter(network => network.id !== defaultNetwork.id)

    return (matchedNetwork ? [matchedNetwork, ...otherNetworks] : allNetworks) as unknown as [
      AppKitNetwork,
      ...AppKitNetwork[]
    ]
  }

  const networks = changeNetwork()

  return createAppKit({
    adapters: [ethersAdapter],
    networks,
    defaultNetwork,
    metadata: mergedMetadata,
    projectId,
    themeMode: themeMode || 'light',
    features: {
      swaps: false,
      onramp: false,
      receive: false,
      send: false,
      email: false,
      emailShowWallets: false,
      socials: false,
      history: false,
      analytics: false,
      legalCheckbox: false
    },
    enableCoinbase: false,
    customWallets: [
      {
        id: 'cross_wallet',
        name: 'Cross Wallet',
        image_url: 'https://contents.crosstoken.io/wallet/token/images/CROSSx.svg',
        mobile_link: 'crossx://',
        app_store: 'https://apps.apple.com/us/app/crossx-games/id6741250674',
        play_store: 'https://play.google.com/store/apps/details?id=com.nexus.crosswallet'
      }
    ],
    allWallets: 'HIDE'
  })
}

export {
  initCrossSdkWithParams,
  initCrossSdk,
  initChainNetwork,
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
  ApiController,
  AccountController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  UniversalProvider,
  getUniversalProvider,
  ConstantsUtil,
  type AppKitType
}
