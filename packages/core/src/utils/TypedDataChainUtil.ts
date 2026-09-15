import type { SignTypedDataV4Args, SignTypedDataV4Options } from './TypeUtil.js'

type ChainIdProvider = {
  request(args: never): Promise<unknown>
}

const providerLocks = new WeakMap<object, Promise<void>>()

function createDeferred(): { promise: Promise<void>; release: () => void } {
  let resolvePromise: ((value: void | PromiseLike<void>) => void) | undefined = undefined
  const promise = new Promise<void>(complete => {
    resolvePromise = complete
  })

  function release(): void {
    resolvePromise?.()
  }

  return { promise, release }
}

export type TypedDataChainErrorCode =
  | 'TYPED_DATA_CHAIN_ID_INVALID'
  | 'TYPED_DATA_CHAIN_ID_REQUIRED'
  | 'TYPED_DATA_CHAIN_MISMATCH'
  | 'CHAIN_ID_READ_FAILED'
  | 'CHAIN_SWITCH_REJECTED'
  | 'CHAIN_SWITCH_UNSUPPORTED'
  | 'CHAIN_SWITCH_FAILED'
  | 'CHAIN_SWITCH_NOT_APPLIED'

export type TypedDataChainErrorPhase = 'preflight' | 'switch' | 'post-switch'

export class TypedDataChainError extends Error {
  public readonly code: TypedDataChainErrorCode
  public readonly requestedChainId?: number
  public readonly connectedChainId?: number
  public readonly phase: TypedDataChainErrorPhase

  public constructor(params: {
    code: TypedDataChainErrorCode
    message: string
    requestedChainId?: number
    connectedChainId?: number
    phase: TypedDataChainErrorPhase
    cause?: unknown
  }) {
    super(params.message, params.cause === undefined ? undefined : { cause: params.cause })
    this.name = 'TypedDataChainError'
    this.code = params.code
    this.requestedChainId = params.requestedChainId
    this.connectedChainId = params.connectedChainId
    this.phase = params.phase
  }
}

export function isTypedDataChainError(error: unknown): error is TypedDataChainError {
  return (
    error instanceof TypedDataChainError ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TypedDataChainError' &&
      'code' in error)
  )
}

export async function withTypedDataChainLock<Result>(
  provider: object,
  operation: () => Promise<Result>
): Promise<Result> {
  const previous = providerLocks.get(provider) ?? Promise.resolve()
  const current = createDeferred()
  const tail = previous.then(
    () => current.promise,
    () => current.promise
  )

  providerLocks.set(provider, tail)
  await previous.catch(() => undefined)

  try {
    return await operation()
  } finally {
    current.release()
    if (providerLocks.get(provider) === tail) {
      providerLocks.delete(provider)
    }
  }
}

export function normalizeEvmChainId(value: unknown): number {
  let normalized = 0n

  try {
    if (typeof value === 'bigint') {
      normalized = value
    } else if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) {
        throw new Error('Chain ID number must be a safe integer')
      }
      normalized = BigInt(value)
    } else if (typeof value === 'string') {
      const trimmed = value.trim()
      const chainId = trimmed.startsWith('eip155:') ? trimmed.slice('eip155:'.length) : trimmed

      if (!/^(?:0x[0-9a-f]+|[0-9]+)$/iu.test(chainId)) {
        throw new Error('Chain ID string must be hexadecimal or decimal')
      }

      normalized = BigInt(chainId)
    } else {
      throw new Error('Unsupported chain ID type')
    }
  } catch (error) {
    throw new TypedDataChainError({
      code: 'TYPED_DATA_CHAIN_ID_INVALID',
      message: 'The typed data contains an invalid chain ID.',
      phase: 'preflight',
      cause: error
    })
  }

  if (normalized <= 0n || normalized > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new TypedDataChainError({
      code: 'TYPED_DATA_CHAIN_ID_INVALID',
      message: 'The typed data contains an invalid chain ID.',
      phase: 'preflight'
    })
  }

  return Number(normalized)
}

