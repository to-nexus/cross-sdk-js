import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import { crossTestnet, crossMainnet } from '@to-nexus/appkit/networks'
import {
  createAppKit,
  useAppKit,
  useAppKitProvider,
  useAppKitAccount,
  useAppKitEvents,
  useAppKitNetwork,
  useAppKitState,
  useAppKitTheme,
  useDisconnect,
  useWalletInfo,
  getUniversalProvider
} from '@to-nexus/appkit/react'
import { AccountController, SendController, ConnectionController } from '@to-nexus/appkit-core'
import UniversalProvider from '@to-nexus/universal-provider'

export type { SendTransactionArgs, WriteContractArgs } from '@to-nexus/appkit-core'

const networks = [ { 
  id: crossTestnet.id,
  name: crossTestnet.name,
  nativeCurrency: crossTestnet.nativeCurrency,
  rpcUrls: crossTestnet.rpcUrls,
}]

const ethersAdapter = new EthersAdapter()

// Create modal
const initCrossSdk = (projectId: string) => createAppKit({
  adapters: [ethersAdapter],
  networks: [crossTestnet, crossMainnet, ...networks],
  metadata: {
    name: 'Cross SDK',
    description: 'Cross SDK for React',
    url: 'https://to.nexus',
    icons: ['https://contents.crosstoken.io/wallet/token/images/Cross.svg']
  },
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
      id: "cross_wallet",
      name: "Cross Wallet",
      image_url: "https://dev-contents.crossops.in/wallet/token/images/Cross.svg",
      mobile_link: "cross-wallet://"
    }
  ],
  allWallets: "HIDE"
})

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
  getUniversalProvider
}