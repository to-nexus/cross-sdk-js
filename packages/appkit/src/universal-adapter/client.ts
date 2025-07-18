import { type ChainNamespace, ConstantsUtil } from '@to-nexus/appkit-common'
import {
  AccountController,
  ChainController,
  ConstantsUtil as CoreConstantsUtil,
  CoreHelperUtil
} from '@to-nexus/appkit-core'
import type UniversalProvider from '@to-nexus/universal-provider'
import bs58 from 'bs58'
import { toHex } from 'viem'

import { AdapterBlueprint } from '../adapters/ChainAdapterBlueprint.js'
import { WalletConnectConnector } from '../connectors/WalletConnectConnector.js'
import { WcConstantsUtil } from '../utils/ConstantsUtil.js'

export class UniversalAdapter extends AdapterBlueprint {
  public override setUniversalProvider(universalProvider: UniversalProvider): void {
    this.addConnector(
      new WalletConnectConnector({
        provider: universalProvider,
        caipNetworks: this.caipNetworks || [],
        namespace: this.namespace as ChainNamespace
      })
    )
  }

  public async connect(
    params: AdapterBlueprint.ConnectParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    console.log('###?? connect : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      id: 'WALLET_CONNECT',
      type: 'WALLET_CONNECT' as const,
      chainId: Number(params.chainId),
      provider: this.provider as UniversalProvider,
      address: ''
    })
  }

  public async disconnect() {
    console.log('###?? disconnect : start ', new Date().toLocaleTimeString())
    try {
      const connector = this.getWalletConnectConnector()
      await connector.disconnect()
    } catch (error) {
      console.warn('UniversalAdapter:disconnect - error', error)
    }
  }

  public async getAccounts({
    namespace
  }: AdapterBlueprint.GetAccountsParams & {
    namespace: ChainNamespace
  }): Promise<AdapterBlueprint.GetAccountsResult> {
    console.log('###?? getAccounts : start ', new Date().toLocaleTimeString())
    const provider = this.provider as UniversalProvider
    const addresses = (provider?.session?.namespaces?.[namespace]?.accounts
      ?.map(account => {
        const [, , address] = account.split(':')

        return address
      })
      .filter((address, index, self) => self.indexOf(address) === index) || []) as string[]

    return Promise.resolve({
      accounts: addresses.map(address =>
        CoreHelperUtil.createAccount(namespace, address, namespace === 'bip122' ? 'payment' : 'eoa')
      )
    })
  }

  override async syncConnectors() {
    console.log('###?? syncConnectors : start ', new Date().toLocaleTimeString())

    return Promise.resolve()
  }

  public async getBalance(
    params: AdapterBlueprint.GetBalanceParams
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    console.log('###?? getBalance : start ', new Date().toLocaleTimeString())
    const isBalanceSupported =
      params.caipNetwork &&
      CoreConstantsUtil.BALANCE_SUPPORTED_CHAINS.includes(params.caipNetwork?.chainNamespace)
    if (!isBalanceSupported || params.caipNetwork?.testnet) {
      return {
        balance: '0.00',
        symbol: params.caipNetwork?.nativeCurrency.symbol || ''
      }
    }

    if (
      AccountController.state.balanceLoading &&
      params.chainId === ChainController.state.activeCaipNetwork?.id
    ) {
      return {
        balance: AccountController.state.balance || '0.00',
        symbol: AccountController.state.balanceSymbol || ''
      }
    }

    const balances = await AccountController.fetchTokenBalance()
    const balance = balances.find(
      b =>
        b.chainId === `${params.caipNetwork?.chainNamespace}:${params.chainId}` &&
        b.symbol === params.caipNetwork?.nativeCurrency.symbol
    )

    return {
      balance: balance?.quantity.numeric || '0.00',
      symbol: balance?.symbol || params.caipNetwork?.nativeCurrency.symbol || ''
    }
  }

  public override async signEIP712(
    params: AdapterBlueprint.SignEIP712Params
  ): Promise<AdapterBlueprint.SignEIP712Result> {
    console.log('###?? signEIP712 : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      signature: ''
    })
  }

  public override async signMessage(
    params: AdapterBlueprint.SignMessageParams
  ): Promise<AdapterBlueprint.SignMessageResult> {
    console.log('###?? universalAdapter signMessage : start ', new Date().toLocaleTimeString())
    const { provider, message, address, customData } = params
    if (!provider) {
      throw new Error('UniversalAdapter:signMessage - provider is undefined')
    }

    console.log('###?? UniversalAdapter.provider info: providerType=', provider?.constructor?.name)
    console.log('###?? UniversalAdapter.provider info: message=', message)
    console.log('###?? UniversalAdapter.provider info: address=', address)

    let signature = ''

    if (ChainController.state.activeCaipNetwork?.chainNamespace === ConstantsUtil.CHAIN.SOLANA) {
      console.log(
        '###?? UniversalAdapter.provider.request : calling SOLANA personal_sign ',
        new Date().toLocaleTimeString()
      )

      const response = await provider.request(
        {
          method: 'solana_signMessage',
          params: {
            message: bs58.encode(new TextEncoder().encode(message)),
            pubkey: address
          }
        },
        ChainController.state.activeCaipNetwork?.caipNetworkId
      )

      console.log('###?? UniversalAdapter.provider.request : SOLANA response=', response)
      signature = (response as { signature: string }).signature
    } else {
      console.log(
        '###?? UniversalAdapter.provider.request : calling EVM personal_sign ',
        new Date().toLocaleTimeString()
      )

      signature = await provider.request(
        {
          method: 'personal_sign',
          params: [message, address, customData]
        },
        ChainController.state.activeCaipNetwork?.caipNetworkId
      )

      console.log('###?? UniversalAdapter.provider.request : EVM signature=', signature)
    }

    console.log('###?? universalAdapter signMessage : end ', new Date().toLocaleTimeString())

    return { signature }
  }

  // -- Transaction methods ---------------------------------------------------
  /**
   *
   * These methods are supported only on `wagmi` and `ethers` since the Solana SDK does not support them in the same way.
   * These function definition is to have a type parity between the clients. Currently not in use.
   */
  public override async estimateGas(): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    console.log('###?? estimateGas : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      gas: BigInt(0)
    })
  }

  public async getProfile(): Promise<AdapterBlueprint.GetProfileResult> {
    console.log('###?? getProfile : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      profileImage: '',
      profileName: ''
    })
  }

  public async sendTransaction(): Promise<AdapterBlueprint.SendTransactionResult> {
    console.log('###?? sendTransaction : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      hash: ''
    })
  }

  public override walletGetAssets(
    _params: AdapterBlueprint.WalletGetAssetsParams
  ): Promise<AdapterBlueprint.WalletGetAssetsResponse> {
    console.log('###?? walletGetAssets : start ', new Date().toLocaleTimeString())

    return Promise.resolve({})
  }

  public async writeContract(): Promise<AdapterBlueprint.WriteContractResult> {
    console.log('###?? writeContract : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      hash: ''
    })
  }

  public async readContract(): Promise<AdapterBlueprint.ReadContractResult> {
    console.log('###?? readContract : start ', new Date().toLocaleTimeString())

    return Promise.resolve({})
  }

  public async getEnsAddress(): Promise<AdapterBlueprint.GetEnsAddressResult> {
    console.log('###?? getEnsAddress : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      address: false
    })
  }

  public parseUnits(): AdapterBlueprint.ParseUnitsResult {
    return 0n
  }

  public formatUnits(): AdapterBlueprint.FormatUnitsResult {
    return '0'
  }

  public async getCapabilities(): Promise<unknown> {
    console.log('###?? getCapabilities : start ', new Date().toLocaleTimeString())

    return Promise.resolve({})
  }

  public async grantPermissions(): Promise<unknown> {
    console.log('###?? grantPermissions : start ', new Date().toLocaleTimeString())

    return Promise.resolve({})
  }

  public async revokePermissions(): Promise<`0x${string}`> {
    console.log('###?? revokePermissions : start ', new Date().toLocaleTimeString())

    return Promise.resolve('0x')
  }

  public async syncConnection() {
    console.log('###?? syncConnection : start ', new Date().toLocaleTimeString())

    return Promise.resolve({
      id: 'WALLET_CONNECT',
      type: 'WALLET_CONNECT' as const,
      chainId: 1,
      provider: this.provider as UniversalProvider,
      address: ''
    })
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams) {
    console.log('###?? switchNetwork : start ', new Date().toLocaleTimeString())
    const { caipNetwork } = params
    const connector = this.getWalletConnectConnector()

    if (caipNetwork.chainNamespace === ConstantsUtil.CHAIN.EVM) {
      try {
        await connector.provider?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: toHex(caipNetwork.id) }]
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (switchError: any) {
        if (
          switchError.code === WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID ||
          switchError.code === WcConstantsUtil.ERROR_INVALID_CHAIN_ID ||
          switchError.code === WcConstantsUtil.ERROR_CODE_DEFAULT ||
          switchError?.data?.originalError?.code ===
            WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID
        ) {
          try {
            await connector.provider?.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: toHex(caipNetwork.id),
                  rpcUrls: [caipNetwork?.rpcUrls['chainDefault']?.http],
                  chainName: caipNetwork.name,
                  nativeCurrency: caipNetwork.nativeCurrency,
                  blockExplorerUrls: [caipNetwork.blockExplorers?.default.url]
                }
              ]
            })
          } catch (error) {
            throw new Error('Chain is not supported')
          }
        }
      }
    }
    connector.provider.setDefaultChain(caipNetwork.caipNetworkId)
  }

  public getWalletConnectProvider() {
    const connector = this.connectors.find(c => c.type === 'WALLET_CONNECT')

    const provider = connector?.provider as UniversalProvider

    return provider
  }
}
