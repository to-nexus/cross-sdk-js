import { defineChain } from '../utils.js'

/**
 * Hyperliquid EVM Testnet.
 *
 * Values mirror the backend chain catalog (`chain/info`), which already
 * returns this chain with `required: true`.
 *
 * `contracts.multicall3` is intentionally absent: the catalog reports the zero
 * address, i.e. no multicall3 deployment exists on this chain. viem catches
 * `ChainDoesNotSupportContract` and falls back to a plain `eth_call`, so
 * omitting it is correct — pointing at an undeployed address would make
 * reads fail silently instead.
 */
export const hyperliquidTestnet = defineChain({
  id: 998,
  name: 'Hyperliquid EVM Testnet',
  nativeCurrency: { name: 'tHYPE', symbol: 'tHYPE', decimals: 18 },
  network: 'hyperliquid-testnet',
  rpcUrls: {
    default: {
      http: ['https://hype-testnet-private.cross-api.in/evm']
    }
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Explorer',
      url: 'https://app.hyperliquid-testnet.xyz/explorer'
    }
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:998'
})
