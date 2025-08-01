import { defineChain } from '../utils.js'

export const kaiaMainnet = defineChain({
  id: 8217,
  name: 'Kaia Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA'
  },
  network: 'kaia',
  rpcUrls: {
    default: {
      http: ['https://kaia-mainnet-ext.crosstoken.io/815b8a6e389b34a4f82cfd1e501692dee2f4e8f5']
    }
  },
  blockExplorers: {
    default: {
      name: 'Kaia Scan',
      url: 'https://kaiascan.io/'
      // ApiUrl: 'https://api.bscscan.com/api'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 15921452
    }
  },
  testnet: false,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:8217'
})
