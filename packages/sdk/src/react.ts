import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { crossTestnet, crossMainnet } from '@reown/appkit/networks'
import {
  AccountController,
  SendController,
  ConnectionController,
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitEvents,
  useAppKitNetwork,
  useAppKitState,
  useAppKitTheme,
  useDisconnect,
  useWalletInfo,
} from '@reown/appkit/react'

export type { SendTransactionArgs, WriteContractArgs } from '@reown/appkit'

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
    icons: ['https://dev-contents.crossops.in/wallet/token/images/Cross.svg']
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
  SendController,
  AccountController,
  ConnectionController,
  crossMainnet,
  crossTestnet
}
