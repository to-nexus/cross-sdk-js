import { defineChain } from '../utils.js'

export const bscMainnet = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  network: 'bnb',
  rpcUrls: {
    default: {
      http: ['https://bsc-mainnet.crosstoken.io/2272489872e4f1475ff25d57ce93b51989f933c7']
    }
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://bscscan.com',
      apiUrl: 'https://api.bscscan.com/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 15921452,
    },
  },
  testnet: false,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:56'
})
