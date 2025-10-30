import { type AppKitOptions, WcConstantsUtil } from '@to-nexus/appkit'
import type { CaipNetwork } from '@to-nexus/appkit-common'
import { ConstantsUtil as CommonConstantsUtil, ParseUtil } from '@to-nexus/appkit-common'
import {
  AccountController,
  ChainController,
  type CombinedProvider,
  type Connector,
  type ConnectorType,
  CoreHelperUtil,
  OptionsController,
  type Provider,
  StorageUtil
} from '@to-nexus/appkit-core'
import { ConstantsUtil, PresetsUtil } from '@to-nexus/appkit-utils'
import { EthersHelpersUtil, type ProviderType } from '@to-nexus/appkit-utils/ethers'
import type { W3mFrameProvider } from '@to-nexus/appkit-wallet'
import { AdapterBlueprint } from '@to-nexus/appkit/adapters'
import { WalletConnectConnector } from '@to-nexus/appkit/connectors'
import { ProviderUtil } from '@to-nexus/appkit/store'
import UniversalProvider from '@to-nexus/universal-provider'
import { InfuraProvider, JsonRpcProvider, Signature, formatEther } from 'ethers'

import { EthersMethods } from './utils/EthersMethods.js'

export interface EIP6963ProviderDetail {
  info: Connector['info']
  provider: Provider
}

export class EthersAdapter extends AdapterBlueprint {
  private ethersConfig?: ProviderType
  public adapterType = 'ethers'
  private balancePromises: Record<string, Promise<AdapterBlueprint.GetBalanceResult>> = {}

  constructor() {
    super({})
    this.namespace = CommonConstantsUtil.CHAIN.EVM
  }

  private async createEthersConfig(options: AppKitOptions) {
    if (!options.metadata) {
      return undefined
    }
    let injectedProvider: Provider | undefined = undefined

    function getInjectedProvider() {
      if (injectedProvider) {
        return injectedProvider
      }

      if (typeof window === 'undefined') {
        return undefined
      }

      if (!window.ethereum) {
        return undefined
      }

      //  @ts-expect-error window.ethereum satisfies Provider
      injectedProvider = window.ethereum

      return injectedProvider
    }

    async function getCoinbaseProvider() {
      try {
        const { createCoinbaseWalletSDK } = await import('@coinbase/wallet-sdk')

        if (typeof window === 'undefined') {
          return undefined
        }

        const coinbaseSdk = createCoinbaseWalletSDK({
          appName: options?.metadata?.name,
          appLogoUrl: options?.metadata?.icons[0],
          appChainIds: options.networks?.map(caipNetwork => caipNetwork.id as number) || [1, 84532],
          preference: {
            options: options.coinbasePreference ?? 'all'
          }
        })

        return coinbaseSdk.getProvider()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to import Coinbase Wallet SDK:', error)

        return undefined
      }
    }

    const providers: ProviderType = { metadata: options.metadata }

    if (options.enableInjected !== false) {
      providers.injected = getInjectedProvider()
    }

    if (options.enableCoinbase !== false) {
      const coinbaseProvider = await getCoinbaseProvider()

      if (coinbaseProvider) {
        providers.coinbase = coinbaseProvider
      }
    }

    providers.EIP6963 = options.enableEIP6963 !== false

    return providers
  }

  public async signMessage(
    params: AdapterBlueprint.SignMessageParams
  ): Promise<AdapterBlueprint.SignMessageResult> {
    const { message, address, provider } = params

    if (!provider) {
      throw new Error('Provider is undefined')
    }
    try {
      const signature = await EthersMethods.signMessage(
        message,
        provider as Provider,
        address,
        params.customData
      )

      return { signature }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      throw new Error(`EthersAdapter:signMessage - Sign message failed: ${errorMessage}`)
    }
  }

