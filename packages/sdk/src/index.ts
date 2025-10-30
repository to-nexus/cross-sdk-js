import { createAppKit } from '@to-nexus/appkit'
import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import { ConstantsUtil as CommonConstantsUtil } from '@to-nexus/appkit-common'
import {
  AccountController,
  ApiController,
  type ChainAdapter,
  ConnectionController,
  ConstantsUtil,
  SendController,
  type ThemeMode
} from '@to-nexus/appkit-core'
import type { CustomWallet } from '@to-nexus/appkit-core'
import { ConnectorUtil, createAppKitWalletButton } from '@to-nexus/appkit-wallet-button'
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
import UniversalProvider from '@to-nexus/universal-provider'

import { SDK_VERSION } from './constants.js'

export type {
  SendTransactionArgs,
  WriteContractArgs,
  AssetFilterType,
  ThemeMode,
  SignTypedDataV4Args,
  TypedDataDomain,
  TypedDataTypes,
  TypedDataField,
  ChainAdapter
} from '@to-nexus/appkit-core'

const ethersAdapter = new EthersAdapter()

const CROSS_WALLET_WEBAPP_LINK = (() =>
  (CommonConstantsUtil as any).getCrossWalletWebappLink?.() ||
  'https://cross-wallet.crosstoken.io/wc')()

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
  description: 'Cross SDK for HTML',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

export type CrossSdkParams = {
  projectId: string
  redirectUrl?: string
  metadata?: Metadata
  themeMode?: ThemeMode
  defaultNetwork?: SupportedNetworks
  adapters?: ChainAdapter[]
}

const initCrossSdkWithParams = (params: CrossSdkParams) => {
  const { projectId, redirectUrl, metadata, themeMode, defaultNetwork, adapters } = params

  return initCrossSdk(projectId, redirectUrl, metadata, themeMode, defaultNetwork, adapters)
}

// Create modal
const initCrossSdk = (
  projectId: string,
  redirectUrl?: string,
  metadata?: Metadata,
  themeMode?: ThemeMode,
  defaultNetwork?: SupportedNetworks,
  adapters?: ChainAdapter[]
) => {
  const mergedMetadata = {
    ...defaultMetadata,
    ...metadata,
    redirect: {
      universal: redirectUrl
    }
  }

  return createAppKit({
    adapters: adapters && adapters.length > 0 ? adapters : [ethersAdapter],
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
        mobile_link: CROSS_WALLET_WEBAPP_LINK,
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

export const useAppKitWallet = () => {
  const walletButton = createAppKitWalletButton()

  return walletButton
}

export const sdkVersion = SDK_VERSION

export {
  initCrossSdkWithParams,
  initCrossSdk,
  ConnectionController,
  SendController,
  AccountController,
  ApiController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  kaiaMainnet,
  kaiaTestnet,
  etherMainnet,
  etherTestnet,
  UniversalProvider,
  ConstantsUtil,
  ConnectorUtil
}
