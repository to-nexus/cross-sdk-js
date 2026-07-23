import { defineChain } from '../utils.js'

export const oneMainnet = defineChain({
  id: 612055,
  name: 'ONEchain Mainnet',
  network: 'cross',
  nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://mainnet.crosstoken.io:22001']
    }
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://www.crossscan.io'
    }
  },
  testnet: false,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:612055'
})
