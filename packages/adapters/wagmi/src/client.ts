/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppKit, type AppKitOptions, WcHelpersUtil } from '@to-nexus/appkit'
import type { AppKitNetwork, CaipNetwork, ChainNamespace } from '@to-nexus/appkit-common'
import {
  ConstantsUtil as CommonConstantsUtil,
  NetworkUtil,
  isReownName
} from '@to-nexus/appkit-common'
import {
  type ConnectorType,
  ConstantsUtil as CoreConstantsUtil,
  CoreHelperUtil,
  OptionsController,
  type Provider,
  type SIWXSession,
  StorageUtil
} from '@to-nexus/appkit-core'
import { CaipNetworksUtil, PresetsUtil } from '@to-nexus/appkit-utils'
import type { W3mFrameProvider } from '@to-nexus/appkit-wallet'
import { AdapterBlueprint } from '@to-nexus/appkit/adapters'
import { WalletConnectConnector } from '@to-nexus/appkit/connectors'
import type UniversalProvider from '@to-nexus/universal-provider'
import {
  type Config,
  type Connector,
  type CreateConfigParameters,
  type CreateConnectorFn,
  connect,
  createConfig,
  getAccount,
  getBalance,
  getConnections,
  getEnsAvatar,
  getEnsName,
  injected,
  prepareTransactionRequest,
  reconnect,
  signMessage,
  switchChain,
  disconnect as wagmiDisconnect,
  estimateGas as wagmiEstimateGas,
  getEnsAddress as wagmiGetEnsAddress,
  sendTransaction as wagmiSendTransaction,
  writeContract as wagmiWriteContract,
  waitForTransactionReceipt,
  watchAccount,
  watchConnections,
  watchConnectors,
  watchPendingTransactions
} from '@wagmi/core'
import { type Chain } from '@wagmi/core/chains'
import { type GetEnsAddressReturnType, type Hex, formatUnits, parseUnits } from 'viem'
import { normalize } from 'viem/ens'

import { authConnector } from './connectors/AuthConnector.js'
import { crossExtensionConnector } from './connectors/CrossExtentionConnector.js'
import { walletConnect } from './connectors/UniversalConnector.js'
import { LimitterUtil } from './utils/LimitterUtil.js'
import { parseWalletCapabilities } from './utils/helpers.js'

// Helper function to safely extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>
    if ('message' in obj && typeof obj['message'] === 'string') {
      return obj['message']
    }
  }

  return String(error)
}

interface PendingTransactionsFilter {
  enable: boolean
  pollingInterval?: number
}

// --- Types for Session Restore Events ---------------------------- //
export interface ReconnectFailedEvent {
  code: 'SESSION_RESTORE_FAILED'
  message: string
  attempts: number
  error: Error
}

export interface ReconnectSuccessEvent {
  address: string
  chainId: number
  provider: Provider
  id: string
  type: ConnectorType
}

// --- Constants ---------------------------------------------------- //
const DEFAULT_PENDING_TRANSACTIONS_FILTER = {
  enable: false,
  pollingInterval: 30_000
}

export class WagmiAdapter extends AdapterBlueprint {
  public wagmiChains: readonly [Chain, ...Chain[]] | undefined
  public wagmiConfig!: Config
  public adapterType = 'wagmi'

  private pendingTransactionsFilter: PendingTransactionsFilter
  private unwatchPendingTransactions: (() => void) | undefined
  private balancePromises: Record<string, Promise<AdapterBlueprint.GetBalanceResult>> = {}
  private siwx?: AppKitOptions['siwx']
  private reconnectFailedListeners = new Set<(event: ReconnectFailedEvent) => void>()
  private isAutoReconnecting = false

  constructor(
    configParams: Partial<CreateConfigParameters> & {
      networks: AppKitNetwork[]
      pendingTransactionsFilter?: PendingTransactionsFilter
      projectId: string
      siwx?: AppKitOptions['siwx']
    }
  ) {
    super({
      projectId: configParams.projectId,
      networks: CaipNetworksUtil.extendCaipNetworks(configParams.networks, {
        projectId: configParams.projectId,
        customNetworkImageUrls: {},
        customRpcChainIds: configParams.transports
          ? Object.keys(configParams.transports).map(Number)
          : []
      }) as [CaipNetwork, ...CaipNetwork[]]
    })

    this.pendingTransactionsFilter = {
      ...DEFAULT_PENDING_TRANSACTIONS_FILTER,
      ...(configParams.pendingTransactionsFilter ?? {})
    }

    // ✅ SIWX 설정 저장
    this.siwx = configParams.siwx

    // ✅ OptionsController에 SIWX 설정 등록 (SIWXUtil이 사용하기 위해)
    if (this.siwx) {
      OptionsController.setSIWX(this.siwx)
    }

    this.namespace = CommonConstantsUtil.CHAIN.EVM

    this.createConfig({
      ...configParams,
      networks: CaipNetworksUtil.extendCaipNetworks(configParams.networks, {
        projectId: configParams.projectId,
        customNetworkImageUrls: {},
        customRpcChainIds: configParams.transports
          ? Object.keys(configParams.transports).map(Number)
          : []
      }) as [CaipNetwork, ...CaipNetwork[]],
      projectId: configParams.projectId,
      connectors: [...(configParams?.connectors ?? []), crossExtensionConnector()]
    })

    this.setupWatchers()

    // 자동 세션 복원 시도 (SSR 환경이 아닐 때만)
    if (typeof window !== 'undefined') {
      this.attemptAutoReconnectWithRetry()
    }
  }

