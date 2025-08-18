import { defineChain } from '../utils.js'

export const etherMainnet = defineChain({
  id: 1,
  name: 'Ether Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH'
  },
  network: 'ethereum',
  rpcUrls: {
    default: {
      http: ['https://eth-mainnet.crosstoken.io/fad29a23391f6d6e8fb41fb8eecbcca82343b378']
    }
  },
  blockExplorers: {
    default: {
      name: 'Ether scan',
      url: 'https://etherscan.io/'
      // ApiUrl: 'https://api.bscscan.com/api'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 14353601
    }
  },
  testnet: false,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:1'
})
