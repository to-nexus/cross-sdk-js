import { defineChain } from '../utils.js'

export const bscTestnet = defineChain({
  id: 97,
  name: 'BSC Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'tBNB'
  },
  network: 'bsc-testnet',
  rpcUrls: {
    default: {
      http: ['https://bsc-testnet.crosstoken.io/110ea3628b77f244e5dbab16790d81bba874b962']
    }
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://testnet.bscscan.com',
      apiUrl: 'https://api-testnet.bscscan.com/api'
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
  caipNetworkId: 'eip155:97'
})
