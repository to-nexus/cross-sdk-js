import { defineChain } from '../utils.js'

export const etherTestnet = defineChain({
  id: 11155111,
  name: 'Ether Testnet (Sepolia)',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia',
    symbol: 'ETH'
  },
  network: 'sepolia',
  rpcUrls: {
    default: {
      http: ['https://sepolia.crosstoken.io/8de52516c154dce8cc2ceaae39d657a1e1e74d2f']
    }
  },
  blockExplorers: {
    default: {
      name: 'Ether Sepolia scan',
      url: 'https://sepolia.etherscan.io/'
      // ApiUrl: 'https://api.bscscan.com/api'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 751532
    }
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:11155111'
})
