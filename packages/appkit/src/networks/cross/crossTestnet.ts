import { defineChain } from '../utils.js'

export const crossTestnet = defineChain({
  id: 612044,
  name: 'CROSS',
  network: 'cross-testnet',
  nativeCurrency: { name: 'CROSS', symbol: 'CROSS', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://testnet.cross-nexus.com:22001'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://testnet-explorer.cross-nexus.com/',
    },
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:612044'
})
