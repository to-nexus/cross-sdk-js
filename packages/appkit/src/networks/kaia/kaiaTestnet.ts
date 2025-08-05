import { defineChain } from '../utils.js'

export const kaiaTestnet = defineChain({
  id: 1001,
  name: 'Kaia Testnet (Kairos)',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'tKAIA'
  },
  network: 'kaia-testnet',
  rpcUrls: {
    default: {
      http: ['https://kaia-testnet.crosstoken.io/fda0d5a47e2d0768e9329444295a3f0681fff365']
    }
  },
  blockExplorers: {
    default: {
      name: 'Kairos Scan',
      url: 'https://kairos.io/'
      // ApiUrl: 'https://api-testnet.bscscan.com/api'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 17422483
    }
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:1001'
})