  public async etherSignMessage(
    params: AdapterBlueprint.EtherSignMessageParams
  ): Promise<AdapterBlueprint.EtherSignMessageResult> {
    const { message, address, provider } = params
    if (!provider) {
      throw new Error('Provider is undefined')
    }
    try {
      const signature = await EthersMethods.etherSignMessage(message, address, provider as Provider)

      return { signature }
    } catch (error) {
      throw new Error('EthersAdapter:etherSignMessage - Sign message failed')
    }
  }

  /**
   * @description Legacy EIP-712 signing method for ERC-2612 permit signatures only
   *
   * ⚠️ DEPRECATED: This method is limited to ERC-2612 permit signatures and should not be used
   * for new implementations. Use signTypedDataV4 instead for a generic, standards-compliant solution.
   *
   * This adapter method specifically handles token permit signatures with hardcoded structure:
   * - Only works with ERC-2612 permit domain/message format
   * - Cannot handle arbitrary EIP-712 typed data structures
   * - Limited to specific contractAddress/spenderAddress/value scenarios
   *
   * @param {AdapterBlueprint.SignEIP712Params} params - ERC-2612 permit-specific parameters
   * @returns {Promise<AdapterBlueprint.SignEIP712Result>} Object containing the permit signature
   *
   * @deprecated Use signTypedDataV4 for new implementations
   * @see signTypedDataV4 for the improved, generic alternative
   */
  public async signEIP712(
    params: AdapterBlueprint.SignEIP712Params
  ): Promise<AdapterBlueprint.SignEIP712Result> {
    try {
      const signature = await EthersMethods.signEIP712(
        {
          contractAddress: params.contractAddress,
          fromAddress: params.fromAddress,
          spenderAddress: params.spenderAddress,
          value: params.value,
          name: params.name,
          nonce: params.nonce,
          deadline: params.deadline,
          chainNamespace: params.chainNamespace,
          chainId: params.chainId,
          customData: params.customData
        },
        params.provider as Provider
      )

      return { signature }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      throw new Error(`EthersAdapter:signEIP712 failed: ${errorMessage}`)
    }
  }

  /**
   * @description Universal EIP-712 typed data signing method using Ethers.js
   *
   * This is the recommended method for all EIP-712 signatures. It provides a generic,
   * flexible solution that can handle any EIP-712 structured data, replacing the
   * limited signEIP712 method which only works with ERC-2612 permits.
   *
   * Key advantages over signEIP712:
   * - ✅ Accepts any EIP-712 typed data structure from any source (API, client-side, etc.)
   * - ✅ Follows standard eth_signTypedData_v4 RPC specification exactly
   * - ✅ Compatible with pre-formatted typed data (API responses, external libraries)
   * - ✅ Works with custom domain separators and message types
   * - ✅ Maintains full backward compatibility
   *
   * The method expects paramsData in the format: [signerAddress, typedDataStructure]
   * which directly matches the eth_signTypedData_v4 RPC call parameters.
   *
   * @param {AdapterBlueprint.SignTypedDataV4Params} params - Generic typed data parameters
   * @param {[string, any]} params.paramsData - Tuple of [address, typedData] matching RPC params
   * @param {Provider} [params.provider] - Ethers provider instance
   * @param {CustomData} [params.customData] - Optional metadata for the signature request
   * @returns {Promise<AdapterBlueprint.SignTypedDataV4Result>} Object containing the signature
   *
   * @example
   * // Using pre-formatted typed data (e.g., from API response)
   * const apiResponse = await fetch('/api/signature-request');
   * const result = await adapter.signTypedDataV4({
   *   paramsData: apiResponse.data.params, // [address, typedData]
   *   provider: ethersProvider,
   *   customData: { description: 'API signature request' }
   * });
   *
   * @example
   * // Using manually constructed typed data
   * const result = await adapter.signTypedDataV4({
   *   paramsData: [
   *     "0x1234...5678",
   *     {
   *       domain: { name: "MyApp", version: "1", chainId: 1, verifyingContract: "0x..." },
   *       types: { EIP712Domain: [...], MyType: [...] },
   *       primaryType: "MyType",
   *       message: { field1: "value1", field2: 123 }
   *     }
   *   ],
   *   provider: ethersProvider
   * });
   */
  public async signTypedDataV4(
    params: AdapterBlueprint.SignTypedDataV4Params
  ): Promise<AdapterBlueprint.SignTypedDataV4Result> {
    try {
      const signature = await EthersMethods.signTypedDataV4(
        params.paramsData,
        params.provider as Provider,
        params.customData
      )

      return { signature }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      throw new Error(`EthersAdapter:signTypedDataV4 failed: ${errorMessage}`)
    }
  }

