import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import {
  AccountController,
  ConnectionController,
  ConstantsUtil,
  SendController
} from '@to-nexus/appkit-core'
import { crossMainnet, crossTestnet } from '@to-nexus/appkit/networks'
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
  useDisconnect,
  useWalletInfo
} from '@to-nexus/appkit/react'
import UniversalProvider from '@to-nexus/universal-provider'

export type { SendTransactionArgs, WriteContractArgs } from '@to-nexus/appkit-core'

const networks = [
  {
    id: crossTestnet.id,
    name: crossTestnet.name,
    nativeCurrency: crossTestnet.nativeCurrency,
    rpcUrls: crossTestnet.rpcUrls
  }
]

const ethersAdapter = new EthersAdapter()

type Metadata = {
  name: string
  description: string
  url: string
  icons: string[]
}

const defaultMetadata: Metadata = {
  name: 'Cross SDK',
  description: 'Cross SDK for React',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/wallet/token/images/CROSSx.svg']
}

// Create modal
const initCrossSdk = (projectId: string, redirectUrl?: string, metadata?: Metadata) => {
  const mergedMetadata = {
    ...defaultMetadata,
    ...metadata,
    redirect: {
      universal: redirectUrl
    }
  }

  return createAppKit({
    adapters: [ethersAdapter],
    networks: [crossTestnet, crossMainnet, ...networks],
    metadata: mergedMetadata,
    projectId,
    themeMode: 'light',
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
  ConnectionController,
  SendController,
  AccountController,
  crossMainnet,
  crossTestnet,
  UniversalProvider,
  getUniversalProvider,
  ConstantsUtil
}