function isUserRejectedRequest(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const candidate = error as { code?: unknown; message?: unknown }
  const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : ''

  return (
    candidate.code === 4001 ||
    candidate.code === 'ACTION_REJECTED' ||
    message.includes('user rejected') ||
    message.includes('user denied')
  )
}

function isUnsupportedRequest(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const candidate = error as { code?: unknown; message?: unknown }
  const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : ''

  return (
    candidate.code === 4200 ||
    candidate.code === -32601 ||
    message.includes('unsupported') ||
    message.includes('not supported')
  )
}

function getSwitchError(error: unknown): {
  code: TypedDataChainErrorCode
  message: string
} {
  if (isUserRejectedRequest(error)) {
    return {
      code: 'CHAIN_SWITCH_REJECTED',
      message: 'The user rejected the chain switch request.'
    }
  }

  if (isUnsupportedRequest(error)) {
    return {
      code: 'CHAIN_SWITCH_UNSUPPORTED',
      message: 'The connected provider does not support automatic chain switching.'
    }
  }

  return {
    code: 'CHAIN_SWITCH_FAILED',
    message: 'Unable to switch the connected provider chain.'
  }
}

async function readProviderChainId(
  provider: ChainIdProvider,
  params: {
    phase: 'preflight' | 'post-switch'
    requestedChainId?: number
  }
): Promise<number> {
  try {
    return normalizeEvmChainId(await provider.request({ method: 'eth_chainId' } as never))
  } catch (error) {
    throw new TypedDataChainError({
      code: 'CHAIN_ID_READ_FAILED',
      message: 'Unable to read the connected provider chain ID.',
      requestedChainId: params.requestedChainId,
      phase: params.phase,
      cause: error
    })
  }
}

export async function ensureTypedDataChain(params: {
  provider: ChainIdProvider
  typedData: SignTypedDataV4Args
  options?: SignTypedDataV4Options
  switchChain?: (chainId: number) => Promise<void>
}): Promise<void> {
  const policy = params.options?.chainPolicy ?? 'require-match'
  const rawDomainChainId = params.typedData.domain.chainId

  if (rawDomainChainId === undefined || rawDomainChainId === null) {
    if (params.options?.requireDomainChainId) {
      throw new TypedDataChainError({
        code: 'TYPED_DATA_CHAIN_ID_REQUIRED',
        message: 'The typed data domain must include a chain ID.',
        phase: 'preflight'
      })
    }

    return
  }

  if (policy === 'none') {
    return
  }

  const requestedChainId = normalizeEvmChainId(rawDomainChainId)
  const connectedChainId = await readProviderChainId(params.provider, {
    phase: 'preflight',
    requestedChainId
  })

  if (connectedChainId === requestedChainId) {
    return
  }

  if (policy === 'require-match') {
    throw new TypedDataChainError({
      code: 'TYPED_DATA_CHAIN_MISMATCH',
      message: 'The typed data chain does not match the connected provider chain.',
      requestedChainId,
      connectedChainId,
      phase: 'preflight'
    })
  }

  if (!params.switchChain) {
    throw new TypedDataChainError({
      code: 'CHAIN_SWITCH_UNSUPPORTED',
      message: 'The connected provider does not support automatic chain switching.',
      requestedChainId,
      connectedChainId,
      phase: 'switch'
    })
  }

  try {
    await params.switchChain(requestedChainId)
  } catch (error) {
    const switchError = getSwitchError(error)
    throw new TypedDataChainError({
      code: switchError.code,
      message: switchError.message,
      requestedChainId,
      connectedChainId,
      phase: 'switch',
      cause: error
    })
  }

  const chainIdAfterSwitch = await readProviderChainId(params.provider, {
    phase: 'post-switch',
    requestedChainId
  })

  if (chainIdAfterSwitch !== requestedChainId) {
    throw new TypedDataChainError({
      code: 'CHAIN_SWITCH_NOT_APPLIED',
      message: 'The provider chain did not change after the switch request completed.',
      requestedChainId,
      connectedChainId: chainIdAfterSwitch,
      phase: 'post-switch'
    })
  }
}
