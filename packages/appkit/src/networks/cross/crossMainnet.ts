import { defineChain } from '../utils.js'

export const crossMainnet = defineChain({
  id: 612055,
  name: 'CROSS Mainnet',
  network: 'cross',
  nativeCurrency: { name: 'CROSS', symbol: 'CROSS', decimals: 18 },
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
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:612055'
})
