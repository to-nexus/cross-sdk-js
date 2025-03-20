import { defineChain } from '../utils.js'

export const crossMainnet = defineChain({
  id: 612055,
  name: 'CROSS',
  network: 'cross',
  nativeCurrency: { name: 'CROSS', symbol: 'CROSS', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://mainnet.cross-nexus.com:22001'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://explorer.cross-nexus.com',
    },
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:612055'
})
