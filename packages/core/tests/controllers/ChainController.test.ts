import type { CaipNetwork, ChainNamespace } from '@to-nexus/appkit-common'
import { beforeEach, describe, expect, it } from 'vitest'

import { ChainController } from '../../src/controllers/ChainController.js'

// A registered network carries a NUMBER id, like every preset in
// `@to-nexus/appkit/networks`.
const hyperliquidTestnet = {
  id: 998,
  name: 'Hyperliquid EVM Testnet',
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:998',
  nativeCurrency: { name: 'tHYPE', symbol: 'tHYPE', decimals: 18 },
  rpcUrls: { default: { http: ['https://example.test'] } }
} as unknown as CaipNetwork

/**
 * The shape AppKit's `getUnsupportedNetwork()` used to build for an active
 * chain it did not recognize: the id is parsed out of the CAIP id, so it
 * arrives as a STRING.
 */
const activeAsString = {
  ...hyperliquidTestnet,
  id: '998'
} as unknown as CaipNetwork

function registerNetwork(network: CaipNetwork, namespace: ChainNamespace = 'eip155') {
  ChainController.state.chains.set(namespace, {
    namespace,
    networkState: { requestedCaipNetworks: [network], supportsAllNetworks: false }
  } as never)
}

describe('ChainController network-id comparison', () => {
  beforeEach(() => {
    ChainController.state.chains.clear()
    ChainController.state.activeChain = 'eip155'
    ChainController.state.activeCaipNetwork = undefined
  })

  it('treats a string active id as supported when the registered id is the same number', () => {
    registerNetwork(hyperliquidTestnet)
    ChainController.state.activeCaipNetwork = activeAsString

    // Regression: a strict `===` between '998' and 998 is always false, which
    // kept a REGISTERED chain flagged unsupported and re-opened the
    // "app doesn't support your current network" modal on every action.
    expect(ChainController.checkIfSupportedNetwork('eip155')).toBe(true)
  })

  it('matches when both ids are numbers', () => {
    registerNetwork(hyperliquidTestnet)
    ChainController.state.activeCaipNetwork = hyperliquidTestnet

    expect(ChainController.checkIfSupportedNetwork('eip155')).toBe(true)
  })

  it('still reports an actually unregistered chain as unsupported', () => {
    registerNetwork(hyperliquidTestnet)
    ChainController.state.activeCaipNetwork = {
      ...hyperliquidTestnet,
      id: 999,
      caipNetworkId: 'eip155:999'
    } as unknown as CaipNetwork

    expect(ChainController.checkIfSupportedNetwork('eip155')).toBe(false)
  })

  it('accepts a chain id in either form via checkIfSupportedChainId', () => {
    registerNetwork(hyperliquidTestnet)

    expect(ChainController.checkIfSupportedChainId(998)).toBe(true)
    expect(ChainController.checkIfSupportedChainId('998')).toBe(true)
    expect(ChainController.checkIfSupportedChainId(999)).toBe(false)
  })

  it('does not loosen comparison for non-numeric ids (solana, bip122)', () => {
    const solana = {
      id: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      chainNamespace: 'solana',
      caipNetworkId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
    } as unknown as CaipNetwork
    registerNetwork(solana, 'solana')
    ChainController.state.activeCaipNetwork = solana

    expect(ChainController.checkIfSupportedNetwork('solana')).toBe(true)

    ChainController.state.activeCaipNetwork = {
      ...solana,
      id: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
    } as unknown as CaipNetwork
    expect(ChainController.checkIfSupportedNetwork('solana')).toBe(false)
  })

  it('reports supported when no networks were requested at all', () => {
    registerNetwork(hyperliquidTestnet)
    ChainController.setRequestedCaipNetworks([], 'eip155')

    expect(ChainController.checkIfSupportedNetwork('eip155')).toBe(true)
  })
})
