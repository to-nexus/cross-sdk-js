import type { AppKitNetwork } from '@to-nexus/appkit-common'
import { defineChain } from './utils.js'
import type { EthChainInfo } from './types.js'

export function mapApiToNetwork(info: EthChainInfo): AppKitNetwork {
  return defineChain({
    id: info.chain_id,
    name: info.name,
    nativeCurrency: {
      name: info.currency_name,
      symbol: info.currency_symbol,
      decimals: info.currency_decimals
    },
    rpcUrls: {
      default: {
        http: [info.rpc]
      }
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: info.explorer_url
      }
    },
    testnet: info.testnet,
    chainNamespace: 'eip155',
    caipNetworkId: `eip155:${info.chain_id}`
  })
}