  /**
   * 자동 세션 복원을 재시도 로직과 함께 실행
   * - 점진적으로 증가하는 대기 시간으로 다양한 디바이스/네트워크 환경 커버
   * - 1차: 300ms 후 시도 (빠른 디바이스)
   * - 2차: +200ms 후 재시도 (총 500ms, 평균적인 디바이스)
   * - 3차: +300ms 후 재시도 (총 800ms, 느린 디바이스)
   * - 4차: +400ms 후 최종 시도 (총 1200ms, 매우 느린 디바이스/네트워크)
   * - 각 시도마다 2초 timeout 적용 (stuck 방지)
   * - 실패 시: 'reconnect_failed' 이벤트 emit
   */
  private async attemptAutoReconnectWithRetry() {
    const retryDelays = [300, 200, 300, 400] // 점진적 증가: 빠른 디바이스부터 느린 디바이스까지 커버
    const reconnectTimeout = 2000 // 각 reconnect() 호출마다 2초 timeout
    let lastError: Error | null = null

    // ✅ 자동 복원 진행 중임을 표시 (성급한 disconnect 방지)
    this.isAutoReconnecting = true

    // eslint-disable-next-line no-await-in-loop
    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      // 초기 대기
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]))

      try {
        // Reconnect()를 timeout과 함께 실행
        // eslint-disable-next-line no-await-in-loop
        const result = await Promise.race([
          reconnect(this.wagmiConfig),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('RECONNECT_TIMEOUT')), reconnectTimeout)
          )
        ])

        // 세션 복원 성공
        if (result && result.length > 0) {
          const connection = result[0]
          if (connection) {
            const connector = this.wagmiConfig.connectors.find(
              c => c.id === connection.connector.id
            )
            // eslint-disable-next-line no-await-in-loop
            const provider = (await connector?.getProvider()) as Provider

            this.emit('reconnect_success', {
              address: connection.accounts[0],
              chainId: connection.chainId,
              provider,
              id: connection.connector.id,
              type: connection.connector.type
            })
          }

          this.isAutoReconnecting = false

          return
        }

        /*
         * ✅ result.length === 0이면 다음 재시도로
         * (provider가 아직 준비 안됨)
         */
        if (attempt < retryDelays.length - 1) {
          continue
        }

        // 마지막 시도에서도 연결 없음
        lastError = new Error('SESSION_RESTORE_NO_CONNECTIONS')
      } catch (error) {
        lastError = error as Error

        // 에러 발생 시에도 재시도
        if (attempt < retryDelays.length - 1) {
          continue
        }
      }
    }

    // 모든 시도 실패
    this.isAutoReconnecting = false

    if (lastError) {
      this.emitReconnectFailed({
        code: 'SESSION_RESTORE_FAILED',
        message:
          'Failed to restore wallet session after multiple attempts. Please reconnect your wallet manually.',
        attempts: retryDelays.length,
        error: lastError
      })
    }
  }

  /**
   * LocalStorage에 유효한 세션 정보가 있는지 확인
   * - WalletConnect 세션 만료 시간을 체크하여 실제 유효성 판단
   * - 시간 경과가 아닌 세션 자체의 expiry로 판단
   * @private
   * @returns {boolean} 유효한 세션이 있으면 true
   */
  private hasValidStoredSession(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      // 1. Cross SDK 기본 연결 정보 확인
      const connectionStatus = localStorage.getItem('@cross/connection_status')
      const connectorId = localStorage.getItem('@cross/eip155:connected_connector_id')

      if (connectionStatus !== 'connected' || !connectorId) {
        return false
      }

      /*
       * 2. WalletConnect 세션 유효성 확인
       * customStoragePrefix('nexus-')가 적용된 키와 기본 키 모두 확인
       */
      const wcSessionKeys = ['nexus-wc@2:client:0.3//session', 'wc@2:client:0.3//session']
      let wcSession: string | null = null

      for (const key of wcSessionKeys) {
        wcSession = localStorage.getItem(key)
        if (wcSession) {
          console.log(`[WagmiAdapter] Found session in storage with key: ${key}`)
          break
        }
      }

      if (!wcSession) {
        console.log(
          '[WagmiAdapter] No WalletConnect session storage found (checked nexus- and default)'
        )

        return false
      }

      try {
        const sessions = JSON.parse(wcSession)

        if (!Array.isArray(sessions) || sessions.length === 0) {
          console.log('[WagmiAdapter] WalletConnect session storage is empty')

          return false
        }

        // 유효한 세션이 하나라도 있는지 확인
        const hasValidSession = sessions.some((session: any) => {
          if (!session.expiry) {
            return false
          }

          const expiryMs = session.expiry * 1000
          const isValid = expiryMs > Date.now()

          if (!isValid) {
            console.log('[WagmiAdapter] Session expired:', {
              topic: `${session.topic?.substring(0, 10)}...`,
              expiry: new Date(expiryMs).toISOString(),
              now: new Date().toISOString()
            })
          }

          return isValid
        })

        if (!hasValidSession) {
          console.log('[WagmiAdapter] All WalletConnect sessions expired - allowing cleanup')

          return false
        }

        console.log('[WagmiAdapter] Found valid WalletConnect session')

        return true
      } catch (parseError) {
        console.warn('[WagmiAdapter] Failed to parse WalletConnect session:', parseError)

        return false
      }
    } catch (error) {
      console.warn('[WagmiAdapter] Error checking session validity:', error)

      return false
    }
  }

  /**
   * Listen to session reconnect failure events
   * @param callback - Callback function to handle the reconnect failure event
   * @example
   * ```typescript
   * adapter.onReconnectFailed((event) => {
   *   console.error('Session restore failed:', event.message)
   *   // Show custom UI to user
   *   showNotification(event.message)
   * })
   * ```
   */
  public onReconnectFailed(callback: (event: ReconnectFailedEvent) => void) {
    this.reconnectFailedListeners.add(callback)
  }

  /**
   * Remove a reconnect failed event listener
   * @param callback - The callback function to remove
   */
  public offReconnectFailed(callback: (event: ReconnectFailedEvent) => void) {
    this.reconnectFailedListeners.delete(callback)
  }

  /**
   * Emit reconnect failed event to all listeners
   * @private
   */
  private emitReconnectFailed(event: ReconnectFailedEvent) {
    this.reconnectFailedListeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in reconnect failed listener:', error)
      }
    })
  }

  override async getAccounts(
    params: AdapterBlueprint.GetAccountsParams
  ): Promise<AdapterBlueprint.GetAccountsResult> {
    const connector = this.getWagmiConnector(params.id)

    if (!connector) {
      return { accounts: [] }
    }

    if (connector.id === CommonConstantsUtil.CONNECTOR_ID.AUTH) {
      const provider = connector['provider'] as W3mFrameProvider
      const { address, accounts } = await provider.connect()

      return Promise.resolve({
        accounts: (accounts || [{ address, type: 'eoa' }]).map(account =>
          CoreHelperUtil.createAccount('eip155', account.address, account.type)
        )
      })
    }

    const { addresses, address } = getAccount(this.wagmiConfig)

    return Promise.resolve({
      accounts: (addresses || [address])?.map(val =>
        CoreHelperUtil.createAccount('eip155', val || '', 'eoa')
      )
    })
  }

  private getWagmiConnector(id: string) {
    return this.wagmiConfig.connectors.find(c => c.id === id)
  }

  private createConfig(
    configParams: Partial<CreateConfigParameters> & {
      networks: CaipNetwork[]
      projectId: string
    }
  ) {
    this.caipNetworks = configParams.networks
    // Filter EVM chains and ensure type compatibility
    const evmChains = this.caipNetworks.filter(
      caipNetwork => caipNetwork.chainNamespace === CommonConstantsUtil.CHAIN.EVM
    )

    // Use type assertion to handle viem version compatibility
    this.wagmiChains = evmChains as unknown as typeof this.wagmiChains

    const transportsArr = evmChains.map(chain => [
      chain.id,
      CaipNetworksUtil.getViemTransport(chain as CaipNetwork)
    ])

    // Handle custom transports with proper typing
    Object.entries(configParams.transports ?? {}).forEach(([chainId, transport]) => {
      const index = transportsArr.findIndex(([id]) => id === Number(chainId))
      if (index === -1) {
        transportsArr.push([Number(chainId), transport as any])
      } else {
        transportsArr[index] = [Number(chainId), transport as any]
      }
    })

    const transports = Object.fromEntries(transportsArr)
    const connectors: CreateConnectorFn[] = [...(configParams.connectors ?? [])]

    // Create wagmi config with proper type handling
    this.wagmiConfig = createConfig({
      ...configParams,
      chains: this.wagmiChains as any, // Type assertion for viem compatibility
      transports,
      connectors: [...connectors],
      ssr: false // 세션 복원을 위해 SSR 비활성화
    })
  }

  private setupWatchPendingTransactions() {
    if (!this.pendingTransactionsFilter.enable || this.unwatchPendingTransactions) {
      return
    }

    this.unwatchPendingTransactions = watchPendingTransactions(this.wagmiConfig, {
      pollingInterval: this.pendingTransactionsFilter.pollingInterval,
      /* Magic RPC does not support the pending transactions. We handle transaction for the AuthConnector cases in AppKit client to handle all clients at once. Adding the onError handler to avoid the error to throw. */
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onError: () => {},
      onTransactions: () => {
        this.emit('pendingTransactions')
        LimitterUtil.increase('pendingTransactions')
      }
    })

    const unsubscribe = LimitterUtil.subscribeKey('pendingTransactions', val => {
      if (val >= CommonConstantsUtil.LIMITS.PENDING_TRANSACTIONS) {
        this.unwatchPendingTransactions?.()
        unsubscribe()
      }
    })
  }

  private setupWatchers() {
    watchAccount(this.wagmiConfig, {
      onChange: (accountData, prevAccountData) => {
        if (
          accountData.status === 'disconnected' &&
          prevAccountData.address &&
          prevAccountData.status !== 'reconnecting'
        ) {
          // ✅ 자동 복원 중이거나 localStorage에 유효한 세션이 있으면 disconnect 무시
          const hasValidSession = this.hasValidStoredSession()

          if (!hasValidSession && !this.isAutoReconnecting) {
            console.log(
              '[WagmiAdapter] Account disconnected and no valid session - emitting disconnect'
            )
            this.emit('disconnect')
          } else {
            console.log(
              '[WagmiAdapter] Account disconnected but valid session exists or reconnecting - preserving state'
            )
          }
        }

        if (accountData.status === 'connected') {
          if (
            accountData.address !== prevAccountData?.address ||
            prevAccountData.status !== 'connected'
          ) {
            this.setupWatchPendingTransactions()
            this.emit('accountChanged', {
              address: accountData.address
            })
          }

          if (accountData.chainId !== prevAccountData?.chainId) {
            this.emit('switchNetwork', {
              address: accountData.address,
              chainId: accountData.chainId
            })
          }
        }
      }
    })
    watchConnections(this.wagmiConfig, {
      onChange: connections => {
        if (connections.length === 0) {
          // ✅ 자동 복원 중이거나 localStorage에 유효한 세션이 있으면 disconnect 무시
          const hasValidSession = this.hasValidStoredSession()

          if (!hasValidSession && !this.isAutoReconnecting) {
            console.log('[WagmiAdapter] No connections and no valid session - emitting disconnect')
            this.emit('disconnect')
          } else {
            console.log(
              '[WagmiAdapter] No connections but valid session exists or reconnecting - preserving state'
            )
          }
        }
      }
    })
  }

  private async addThirdPartyConnectors(options: AppKitOptions) {
    const thirdPartyConnectors: CreateConnectorFn[] = []

    if (options.enableCoinbase !== false) {
      try {
        const { coinbaseWallet } = await import('@wagmi/connectors')

        if (coinbaseWallet) {
          thirdPartyConnectors.push(
            coinbaseWallet({
              appName: options.metadata?.name ?? 'Unknown',
              appLogoUrl: options.metadata?.icons[0] ?? 'Unknown',
              preference: {
                options: options.coinbasePreference ?? 'all'
              }
            })
          )
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to import Coinbase Wallet SDK:', error)
      }
    }

    thirdPartyConnectors.forEach(connector => {
      const cnctr = this.wagmiConfig._internal.connectors.setup(connector)
      this.wagmiConfig._internal.connectors.setState(prev => [...prev, cnctr])
    })
  }

  private addWagmiConnectors(options: AppKitOptions, appKit: AppKit) {
    const customConnectors: CreateConnectorFn[] = []

    if (options.enableWalletConnect !== false) {
      // ✅ SIWX 설정을 options에 추가
      const optionsWithSIWX = { ...options, siwx: this.siwx }
      customConnectors.push(
        walletConnect(optionsWithSIWX, appKit, this.caipNetworks as [CaipNetwork, ...CaipNetwork[]])
      )
    }

    if (options.enableInjected !== false) {
      customConnectors.push(injected({ shimDisconnect: true }))
    }

    const emailEnabled =
      options.features?.email === undefined
        ? CoreConstantsUtil.DEFAULT_FEATURES.email
        : options.features?.email
    const socialsEnabled = options.features?.socials
      ? options.features?.socials?.length > 0
      : CoreConstantsUtil.DEFAULT_FEATURES.socials

    if (emailEnabled || socialsEnabled) {
      customConnectors.push(
        authConnector({
          chains: this.wagmiChains,
          options: { projectId: options.projectId, enableAuthLogger: options.enableAuthLogger }
        })
      )
    }

    customConnectors.forEach(connector => {
      const cnctr = this.wagmiConfig._internal.connectors.setup(connector)
      this.wagmiConfig._internal.connectors.setState(prev => [...prev, cnctr])
    })
  }

  public async signMessage(
    params: AdapterBlueprint.SignMessageParams
  ): Promise<AdapterBlueprint.SignMessageResult> {
    try {
      const signature = await signMessage(this.wagmiConfig, {
        message: params.message,
        account: params.address as Hex
      })

      return { signature }
    } catch (error) {
      throw new Error('WagmiAdapter:signMessage - Sign message failed', { cause: error })
    }
  }

  public async etherSignMessage(
    params: AdapterBlueprint.EtherSignMessageParams
  ): Promise<AdapterBlueprint.EtherSignMessageResult> {
    const { provider, message, address } = params
    if (!provider) {
      throw new Error('WagmiAdapter:etherSignMessage - provider is undefined')
    }

    try {
      const signature = await provider.request({
        method: 'eth_sign',
        params: [address, message]
      })

      return { signature }
    } catch (error) {
      throw new Error('WagmiAdapter:etherSignMessage - Sign message failed', { cause: error })
    }
  }

  public async signEIP712(
    _params: AdapterBlueprint.SignEIP712Params
  ): Promise<AdapterBlueprint.SignEIP712Result> {
    return Promise.resolve({} as unknown as AdapterBlueprint.SignEIP712Result)
  }

  /**
   * Recursively converts BigInt values to hex strings for JSON serialization
   * This is necessary for Chrome extension messaging which cannot serialize BigInt
   */
  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'bigint') {
      return `0x${obj.toString(16)}`
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeBigInt(item))
    }

    if (typeof obj === 'object') {
      const serialized: Record<string, any> = {}
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          serialized[key] = this.serializeBigInt(obj[key])
        }
      }

      return serialized
    }

    return obj
  }

  public async signTypedDataV4(
    params: AdapterBlueprint.SignTypedDataV4Params
  ): Promise<AdapterBlueprint.SignTypedDataV4Result> {
    try {
      // SignTypedDataV4는 wagmi에서 직접 지원하지 않으므로 provider를 통해 호출
      const { provider } = params
      if (!provider) {
        throw new Error('WagmiAdapter:signTypedDataV4 - provider is undefined')
      }

      // Get current connected account address
      const account = getAccount(this.wagmiConfig)
      if (!account.address) {
        throw new Error('WagmiAdapter:signTypedDataV4 - No connected account found')
      }

      /*
       * Serialize BigInt values to hex strings for JSON serialization compatibility
       * Chrome extension messaging cannot handle BigInt, so we convert them
       */
      const serializedParamsData = this.serializeBigInt(params.paramsData)

      /*
       * Cross Wallet expects [typedData, metadata] (address is automatically extracted from connected account)
       * Standard wallets expect [address, typedData]
       */
      const signature = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [serializedParamsData, params.customData] as any
      })

      return { signature }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      throw new Error(`WagmiAdapter:signTypedDataV4 - Sign typed data failed: ${errorMessage}`, {
        cause: error
      })
    }
  }

  public async sendTransaction(
    params: AdapterBlueprint.SendTransactionParams
  ): Promise<AdapterBlueprint.SendTransactionResult> {
    const { chainId } = getAccount(this.wagmiConfig)

    // Type 결정: params.type이 있으면 사용, 없으면 Legacy(0)
    const txType = params.type ?? CoreConstantsUtil.TRANSACTION_TYPE.LEGACY
    const isEIP1559 = txType === CoreConstantsUtil.TRANSACTION_TYPE.DYNAMIC

    // Base transaction params
    const baseTxParams = {
      account: params.address,
      to: params.to as Hex,
      value: params.value as bigint,
      gas: params.gas as bigint,
      data: params.data as Hex,
      chainId
    }

    // Legacy Transaction (Type 0)
    let txParams
    if (!isEIP1559) {
      txParams = {
        ...baseTxParams,
        gasPrice: params.gasPrice as bigint,
        type: 'legacy' as const
      }
    } else {
      // EIP-1559 Transaction (Type 2)
      txParams = {
        ...baseTxParams,
        maxFeePerGas: params.maxFee as bigint,
        maxPriorityFeePerGas: params.maxPriorityFee as bigint,
        type: 'eip1559' as const
      }
    }

    await prepareTransactionRequest(this.wagmiConfig, txParams)
    const tx = await wagmiSendTransaction(this.wagmiConfig, txParams)
    await waitForTransactionReceipt(this.wagmiConfig, { hash: tx, timeout: 25000 })

    return { hash: tx }
  }

  public async readContract(
    _params: AdapterBlueprint.ReadContractParams
  ): Promise<AdapterBlueprint.ReadContractResult> {
    // Read contract
    return Promise.resolve({} as unknown as AdapterBlueprint.ReadContractResult)
  }

  public async writeContract(
    params: AdapterBlueprint.WriteContractParams
  ): Promise<AdapterBlueprint.WriteContractResult> {
    const { caipNetwork, ...data } = params
    const chainId = Number(NetworkUtil.caipNetworkIdToNumber(caipNetwork.caipNetworkId))

    // Type 결정: params.type이 있으면 사용, 없으면 Legacy(0)
    const txType = params.type ?? CoreConstantsUtil.TRANSACTION_TYPE.LEGACY
    const isEIP1559 = txType === CoreConstantsUtil.TRANSACTION_TYPE.DYNAMIC

    // Base contract params
    const baseContractParams = {
      chain: this.wagmiChains?.[chainId],
      chainId,
      address: data.contractAddress,
      account: data.fromAddress,
      abi: data.abi,
      functionName: data.method,
      args: data.args,
      __mode: 'prepared' as const
    }

    // Legacy Transaction (Type 0)
    let contractParams
    if (!isEIP1559) {
      contractParams = {
        ...baseContractParams,
        gasPrice: data.gasPrice as bigint,
        type: 'legacy' as const
      }
    } else {
      // EIP-1559 Transaction (Type 2)
      contractParams = {
        ...baseContractParams,
        maxFeePerGas: data.maxFee as bigint,
        maxPriorityFeePerGas: data.maxPriorityFee as bigint,
        type: 'eip1559' as const
      }
    }

    const tx = await wagmiWriteContract(this.wagmiConfig, contractParams as any)

    return { hash: tx }
  }

  public async getEnsAddress(
    params: AdapterBlueprint.GetEnsAddressParams
  ): Promise<AdapterBlueprint.GetEnsAddressResult> {
    const { name, caipNetwork } = params

    try {
      if (!this.wagmiConfig) {
        throw new Error(
          'networkControllerClient:getApprovedCaipNetworksData - wagmiConfig is undefined'
        )
      }

      let ensName: boolean | GetEnsAddressReturnType = false
      let wcName: boolean | string = false
      if (isReownName(name)) {
        wcName = (await WcHelpersUtil.resolveReownName(name)) || false
      }
      if (caipNetwork.id === 1) {
        ensName = await wagmiGetEnsAddress(this.wagmiConfig, {
          name: normalize(name),
          chainId: caipNetwork.id
        })
      }

      return { address: (ensName as string) || (wcName as string) || false }
    } catch {
      return { address: false }
    }
  }

  public async estimateGas(
    params: AdapterBlueprint.EstimateGasTransactionArgs
  ): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    try {
      const result = await wagmiEstimateGas(this.wagmiConfig, {
        account: params.address as Hex,
        to: params.to as Hex,
        data: params.data as Hex,
        type: 'legacy'
      })

      return { gas: result }
    } catch (error) {
      throw new Error('WagmiAdapter:estimateGas - error estimating gas', { cause: error })
    }
  }

  public parseUnits(params: AdapterBlueprint.ParseUnitsParams): AdapterBlueprint.ParseUnitsResult {
    return parseUnits(params.value, params.decimals)
  }

  public formatUnits(
    params: AdapterBlueprint.FormatUnitsParams
  ): AdapterBlueprint.FormatUnitsResult {
    return formatUnits(params.value, params.decimals)
  }

  private async addWagmiConnector(connector: Connector, options: AppKitOptions) {
    /*
     * We don't need to set auth connector or walletConnect connector
     * from wagmi since we already set it in chain adapter blueprint
     */
    if (
      connector.id === CommonConstantsUtil.CONNECTOR_ID.AUTH ||
      connector.id === CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT
    ) {
      return
    }

    const provider = (await connector.getProvider().catch(() => undefined)) as Provider | undefined

    this.addConnector({
      id: connector.id,
      explorerId: PresetsUtil.ConnectorExplorerIds[connector.id],
      imageUrl: options?.connectorImages?.[connector.id] ?? connector.icon,
      name: PresetsUtil.ConnectorNamesMap[connector.id] ?? connector.name,
      imageId: PresetsUtil.ConnectorImageIds[connector.id],
      type: PresetsUtil.ConnectorTypesMap[connector.type] ?? 'EXTERNAL',
      info:
        connector.id === CommonConstantsUtil.CONNECTOR_ID.INJECTED
          ? undefined
          : { rdns: connector.id },
      provider,
      chain: this.namespace as ChainNamespace,
      chains: []
    })
  }

  public async syncConnectors(options: AppKitOptions, appKit: AppKit) {
    /*
     * Watch for new connectors. This is needed because some EIP6963
     * connectors are added later in the process the initial setup
     */
    watchConnectors(this.wagmiConfig, {
      onChange: connectors => {
        connectors.forEach(connector => {
          this.addWagmiConnector(connector, options)
        })
      }
    })

    // Add current wagmi connectors to chain adapter blueprint
    await Promise.all(
      this.wagmiConfig.connectors.map(connector => this.addWagmiConnector(connector, options))
    )

    // ✅ Add wagmi connectors FIRST to create the walletConnect connector
    this.addWagmiConnectors(options, appKit)

    // Add third party connectors
    await this.addThirdPartyConnectors(options)
  }

  public async syncConnection(
    params: AdapterBlueprint.SyncConnectionParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    const { id } = params
    const connections = getConnections(this.wagmiConfig)
    const connection = connections.find(c => c.connector.id === id)
    const connector = this.getWagmiConnector(id)
    let provider: Provider | undefined = undefined
    try {
      provider = (await connector?.getProvider()) as Provider
    } catch {
      // Provider may not be available immediately
    }
    // Emit accountChanged event after syncing connection
    if (connection?.accounts[0]) {
      this.emit('accountChanged', {
        address: connection.accounts[0]
      })
    }

    return {
      chainId: Number(connection?.chainId),
      address: connection?.accounts[0] as string,
      provider,
      type: connection?.connector.type as ConnectorType,
      id: connection?.connector.id as string
    }
  }

  public override async connectWalletConnect(chainId?: number | string) {
    // Normal WalletConnect connection WITHOUT authentication
    const walletConnectConnector = this.getWalletConnectConnector()
    const wagmiConnector = this.getWagmiConnector('walletConnect')

    if (!wagmiConnector) {
      throw new Error('UniversalAdapter:connectWalletConnect - connector not found')
    }

    await connect(this.wagmiConfig, {
      connector: wagmiConnector,
      chainId: chainId ? Number(chainId) : undefined
    })

    return { clientId: await walletConnectConnector.provider.client.core.crypto.getClientId() }
  }

  public override async authenticateWalletConnect(
    chainId?: number | string
  ): Promise<{ authenticated: boolean; sessions: SIWXSession[] }> {
    // WC_sessionAuthenticate 방식: 연결 + SIWE 한 번에
    const wagmiConnector = this.getWagmiConnector('walletConnect') as any

    if (!wagmiConnector) {
      throw new Error('WagmiAdapter:authenticateWalletConnect - connector not found')
    }

    // ✅ Use Wagmi connector's authenticate method (added in UniversalConnector)
    if (typeof wagmiConnector.authenticate === 'function') {
      const result = await wagmiConnector.authenticate()

      if (result.authenticated && result.sessions.length > 0) {
        await connect(this.wagmiConfig, {
          connector: wagmiConnector,
          chainId: chainId ? Number(chainId) : undefined
        })
      }

      return result
    }

    // Fallback to WalletConnectConnector (should not happen)
    const walletConnectConnector = this.getWalletConnectConnector()
    const result = await walletConnectConnector.authenticate()

    if (result.authenticated && result.sessions.length > 0) {
      await connect(this.wagmiConfig, {
        connector: wagmiConnector,
        chainId: chainId ? Number(chainId) : undefined
      })
    }

    return result
  }

  // ✅ Cross Extension 연결 + SIWE 인증 통합 (Wagmi adapter용)
  public async authenticateCrossExtensionWallet(): Promise<{
    authenticated: boolean
    sessions: SIWXSession[]
  }> {
    console.log('🔐 WagmiAdapter.authenticateCrossExtensionWallet() called')
    console.log('📋 SIWX config exists:', Boolean(this.siwx))
    console.log('📋 OptionsController SIWX:', Boolean(OptionsController.state.siwx))

    if (!this.siwx) {
      throw new Error('SIWX not configured')
    }

    try {
      /*
       * Import SIWXUtil
       * @ts-ignore - Dynamic import
       */
      const { SIWXUtil, ChainController, CoreHelperUtil } = await import('@to-nexus/appkit-core')
      console.log('✅ Core modules imported')

      // Set flag to prevent auto SIWE modal
      console.log('🚀 Setting _isAuthenticating = true')
      SIWXUtil._isAuthenticating = true

      // 1. Connect using Wagmi
      console.log('🔌 Connecting via Wagmi...')
      const crossConnector = this.getWagmiConnector('nexus.to.crosswallet.desktop')

      if (!crossConnector) {
        SIWXUtil._isAuthenticating = false
        throw new Error('Cross Extension connector not found')
      }

      const connectResult = await connect(this.wagmiConfig, { connector: crossConnector })
      console.log('✅ Wagmi connected:', connectResult.accounts[0])

      // 2. Wait for ChainController to sync
      await new Promise(resolve => setTimeout(resolve, 500))

      const caipAddress = ChainController.getActiveCaipAddress()
      console.log('📍 caipAddress:', caipAddress)

      if (!caipAddress) {
        SIWXUtil._isAuthenticating = false
        throw new Error('Failed to get CAIP address')
      }

      // 3. Get address and network
      const address = CoreHelperUtil.getPlainAddress(caipAddress as any)
      const network = ChainController.getActiveCaipNetwork()
      console.log('📍 Plain address:', address, 'Network:', network?.caipNetworkId)

      if (!address || !network) {
        SIWXUtil._isAuthenticating = false
        throw new Error('Failed to get address or network')
      }

      // 4. Create SIWE message
      console.log('📝 Creating SIWE message...')
      const siwxMessage = await this.siwx.createMessage({
        chainId: network.caipNetworkId,
        accountAddress: address
      })
      const message = siwxMessage.toString()
      console.log('✅ SIWE message created')

      // 5. Sign message
      console.log('✍️ Signing message...')
      const signature = await signMessage(this.wagmiConfig, { message })
      console.log('✅ Signature received:', `${signature.substring(0, 20)}...`)

      // 6. Create session
      const session: SIWXSession = {
        data: siwxMessage,
        message,
        signature,
        cacao: undefined
      }

      await this.siwx.addSession(session)
      console.log('💾 Session saved')

      // Verify session
      let savedSessions = await this.siwx.getSessions(network.caipNetworkId, address)
      if (savedSessions.length === 0) {
        console.warn('⚠️ Retrying session check...')
        await new Promise(resolve => setTimeout(resolve, 100))
        savedSessions = await this.siwx.getSessions(network.caipNetworkId, address)
      }
      console.log('✅ Sessions verified:', savedSessions.length)

      // Clear flag after delay
      setTimeout(() => {
        console.log('🏁 Clearing _isAuthenticating flag')
        SIWXUtil._isAuthenticating = false
      }, 200)

      return { authenticated: true, sessions: [session] }
    } catch (error) {
      console.error('❌ Error:', error)
      try {
        const { SIWXUtil } = await import('@to-nexus/appkit-core')
        SIWXUtil._isAuthenticating = false
      } catch {
        // Ignore if SIWXUtil import fails
      }
      throw error
    }
  }

  public async connect(
    params: AdapterBlueprint.ConnectParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    const { id, provider, type, chainId } = params
    const connector = this.getWagmiConnector(id)

    if (!connector) {
      throw new Error('connectionControllerClient:connectExternal - connector is undefined')
    }

    try {
      // ✅ Cross Extension 연결 시 매번 계정 선택 팝업을 표시하기 위해 먼저 disconnect 호출 (React example처럼)
      if (
        id === 'nexus.to.crosswallet.desktop' &&
        (type === 'ANNOUNCED' || type === 'INJECTED' || type === 'EXTERNAL')
      ) {
        console.log('🔐 WagmiAdapter: Cross Extension detected, disconnecting first')

        // React example처럼 먼저 disconnect를 호출하여 Extension의 승인 상태 초기화
        try {
          await this.disconnect()
          console.log('✅ Disconnected successfully')
        } catch (disconnectError) {
          console.log('Disconnect failed (continuing anyway):', disconnectError)
        }
      }

      const res = await connect(this.wagmiConfig, {
        connector,
        chainId: chainId ? Number(chainId) : undefined
      })

      // Emit accountChanged event after successful connection
      this.emit('accountChanged', {
        address: res.accounts[0]
      })

      return {
        address: res.accounts[0],
        chainId: res.chainId,
        provider: provider as Provider,
        type: type as ConnectorType,
        id
      }
    } catch {
      throw new Error('WagmiAdapter:connect - error connecting')
    }
  }

  public override async reconnect(params: AdapterBlueprint.ConnectParams): Promise<void> {
    const { id } = params

    const connector = this.getWagmiConnector(id)

    if (!connector) {
      throw new Error('connectionControllerClient:connectExternal - connector is undefined')
    }

    await reconnect(this.wagmiConfig, {
      connectors: [connector]
    })
  }

  public async getBalance(
    params: AdapterBlueprint.GetBalanceParams
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    const caipNetwork = this.caipNetworks?.find(network => network.id === params.chainId)

    if (caipNetwork && this.wagmiConfig) {
      const caipAddress = `${caipNetwork.caipNetworkId}:${params.address}`
      const cachedPromise = this.balancePromises[caipAddress]
      if (cachedPromise) {
        return cachedPromise
      }

      const cachedBalance = StorageUtil.getNativeBalanceCacheForCaipAddress(caipAddress)
      if (cachedBalance) {
        return { balance: cachedBalance.balance, symbol: cachedBalance.symbol }
      }

      this.balancePromises[caipAddress] = new Promise<AdapterBlueprint.GetBalanceResult>(
        async resolve => {
          const chainId = Number(params.chainId)
          const balance = await getBalance(this.wagmiConfig, {
            address: params.address as Hex,
            chainId,
            token: params.tokens?.[caipNetwork.caipNetworkId]?.address as Hex
          })

          StorageUtil.updateNativeBalanceCache({
            caipAddress,
            balance: balance.formatted,
            symbol: balance.symbol,
            timestamp: Date.now()
          })
          resolve({ balance: balance.formatted, symbol: balance.symbol })
        }
      ).finally(() => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.balancePromises[caipAddress]
      })

      return this.balancePromises[caipAddress] || { balance: '', symbol: '' }
    }

    return { balance: '', symbol: '' }
  }

  public async getProfile(
    params: AdapterBlueprint.GetProfileParams
  ): Promise<AdapterBlueprint.GetProfileResult> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const chainId = params.chainId as number
    const profileName = await getEnsName(this.wagmiConfig, {
      address: params.address as Hex,
      chainId
    })
    if (profileName) {
      const profileImage = await getEnsAvatar(this.wagmiConfig, {
        name: profileName,
        chainId
      })

      return { profileName, profileImage: profileImage ?? undefined }
    }

    return { profileName: undefined, profileImage: undefined }
  }

  public getWalletConnectProvider(): AdapterBlueprint.GetWalletConnectProviderResult {
    return this.getWagmiConnector('walletConnect')?.['provider'] as UniversalProvider
  }

  public async disconnect() {
    const connections = getConnections(this.wagmiConfig)
    await Promise.all(
      connections.map(async connection => {
        const connector = this.getWagmiConnector(connection.connector.id)

        if (connector) {
          /*
           * Cross Extension의 경우 wallet_getPermissions 호출로 Extension 상태 초기화 필수
           * (재연결 시 user interaction이 정상 작동하려면 필요)
           */

          if (connector.id === 'nexus.to.crosswallet.desktop') {
            try {
              const provider = (await connector.getProvider()) as Provider | undefined
              if (provider && typeof provider.request === 'function') {
                await this.revokeProviderPermissions(provider)
              }
            } catch (error) {
              console.warn('[WagmiAdapter] disconnect - 상태 초기화 실패:', error)
            }
          }

          await wagmiDisconnect(this.wagmiConfig, { connector })
        }
      })
    )
  }

  private async revokeProviderPermissions(provider: Provider) {
    try {
      const permissions: any = await provider.request({
        method: 'wallet_getPermissions'
      })

      // Extension이 이미 disconnected 상태임을 명시적으로 처리
      if (permissions?.disconnected === true) {
        console.debug('[WagmiAdapter] Extension already disconnected')

        return
      }

      if (!Array.isArray(permissions)) {
        console.debug('[WagmiAdapter] permissions is not an array, skipping')

        return
      }

      const ethAccountsPermission = permissions.find(
        permission => permission.parentCapability === 'eth_accounts'
      )

      if (ethAccountsPermission) {
        try {
          await provider.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          })
        } catch (revokeError) {
          console.debug('[WagmiAdapter] wallet_revokePermissions not supported:', revokeError)
        }
      }
    } catch (error) {
      console.debug('[WagmiAdapter] wallet_getPermissions error (state initialized):', error)
    }
  }

  public override async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams) {
    try {
      await switchChain(this.wagmiConfig, { chainId: params.caipNetwork.id as number })
    } catch (error: unknown) {
      // Cross Extension Wallet이 체인 전환을 지원하지 않는 경우에 대한 처리
      const err = error as Error
      if (err.message?.includes('not support programmatic chain switching')) {
        // 사용자가 수동으로 체인을 전환해야 함을 알려줌
      }

      // 오류를 그대로 전파하여 상위 계층에서 처리할 수 있도록 함
      throw error
    }
  }

  public async getCapabilities(params: string) {
    if (!this.wagmiConfig) {
      throw new Error('connectionControllerClient:getCapabilities - wagmiConfig is undefined')
    }

    const connections = getConnections(this.wagmiConfig)
    const connection = connections[0]

    const connector = connection ? this.getWagmiConnector(connection.connector.id) : null

    if (!connector) {
      throw new Error('connectionControllerClient:getCapabilities - connector is undefined')
    }

    const provider = (await connector.getProvider()) as UniversalProvider

    if (!provider) {
      throw new Error('connectionControllerClient:getCapabilities - provider is undefined')
    }

    const walletCapabilitiesString = provider.session?.sessionProperties?.['capabilities']
    if (walletCapabilitiesString) {
      const walletCapabilities = parseWalletCapabilities(walletCapabilitiesString)
      const accountCapabilities = walletCapabilities[params]
      if (accountCapabilities) {
        return accountCapabilities
      }
    }

    return await provider.request({ method: 'wallet_getCapabilities', params: [params] })
  }

  public async grantPermissions(params: AdapterBlueprint.GrantPermissionsParams) {
    if (!this.wagmiConfig) {
      throw new Error('connectionControllerClient:grantPermissions - wagmiConfig is undefined')
    }

    const connections = getConnections(this.wagmiConfig)
    const connection = connections[0]

    const connector = connection ? this.getWagmiConnector(connection.connector.id) : null

    if (!connector) {
      throw new Error('connectionControllerClient:grantPermissions - connector is undefined')
    }

    const provider = (await connector.getProvider()) as UniversalProvider

    if (!provider) {
      throw new Error('connectionControllerClient:grantPermissions - provider is undefined')
    }

    return provider.request({ method: 'wallet_grantPermissions', params })
  }

  public async revokePermissions(
    params: AdapterBlueprint.RevokePermissionsParams
  ): Promise<`0x${string}`> {
    if (!this.wagmiConfig) {
      throw new Error('connectionControllerClient:revokePermissions - wagmiConfig is undefined')
    }

    const connections = getConnections(this.wagmiConfig)
    const connection = connections[0]

    const connector = connection ? this.getWagmiConnector(connection.connector.id) : null

    if (!connector) {
      throw new Error('connectionControllerClient:revokePermissions - connector is undefined')
    }

    const provider = (await connector.getProvider()) as UniversalProvider

    if (!provider) {
      throw new Error('connectionControllerClient:revokePermissions - provider is undefined')
    }

    return provider.request({ method: 'wallet_revokePermissions', params })
  }

  public async walletGetAssets(
    params: AdapterBlueprint.WalletGetAssetsParams
  ): Promise<AdapterBlueprint.WalletGetAssetsResponse> {
    if (!this.wagmiConfig) {
      throw new Error('connectionControllerClient:walletGetAssets - wagmiConfig is undefined')
    }

    const connections = getConnections(this.wagmiConfig)
    const connection = connections[0]

    const connector = connection ? this.getWagmiConnector(connection.connector.id) : null

    if (!connector) {
      throw new Error('connectionControllerClient:walletGetAssets - connector is undefined')
    }

    const provider = (await connector.getProvider()) as UniversalProvider

    if (!provider) {
      throw new Error('connectionControllerClient:walletGetAssets - provider is undefined')
    }

    return provider.request({ method: 'wallet_getAssets', params: [params] })
  }

  public override setUniversalProvider(universalProvider: UniversalProvider): void {
    const hasWalletConnectConnector = this.connectors.some(
      c => c.id === CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT
    )

    if (hasWalletConnectConnector) {
      return
    }

    this.addConnector(
      new WalletConnectConnector({
        provider: universalProvider,
        caipNetworks: this.caipNetworks || [],
        namespace: 'eip155'
      })
    )
  }
}
