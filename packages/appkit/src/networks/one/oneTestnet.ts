import { defineChain } from '../utils.js'

export const oneTestnet = defineChain({
  id: 612044,
  name: 'ONEchain Testnet',
  network: 'cross-testnet',
  nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://testnet.crosstoken.io:22001']
    }
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://testnet.crossscan.io/'
    }
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:612044'
})
