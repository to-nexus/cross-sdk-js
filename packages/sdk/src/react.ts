import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import type { AppKitNetwork } from '@to-nexus/appkit-common'
import {
  AccountController,
  ApiController,
  ConnectionController,
  ConstantsUtil,
  SendController,
  type ThemeMode
} from '@to-nexus/appkit-core'
import type { CustomWallet } from '@to-nexus/appkit-core'
import {
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  kaiaMainnet,
  kaiaTestnet,
  networkList
} from '@to-nexus/appkit/networks'
import {
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
  | typeof crossMainnet
  | typeof crossTestnet
  | typeof bscMainnet
  | typeof bscTestnet
  | typeof kaiaMainnet
  | typeof kaiaTestnet
  | typeof etherMainnet
  | typeof etherTestnet

const defaultMetadata: Metadata = {
  name: 'Cross SDK',
  description: 'Cross SDK for React',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

export type CrossSdkParams = {
  projectId: string
  redirectUrl?: string
  metadata?: Metadata
  themeMode?: ThemeMode
  defaultNetwork?: SupportedNetworks
}

const initCrossSdkWithParams = (params: CrossSdkParams) => {
  const { projectId, redirectUrl, metadata, themeMode, defaultNetwork } = params

  return initCrossSdk(projectId, redirectUrl, metadata, themeMode, defaultNetwork)
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

  return createAppKit({
    adapters: [ethersAdapter],
    networks: networkList,
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
        name: 'CROSSx Wallet',
        image_url: 'https://contents.crosstoken.io/wallet/token/images/CROSSx.svg',
        mobile_link: 'crossx://',
        app_store: 'https://apps.apple.com/us/app/crossx-games/id6741250674',
        play_store: 'https://play.google.com/store/apps/details?id=com.nexus.crosswallet',
        chrome_store:
          'https://chromewebstore.google.com/detail/crossx/nninbdadmocnokibpaaohnoepbnpdgcg',

        rdns: 'nexus.to.crosswallet.desktop',
        injected: [
          {
            injected_id: 'nexus.to.crosswallet.desktop'
          }
        ]
      } as CustomWallet & { chrome_store?: string }
    ],
    allWallets: 'HIDE'
  })
}

export {
  initCrossSdkWithParams,
  initCrossSdk,
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
  kaiaMainnet,
  kaiaTestnet,
  etherMainnet,
  etherTestnet,
  UniversalProvider,
  getUniversalProvider,
  ConstantsUtil
}
