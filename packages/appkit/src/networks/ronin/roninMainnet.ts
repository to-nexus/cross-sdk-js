import { defineChain } from '../utils.js'

export const roninMainnet = defineChain({
  id: 2020,
  name: 'Ronin Mainnet',
  nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
  network: 'ronin-mainnet',
  rpcUrls: {
    default: {
      http: ['https://ronin-testnet.cross-api.in:8545']
    }
  },
  blockExplorers: {
    default: {
      name: 'RoninScan',
      url: 'https://app.roninchain.com/'
    }
  },
  testnet: false,
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 26023535
    }
  },
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:2020'
})