  public async sendTransaction(
    params: AdapterBlueprint.SendTransactionParams
  ): Promise<AdapterBlueprint.SendTransactionResult> {
    if (!params.provider) {
      throw new Error('Provider is undefined')
    }

    const tx = await EthersMethods.sendTransaction(
      {
        value: params.value as bigint,
        to: params.to as `0x${string}`,
        data: params.data as `0x${string}`,
        gas: params.gas as bigint,
        gasPrice: params.gasPrice as bigint,
        maxFee: params.maxFee as bigint,
        maxPriorityFee: params.maxPriorityFee as bigint,
        address: params.address,
        customData: params.customData,
        type: params.type
      },
      params.provider as Provider,
      params.address,
      Number(params.caipNetwork?.id)
    )

    return { hash: tx }
  }

  public async writeContract(
    params: AdapterBlueprint.WriteContractParams
  ): Promise<AdapterBlueprint.WriteContractResult> {
    if (!params.provider) {
      throw new Error('Provider is undefined')
    }

    const { address } = ParseUtil.parseCaipAddress(params.caipAddress)
    const result = await EthersMethods.writeContract(
      {
        contractAddress: params.contractAddress,
        fromAddress: params.fromAddress,
        method: params.method,
        abi: params.abi,
        args: params.args,
        customData: params.customData,
        chainNamespace: params.caipNetwork?.chainNamespace,
        type: params.type
      },
      params.provider as Provider,
      address,
      Number(params.caipNetwork?.id)
    )

    return { hash: result }
  }

  public async readContract(
    params: AdapterBlueprint.ReadContractParams
  ): Promise<AdapterBlueprint.ReadContractResult> {
    const { provider } = params
    if (!provider) {
      throw new Error('Provider is undefined')
    }
    const result = await EthersMethods.readContract(
      params,
      provider as Provider,
      Number(params.caipNetwork?.id)
    )

    return result
  }

  public async estimateGas(
    params: AdapterBlueprint.EstimateGasTransactionArgs
  ): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    const { provider, caipNetwork, address } = params
    if (!provider) {
      throw new Error('Provider is undefined')
    }

