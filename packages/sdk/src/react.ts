import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from '@reown/appkit/networks'
import {
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitEvents,
  useAppKitNetwork,
  useAppKitState,
  useAppKitTheme,
  useDisconnect,
  useWalletInfo
} from '@reown/appkit/react'

const networks = [ { 
  id: mainnet.id,
  name: mainnet.name,
  nativeCurrency: mainnet.nativeCurrency,
  rpcUrls: mainnet.rpcUrls,

}]

// Setup solana adapter
const ethersAdapter = new EthersAdapter()

// Create modal
const initCrossSdk = (projectId: string) => createAppKit({
  adapters: [ethersAdapter],
  networks: [mainnet, ...networks],
  metadata: {
    name: 'Cross SDK',
    description: 'Cross SDK for React',
    url: 'https://to.nexus',
    icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4']
  },
  projectId,
  themeMode: 'light',
  features: {
    analytics: false,
    socials: false,
    email: false,
  },
  customWallets: [
    {
      id: "cross_wallet",
      name: "Cross Wallet",
      image_url: "https://raw.githubusercontent.com/reown-com/reown-dotnet/refs/heads/main/media/walletkit-icon.png",
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
  useDisconnect
}
