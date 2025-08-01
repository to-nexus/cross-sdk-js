import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import {
  AccountController,
  ConnectionController,
  ApiController,
  ConstantsUtil,
  SendController,
  type ThemeMode
} from '@to-nexus/appkit-core'
import { bscMainnet, bscTestnet, crossMainnet, crossTestnet } from '@to-nexus/appkit/networks'
import {
  createAppKit,
} from '@to-nexus/appkit'
import UniversalProvider from '@to-nexus/universal-provider'
import { createAppKitWalletButton } from '@to-nexus/appkit-wallet-button'

export type { 
  SendTransactionArgs, 
  WriteContractArgs, 
  AssetFilterType, 
  ThemeMode,
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

type SupportedNetworks = typeof crossTestnet | typeof crossMainnet | typeof bscTestnet | typeof bscMainnet

const defaultMetadata: Metadata = {
  name: 'Cross SDK',
  description: 'Cross SDK for HTML',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/wallet/token/images/CROSSx.svg']
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
    networks: [crossTestnet, crossMainnet, bscTestnet, bscMainnet],
    defaultNetwork: defaultNetwork,
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

export const useAppKitWallet = () => {
  const walletButton = createAppKitWalletButton()
  return walletButton
}

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
  UniversalProvider,
  ConstantsUtil
}
