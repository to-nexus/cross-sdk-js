import { describe, expect, it } from 'vitest'

import { networkController } from '../src/networks/controller.js'
import { hyperliquidTestnet } from '../src/networks/hyperliquid/hyperliquidTestnet.js'

describe('hyperliquidTestnet preset', () => {
  it('carries the shape AppKit and the wagmi adapter read', () => {
    /*
     * `id` must be a NUMBER: network ids are compared against the active
     * network's id, and a string id reads as permanently unsupported.
     */
    expect(hyperliquidTestnet.id).toBe(998)
    expect(typeof hyperliquidTestnet.id).toBe('number')
    expect(hyperliquidTestnet.chainNamespace).toBe('eip155')
    expect(hyperliquidTestnet.caipNetworkId).toBe(`eip155:${hyperliquidTestnet.id}`)

    // Read unguarded when the viem transport is built — must be non-empty.
    expect(hyperliquidTestnet.rpcUrls.default.http[0]).toMatch(/^https:\/\//u)
    expect(hyperliquidTestnet.nativeCurrency).toEqual({
      name: 'tHYPE',
      symbol: 'tHYPE',
      decimals: 18
    })
    expect(hyperliquidTestnet.testnet).toBe(true)
  })

  it('declares no multicall3 (none is deployed on this chain)', () => {
    /*
     * The chain catalog reports the zero address for multicall3. viem catches
     * `ChainDoesNotSupportContract` and falls back to a plain `eth_call`;
     * pointing at an undeployed address would make reads fail silently.
     */
    expect(hyperliquidTestnet.contracts?.multicall3).toBeUndefined()
  })

  it('is part of the built-in network list, so it resolves before any catalog fetch', () => {
    const ids = networkController.getNetworks().map(network => network.id)

    expect(ids).toContain(998)
  })
})
