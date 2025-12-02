import { defineChain } from '../utils.js'

export const roninTestnet = defineChain({
  id: 2021,
  name: 'Ronin Testnet',
  nativeCurrency: { name: 'tRON', symbol: 'tRON', decimals: 18 },
  network: 'ronin-testnet',
  rpcUrls: {
    default: {
      http: ['https://ronin-testnet.cross-api.in:8545']
    }
  },
  blockExplorers: {
    default: {
      name: 'SaigonScan',
      url: 'https://saigon-app.roninchain.com'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 26023535
    }
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:2021'
})
