/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppKit, type AppKitOptions, WcHelpersUtil } from '@to-nexus/appkit'
import type { AppKitNetwork, CaipNetwork, ChainNamespace } from '@to-nexus/appkit-common'
import {
  ConstantsUtil as CommonConstantsUtil,
  NetworkUtil,
  isReownName
} from '@to-nexus/appkit-common'
import { CoreHelperUtil, OptionsController, StorageUtil } from '@to-nexus/appkit-core'
import {
  type ConnectorType,
  ConstantsUtil as CoreConstantsUtil,
  type Provider
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

interface PendingTransactionsFilter {
  enable: boolean
  pollingInterval?: number
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

  constructor(
    configParams: Partial<CreateConfigParameters> & {
      networks: AppKitNetwork[]
      pendingTransactionsFilter?: PendingTransactionsFilter
      projectId: string
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
      connectors: [...connectors]
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
          this.emit('disconnect')
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
          this.emit('disconnect')
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
              version: '4',
              appName: options.metadata?.name ?? 'Unknown',
              appLogoUrl: options.metadata?.icons[0] ?? 'Unknown',
              preference: options.coinbasePreference ?? 'all'
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
      customConnectors.push(
        walletConnect(options, appKit, this.caipNetworks as [CaipNetwork, ...CaipNetwork[]])
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
      throw new Error('WagmiAdapter:signMessage - Sign message failed')
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
      throw new Error('WagmiAdapter:etherSignMessage - Sign message failed')
    }
  }

  public async signEIP712(
    _params: AdapterBlueprint.SignEIP712Params
  ): Promise<AdapterBlueprint.SignEIP712Result> {
    return Promise.resolve({} as unknown as AdapterBlueprint.SignEIP712Result)
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

      // Eth_signTypedData_v4 expects [address, typedDataJSON]
      const signature = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [account.address, JSON.stringify(params.paramsData)]
      })

      return { signature }
    } catch (error) {
      throw new Error(
        `WagmiAdapter:signTypedDataV4 - Sign typed data failed: ${(error as Error).message}`
      )
    }
  }

  public async sendTransaction(
    params: AdapterBlueprint.SendTransactionParams
  ): Promise<AdapterBlueprint.SendTransactionResult> {
    const { chainId } = getAccount(this.wagmiConfig)

    const txParams = {
      account: params.address,
      to: params.to as Hex,
      value: params.value as bigint,
      gas: params.gas as bigint,
      gasPrice: params.gasPrice as bigint,
      maxFee: params.maxFee as bigint,
      maxPriorityFee: params.maxPriorityFee as bigint,
      data: params.data as Hex,
      chainId,
      type: 'legacy' as const
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

    const tx = await wagmiWriteContract(this.wagmiConfig, {
      chain: this.wagmiChains?.[chainId],
      chainId,
      address: data.contractAddress,
      account: data.fromAddress,
      abi: data.abi,
      functionName: data.method,
      args: data.args,
      __mode: 'prepared'
    })

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
      throw new Error('WagmiAdapter:estimateGas - error estimating gas')
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

    /*
     * ✅ WalletConnect provider를 가져와서 WalletConnectConnector 인스턴스 생성
     * Wait a bit for connector to be fully initialized
     */
    await new Promise(resolve => setTimeout(resolve, 100))

    const walletConnectWagmiConnector = this.getWagmiConnector('walletConnect')
    if (walletConnectWagmiConnector) {
      try {
        const universalProvider =
          (await walletConnectWagmiConnector.getProvider()) as UniversalProvider
        if (universalProvider) {
          this.setUniversalProvider(universalProvider)
        }
      } catch (error) {
        console.warn('Failed to get WalletConnect provider:', error)
      }
    }

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
          // Cross Extension의 경우 React example처럼 wallet_revokePermissions 호출
          if (connector.id === 'nexus.to.crosswallet.desktop') {
            try {
              const provider = (await connector.getProvider()) as Provider | undefined
              if (provider && typeof provider.request === 'function') {
                await this.revokeProviderPermissions(provider)
              }
            } catch (error) {
              console.log('Failed to revoke permissions:', error)
            }
          }

          await wagmiDisconnect(this.wagmiConfig, { connector })
        }
      })
    )
  }

  private async revokeProviderPermissions(provider: Provider) {
    try {
      const permissions: { parentCapability: string }[] = await provider.request({
        method: 'wallet_getPermissions'
      })
      const ethAccountsPermission = permissions.find(
        permission => permission.parentCapability === 'eth_accounts'
      )

      if (ethAccountsPermission) {
        await provider.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        })
        console.log('✅ Permissions revoked successfully')
      }
    } catch (error) {
      /*
       * Wallet_getPermissions 호출 자체가 Extension 상태를 초기화하는 효과가 있음
       * 에러가 발생해도 정상 동작 (React example과 동일)
       */
      // Console.warn('Could not revoke permissions from wallet. Disconnecting...', error)
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
    this.addConnector(
      new WalletConnectConnector({
        provider: universalProvider,
        caipNetworks: this.caipNetworks || [],
        namespace: 'eip155'
      })
    )
  }
}