    try {
      const result = await EthersMethods.estimateGas(
        {
          data: params.data as `0x${string}`,
          to: params.to as `0x${string}`,
          address: address as `0x${string}`
        },
        provider as Provider,
        address as `0x${string}`,
        Number(caipNetwork?.id)
      )

      return { gas: result }
    } catch (error) {
      throw new Error('EthersAdapter:estimateGas - Estimate gas failed')
    }
  }

  public async getEnsAddress(
    params: AdapterBlueprint.GetEnsAddressParams
  ): Promise<AdapterBlueprint.GetEnsAddressResult> {
    const { name, caipNetwork } = params
    if (caipNetwork) {
      const result = await EthersMethods.getEnsAddress(name, caipNetwork)

      return { address: result as string }
    }

    return { address: '' }
  }

  public parseUnits(params: AdapterBlueprint.ParseUnitsParams): AdapterBlueprint.ParseUnitsResult {
    return EthersMethods.parseUnits(params.value, params.decimals)
  }

  public formatUnits(
    params: AdapterBlueprint.FormatUnitsParams
  ): AdapterBlueprint.FormatUnitsResult {
    return EthersMethods.formatUnits(params.value, params.decimals)
  }

  public async syncConnection(
    params: AdapterBlueprint.SyncConnectionParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    const { id, chainId } = params

    const connector = this.connectors.find(c => c.id === id)

    const selectedProvider = connector?.provider as Provider

    if (!selectedProvider) {
      throw new Error('Provider not found')
    }

    const accounts: string[] = await selectedProvider.request({
      method: 'eth_requestAccounts'
    })

    const requestChainId = await selectedProvider.request({
      method: 'eth_chainId'
    })

    this.listenProviderEvents(selectedProvider)

    if (!accounts[0]) {
      throw new Error('No accounts found')
    }

    if (!connector?.type) {
      throw new Error('Connector type not found')
    }

    return {
      address: accounts[0],
      chainId: Number(requestChainId) || Number(chainId),
      provider: selectedProvider,
      type: connector.type,
      id
    }
  }

  override async syncConnectors(options: AppKitOptions): Promise<void> {
    this.ethersConfig = await this.createEthersConfig(options)

    if (this.ethersConfig?.EIP6963) {
      this.listenInjectedConnector(true)
    }

    const connectors = Object.keys(this.ethersConfig || {}).filter(
      key => key !== 'metadata' && key !== 'EIP6963'
    )

    connectors.forEach(connector => {
      const key = connector === 'coinbase' ? 'coinbaseWalletSDK' : connector

      const isInjectedConnector = connector === CommonConstantsUtil.CONNECTOR_ID.INJECTED

      if (this.namespace) {
        this.addConnector({
          id: key,
          explorerId: PresetsUtil.ConnectorExplorerIds[key],
          imageUrl: options?.connectorImages?.[key],
          name: PresetsUtil.ConnectorNamesMap[key] || 'Unknown',
          imageId: PresetsUtil.ConnectorImageIds[key],
          type: PresetsUtil.ConnectorTypesMap[key] ?? 'EXTERNAL',
          info: isInjectedConnector ? undefined : { rdns: key },
          chain: this.namespace,
          chains: [],
          provider: this.ethersConfig?.[connector as keyof ProviderType] as Provider
        })
      }
    })
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

  private eip6963EventHandler(event: CustomEventInit<EIP6963ProviderDetail>) {
    if (event.detail) {
      const { info, provider } = event.detail
      const existingConnector = this.connectors?.find(c => c.name === info?.name)

      if (!existingConnector) {
        const type = PresetsUtil.ConnectorTypesMap[CommonConstantsUtil.CONNECTOR_ID.EIP6963]

        const id = info?.rdns || info?.name || info?.uuid
        if (type && this.namespace && id) {
          this.addConnector({
            id,
            type,
            imageUrl: info?.icon,
            name: info?.name || 'Unknown',
            provider,
            info,
            chain: this.namespace,
            chains: []
          })
        }
      }
    }
  }

  private listenInjectedConnector(enableEIP6963: boolean) {
    if (typeof window !== 'undefined' && enableEIP6963) {
      const handler = this.eip6963EventHandler.bind(this)
      window.addEventListener(ConstantsUtil.EIP6963_CROSS_ANNOUNCE_EVENT, handler)
      window.dispatchEvent(new Event(ConstantsUtil.EIP6963_CROSS_REQUEST_EVENT))
    }
  }

  public async connect({
    id,
    type,
    chainId
  }: AdapterBlueprint.ConnectParams): Promise<AdapterBlueprint.ConnectResult> {
    const connector = this.connectors.find(c => c.id === id)
    const selectedProvider = connector?.provider as Provider

    if (!selectedProvider) {
      throw new Error('Provider not found')
    }

    // Extension 연결 시작 전 기존 연결 자동 해제 (지갑에 disconnect 이벤트 전달)
    if (type === 'ANNOUNCED' || type === 'INJECTED' || type === 'EXTERNAL') {
      try {
        const isAlreadyConnected = Boolean(AccountController.state.address)
        if (isAlreadyConnected) {
          await ChainController.disconnect()
        }
      } catch (error) {
        // 기존 연결 해제 중 오류 발생 시 계속 진행
      }
    }

    let accounts: string[] = []

    let requestChainId: string | undefined = undefined

    if (type === 'AUTH') {
      const { address } = await (selectedProvider as unknown as W3mFrameProvider).connect({
        chainId,
        preferredAccountType: OptionsController.state.defaultAccountTypes.eip155
      })

      accounts = [address]
      console.log(`EthersAdapter:connect - type is AUTH, target chainId: ${chainId}`)
    } else {
      accounts = await selectedProvider.request({
        method: 'eth_requestAccounts'
      })

      // Extension 응답 수신 시점에서 기존 연결 정리 (타이밍 이슈 방지)
      const currentAddress = AccountController.state.address
      if (currentAddress && currentAddress !== accounts?.[0]) {
        try {
          await ChainController.disconnect()
        } catch (error) {
          // 기존 연결 정리 중 오류 발생 시 계속 진행
        }
      }

      requestChainId = await selectedProvider.request({
        method: 'eth_chainId'
      })

      console.log(
        `EthersAdapter:connect - eth_chainId from wallet: ${requestChainId} connecting chainId: ${chainId}`
      )

      if (requestChainId !== chainId) {
        const caipNetwork = this.caipNetworks?.find(n => n.id === chainId)

        if (!caipNetwork) {
          throw new Error('EthersAdapter:connect - could not find the caipNetwork to switch')
        }

        try {
          await this.switchNetwork({
            caipNetwork,
            provider: selectedProvider,
            providerType: type as ConnectorType
          })
        } catch (error) {
          throw new Error('EthersAdapter:connect - Switch network failed')
        }
      }

      this.listenProviderEvents(selectedProvider)
    }

    return {
      address: accounts[0] as `0x${string}`,
      chainId: Number(chainId),
      provider: selectedProvider,
      type: type as ConnectorType,
      id
    }
  }

  public override async reconnect(params: AdapterBlueprint.ConnectParams): Promise<void> {
    const { id, chainId } = params

    const connector = this.connectors.find(c => c.id === id)

    if (connector && connector.type === 'AUTH' && chainId) {
      await (connector.provider as W3mFrameProvider).connect({
        chainId,
        preferredAccountType: OptionsController.state.defaultAccountTypes.eip155
      })
    }
  }

  public async getAccounts(
    params: AdapterBlueprint.GetAccountsParams
  ): Promise<AdapterBlueprint.GetAccountsResult> {
    const connector = this.connectors.find(c => c.id === params.id)
    const selectedProvider = connector?.provider as Provider

    if (!selectedProvider || !connector) {
      throw new Error('Provider not found')
    }

    if (params.id === CommonConstantsUtil.CONNECTOR_ID.AUTH) {
      const provider = connector['provider'] as W3mFrameProvider
      const { address, accounts } = await provider.connect()

      return Promise.resolve({
        accounts: (accounts || [{ address, type: 'eoa' }]).map(account =>
          CoreHelperUtil.createAccount('eip155', account.address, account.type)
        )
      })
    }

    const accounts: string[] = await selectedProvider.request({
      method: 'eth_requestAccounts'
    })

    return {
      accounts: accounts.map(account => CoreHelperUtil.createAccount('eip155', account, 'eoa'))
    }
  }

  public async disconnect(params: AdapterBlueprint.DisconnectParams): Promise<void> {
    if (!params.provider || !params.providerType) {
      throw new Error('Provider or providerType not provided')
    }

    switch (params.providerType) {
      case 'WALLET_CONNECT':
        const universalProvider = params.provider as UniversalProvider
        console.log('🔥 [EthersAdapter] WALLET_CONNECT 연결 해제 시작')
        console.log('🔥 [EthersAdapter] UniversalProvider 객체:', {
          hasSession: Boolean(universalProvider.session),
          sessionTopic: universalProvider.session?.topic,
          sessionExpiry: universalProvider.session?.expiry,
          sessionSelf: universalProvider.session?.self,
          sessionPeer: universalProvider.session?.peer
        })

        if (universalProvider.session) {
          console.log('🔥 [EthersAdapter] 📋 세션 상세 정보:', {
            topic: universalProvider.session.topic,
            expiry: new Date(universalProvider.session.expiry * 1000).toISOString(),
            selfPublicKey: universalProvider.session.self.publicKey,
            peerMetadata: universalProvider.session.peer.metadata
          })

          try {
            console.log('🔥 [EthersAdapter] UniversalProvider.disconnect() 호출 중...')
            await universalProvider.disconnect()
            console.log('🔥 [EthersAdapter] ✅ UniversalProvider.disconnect() 성공!')
          } catch (error) {
            console.log('🔥 [EthersAdapter] ❌ UniversalProvider.disconnect() 실패:', error)
            throw error
          }
        } else {
          console.log('🔥 [EthersAdapter] ⚠️ WalletConnect 세션이 없어서 disconnect 생략')
        }
        break
      case 'AUTH':
        await params.provider.disconnect()
        break
      case 'ANNOUNCED':
      case 'EXTERNAL':
        await this.revokeProviderPermissions(params.provider as Provider)
        break
      default:
        throw new Error('Unsupported provider type')
    }
  }

  public async getBalance(
    params: AdapterBlueprint.GetBalanceParams
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    const caipNetwork = this.caipNetworks?.find((c: CaipNetwork) => c.id === params.chainId)

    if (caipNetwork && caipNetwork.chainNamespace === 'eip155') {
      const caipAddress = `${caipNetwork.caipNetworkId}:${params.address}`

      const cachedPromise = this.balancePromises[caipAddress]
      if (cachedPromise) {
        return cachedPromise
      }
      const cachedBalance = StorageUtil.getNativeBalanceCacheForCaipAddress(caipAddress)
      if (cachedBalance) {
        if (params.ignoreCache) {
          console.log(
            `found cached balance: ${cachedBalance.balance}, but proceed to getBalance by jsonRpcProvider`
          )
        } else {
          return { balance: cachedBalance.balance, symbol: cachedBalance.symbol }
        }
      }

      const jsonRpcProvider = new JsonRpcProvider(caipNetwork.rpcUrls.default.http[0], {
        chainId: caipNetwork.id as number,
        name: caipNetwork.name
      })

      if (jsonRpcProvider) {
        try {
          this.balancePromises[caipAddress] = new Promise<AdapterBlueprint.GetBalanceResult>(
            async resolve => {
              const balance = await jsonRpcProvider.getBalance(params.address)
              console.log(`address: ${params.address} raw balance: ${balance}`)

              const formattedBalance = formatEther(balance)

              StorageUtil.updateNativeBalanceCache({
                caipAddress,
                balance: formattedBalance,
                symbol: caipNetwork.nativeCurrency.symbol,
                timestamp: Date.now()
              })

              resolve({
                balance: formattedBalance,
                symbol: caipNetwork.nativeCurrency.symbol
              })
            }
          ).finally(() => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this.balancePromises[caipAddress]
          })

          return this.balancePromises[caipAddress] || { balance: '', symbol: '' }
        } catch (error) {
          return { balance: '', symbol: '' }
        }
      }
    }

    return { balance: '', symbol: '' }
  }

  public async getProfile(
    params: AdapterBlueprint.GetProfileParams
  ): Promise<AdapterBlueprint.GetProfileResult> {
    if (params.chainId === 1) {
      const ensProvider = new InfuraProvider('mainnet')
      const name = await ensProvider.lookupAddress(params.address)
      const avatar = await ensProvider.getAvatar(params.address)

      return { profileName: name || undefined, profileImage: avatar || undefined }
    }

    return { profileName: undefined, profileImage: undefined }
  }

  private providerHandlers: {
    disconnect: () => void
    accountsChanged: (accounts: string[]) => void
    chainChanged: (chainId: string) => void
  } | null = null

  private listenProviderEvents(provider: Provider | CombinedProvider) {
    const disconnect = () => {
      this.removeProviderListeners(provider)
      this.emit('disconnect')
    }

    const accountsChangedHandler = (accounts: string[]) => {
      if (accounts.length > 0) {
        this.emit('accountChanged', {
          address: accounts[0] as `0x${string}`
        })
      } else {
        disconnect()
      }
    }

    const chainChangedHandler = (chainId: string) => {
      const chainIdNumber =
        typeof chainId === 'string' ? EthersHelpersUtil.hexStringToNumber(chainId) : Number(chainId)

      this.emit('switchNetwork', { chainId: chainIdNumber })
    }

    provider.on('disconnect', disconnect)
    provider.on('accountsChanged', accountsChangedHandler)
    provider.on('chainChanged', chainChangedHandler)

    this.providerHandlers = {
      disconnect,
      accountsChanged: accountsChangedHandler,
      chainChanged: chainChangedHandler
    }
  }

  private removeProviderListeners(provider: Provider | CombinedProvider) {
    if (this.providerHandlers) {
      provider.removeListener('disconnect', this.providerHandlers.disconnect)
      provider.removeListener('accountsChanged', this.providerHandlers.accountsChanged)
      provider.removeListener('chainChanged', this.providerHandlers.chainChanged)
      this.providerHandlers = null
    }
  }

  public override async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams): Promise<void> {
    const { caipNetwork, provider, providerType } = params

    if (providerType === 'AUTH') {
      await super.switchNetwork(params)

      return
    }

    try {
      await (provider as Provider).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: EthersHelpersUtil.numberToHexString(caipNetwork.id) }]
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (switchError: any) {
      if (
        switchError.code === WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID ||
        switchError.code === WcConstantsUtil.ERROR_INVALID_CHAIN_ID ||
        switchError.code === WcConstantsUtil.ERROR_CODE_DEFAULT ||
        switchError?.data?.originalError?.code === WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID
      ) {
        await EthersHelpersUtil.addEthereumChain(provider as Provider, caipNetwork)
      } else if (
        providerType === 'ANNOUNCED' ||
        providerType === 'EXTERNAL' ||
        providerType === 'INJECTED'
      ) {
        throw new Error('Chain is not supported')
      }
    }
  }

  public getWalletConnectProvider(): AdapterBlueprint.GetWalletConnectProviderResult {
    return this.connectors.find(c => c.type === 'WALLET_CONNECT')?.provider as UniversalProvider
  }

  private async revokeProviderPermissions(provider: Provider | CombinedProvider) {
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
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.info('Could not revoke permissions from wallet. Disconnecting...', error)
    }
  }

  public async getCapabilities(params: AdapterBlueprint.GetCapabilitiesParams): Promise<unknown> {
    const provider = ProviderUtil.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    const walletCapabilitiesString = provider.session?.sessionProperties?.['capabilities']
    if (walletCapabilitiesString) {
      const walletCapabilities = EthersMethods.parseWalletCapabilities(walletCapabilitiesString)
      const accountCapabilities = walletCapabilities[params]
      if (accountCapabilities) {
        return accountCapabilities
      }
    }

    return await provider.request({ method: 'wallet_getCapabilities', params: [params] })
  }

  public async grantPermissions(params: AdapterBlueprint.GrantPermissionsParams): Promise<unknown> {
    const provider = ProviderUtil.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    return await provider.request({ method: 'wallet_grantPermissions', params })
  }

  public async revokePermissions(
    params: AdapterBlueprint.RevokePermissionsParams
  ): Promise<`0x${string}`> {
    const provider = ProviderUtil.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    return await provider.request({ method: 'wallet_revokePermissions', params: [params] })
  }

  public async walletGetAssets(
    params: AdapterBlueprint.WalletGetAssetsParams
  ): Promise<AdapterBlueprint.WalletGetAssetsResponse> {
    const provider = ProviderUtil.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    return await provider.request({
      method: 'wallet_getAssets',
      params: [params]
    })
  }
}
