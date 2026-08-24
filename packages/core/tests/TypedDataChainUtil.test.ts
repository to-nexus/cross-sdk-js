import { describe, expect, it, vi } from 'vitest'

import type { Provider, SignTypedDataV4Args } from '../src/utils/TypeUtil.js'
import {
  TypedDataChainError,
  ensureTypedDataChain,
  normalizeEvmChainId,
  withTypedDataChainLock
} from '../src/utils/TypedDataChainUtil.js'

function createTypedData(chainId?: number | bigint | string): SignTypedDataV4Args {
  return {
    domain: {
      name: 'Test',
      version: '1',
      chainId,
      verifyingContract: '0x1234567890123456789012345678901234567890'
    },
    types: {
      EIP712Domain: [{ name: 'name', type: 'string' }],
      Message: [{ name: 'value', type: 'string' }]
    },
    primaryType: 'Message',
    message: { value: 'test' }
  }
}

function createProvider(getChainId: () => number) {
  return {
    request: vi.fn(async ({ method }: { method: string }) => {
      if (method !== 'eth_chainId') {
        throw new Error(`Unexpected method: ${method}`)
      }

      return `0x${getChainId().toString(16)}`
    })
  } as unknown as Pick<Provider, 'request'>
}

describe('TypedDataChainUtil', () => {
  it.each([
    [612055, 612055],
    [612055n, 612055],
    ['612055', 612055],
    ['0x956d7', 612055],
    ['eip155:612055', 612055]
  ])('normalizes EVM chain ID %s', (value, expected) => {
    expect(normalizeEvmChainId(value)).toBe(expected)
  })

  it.each([0, -1, 1.5, '', 'invalid', '0xzz'])('rejects invalid chain ID %s', value => {
    expect(() => normalizeEvmChainId(value)).toThrowError(
      expect.objectContaining({ code: 'TYPED_DATA_CHAIN_ID_INVALID' })
    )
  })

  it('allows signing when the domain and provider chains match', async () => {
    const provider = createProvider(() => 612055)

    await expect(
      ensureTypedDataChain({ provider, typedData: createTypedData(612055) })
    ).resolves.toBeUndefined()
  })

  it('rejects a mismatch by default without switching', async () => {
    const provider = createProvider(() => 612044)
    const switchChain = vi.fn()

    await expect(
      ensureTypedDataChain({ provider, typedData: createTypedData(612055), switchChain })
    ).rejects.toMatchObject({
      code: 'TYPED_DATA_CHAIN_MISMATCH',
      requestedChainId: 612055,
      connectedChainId: 612044,
      phase: 'preflight'
    })
    expect(switchChain).not.toHaveBeenCalled()
  })

  it('switches and verifies the provider again when explicitly requested', async () => {
    let providerChainId = 612044
    const provider = createProvider(() => providerChainId)
    const switchChain = vi.fn(async (chainId: number) => {
      providerChainId = chainId
    })

    await ensureTypedDataChain({
      provider,
      typedData: createTypedData(612055),
      options: { chainPolicy: 'switch-and-require-match' },
      switchChain
    })

    expect(switchChain).toHaveBeenCalledWith(612055)
    expect(provider.request).toHaveBeenCalledTimes(2)
  })

  it('rejects when a completed switch does not change the provider chain', async () => {
    const provider = createProvider(() => 612044)

    await expect(
      ensureTypedDataChain({
        provider,
        typedData: createTypedData(612055),
        options: { chainPolicy: 'switch-and-require-match' },
        switchChain: vi.fn().mockResolvedValue(undefined)
      })
    ).rejects.toMatchObject({
      code: 'CHAIN_SWITCH_NOT_APPLIED',
      requestedChainId: 612055,
      connectedChainId: 612044,
      phase: 'post-switch'
    })
  })

  it('preserves user rejection as a dedicated error', async () => {
    const provider = createProvider(() => 612044)

    await expect(
      ensureTypedDataChain({
        provider,
        typedData: createTypedData(612055),
        options: { chainPolicy: 'switch-and-require-match' },
        switchChain: vi
          .fn()
          .mockRejectedValue(Object.assign(new Error('User rejected'), { code: 4001 }))
      })
    ).rejects.toMatchObject({ code: 'CHAIN_SWITCH_REJECTED', phase: 'switch' })
  })

  it('preserves an unsupported switch request as a dedicated error', async () => {
    const provider = createProvider(() => 612044)

    await expect(
      ensureTypedDataChain({
        provider,
        typedData: createTypedData(612055),
        options: { chainPolicy: 'switch-and-require-match' },
        switchChain: vi
          .fn()
          .mockRejectedValue(Object.assign(new Error('Method not supported'), { code: 4200 }))
      })
    ).rejects.toMatchObject({ code: 'CHAIN_SWITCH_UNSUPPORTED', phase: 'switch' })
  })

  it('allows a chain-agnostic domain unless chainId is required', async () => {
    const provider = createProvider(() => 612055)

    await expect(
      ensureTypedDataChain({ provider, typedData: createTypedData() })
    ).resolves.toBeUndefined()
    expect(provider.request).not.toHaveBeenCalled()

    await expect(
      ensureTypedDataChain({
        provider,
        typedData: createTypedData(),
        options: { requireDomainChainId: true }
      })
    ).rejects.toMatchObject({ code: 'TYPED_DATA_CHAIN_ID_REQUIRED' })
  })

  it('supports the legacy opt-out policy without reading the provider chain', async () => {
    const provider = createProvider(() => 612044)

    await ensureTypedDataChain({
      provider,
      typedData: createTypedData(612055),
      options: { chainPolicy: 'none' }
    })

    expect(provider.request).not.toHaveBeenCalled()
  })

  it('exposes structured errors to SDK consumers', () => {
    const error = new TypedDataChainError({
      code: 'TYPED_DATA_CHAIN_MISMATCH',
      message: 'mismatch',
      requestedChainId: 612055,
      connectedChainId: 612044,
      phase: 'preflight'
    })

    expect(error).toMatchObject({
      name: 'TypedDataChainError',
      code: 'TYPED_DATA_CHAIN_MISMATCH',
      requestedChainId: 612055,
      connectedChainId: 612044,
      phase: 'preflight'
    })
  })

  it('serializes switch-and-sign operations for the same provider', async () => {
    const provider = {}
    const order: string[] = []
    let resolveFirst: ((value: void | PromiseLike<void>) => void) | undefined = undefined
    const firstGate = new Promise<void>(complete => {
      resolveFirst = complete
    })

    function releaseFirst(): void {
      resolveFirst?.()
    }

    const first = withTypedDataChainLock(provider, async () => {
      order.push('first:start')
      await firstGate
      order.push('first:end')
    })
    const second = withTypedDataChainLock(provider, async () => {
      order.push('second:start')
      order.push('second:end')
    })

    await vi.waitFor(() => expect(order).toEqual(['first:start']))
    releaseFirst()
    await Promise.all([first, second])

    expect(order).toEqual(['first:start', 'first:end', 'second:start', 'second:end'])
  })

  it('releases the provider lock after a failed operation', async () => {
    const provider = {}

    await expect(
      withTypedDataChainLock(provider, async () => {
        throw new Error('failed')
      })
    ).rejects.toThrow('failed')

    await expect(withTypedDataChainLock(provider, async () => 'recovered')).resolves.toBe(
      'recovered'
    )
  })
})
