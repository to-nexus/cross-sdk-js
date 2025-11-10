import { type CaipNetwork, type ChainNamespace, ConstantsUtil } from '@to-nexus/appkit-common'
import { type SIWXSession, SIWXUtil } from '@to-nexus/appkit-core'
import { PresetsUtil } from '@to-nexus/appkit-utils'
import UniversalProvider from '@to-nexus/universal-provider'
import type { SessionTypes } from '@walletconnect/types'

import type { ChainAdapterConnector } from '../adapters/ChainAdapterConnector.js'
import { WcHelpersUtil } from '../utils/index.js'

export class WalletConnectConnector<Namespace extends ChainNamespace = ChainNamespace>
  implements ChainAdapterConnector
{
  public readonly id = ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT
  public readonly name = PresetsUtil.ConnectorNamesMap[
    ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT
  ] as string
  public readonly type = 'WALLET_CONNECT'
  public readonly imageId = PresetsUtil.ConnectorImageIds[ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT]
  public readonly chain: Namespace

  public provider: UniversalProvider

  protected caipNetworks: CaipNetwork[]

  constructor({ provider, caipNetworks, namespace }: WalletConnectConnector.Options<Namespace>) {
    this.caipNetworks = caipNetworks
    this.provider = provider
    this.chain = namespace
  }

  get chains() {
    return this.caipNetworks
  }

  async connectWalletConnect() {
    // Normal WalletConnect connection (wc_sessionProposal)
    const optionalNamespaces = WcHelpersUtil.createNamespaces(this.caipNetworks)

    await this.provider.connect({
      optionalNamespaces
    })

    return {
      clientId: await this.provider.client.core.crypto.getClientId(),
      session: this.provider.session as SessionTypes.Struct
    }
  }

  async authenticateWalletConnect(): Promise<{ authenticated: boolean; sessions: SIWXSession[] }> {
    // Wc_sessionAuthenticate 방식: 연결 + SIWE 한 번에
    const result = await this.authenticate()

    if (!result.authenticated) {
      // 인증 실패 시 일반 연결로 fallback
      const optionalNamespaces = WcHelpersUtil.createNamespaces(this.caipNetworks)
      await this.provider.connect({
        optionalNamespaces
      })

      return { authenticated: false, sessions: [] }
    }

    return result
  }

  async disconnect() {
    await this.provider.disconnect()
  }

  async authenticate(): Promise<{ authenticated: boolean; sessions: SIWXSession[] }> {
    const chains = this.chains.map(network => network.caipNetworkId)

    return SIWXUtil.universalProviderAuthenticate({
      universalProvider: this.provider,
      chains,
      methods: OPTIONAL_METHODS
    })
  }
}

export namespace WalletConnectConnector {
  export type Options<Namespace extends ChainNamespace> = {
    provider: UniversalProvider
    caipNetworks: CaipNetwork[]
    namespace: Namespace
  }

  export type ConnectResult = {
    clientId: string | null
    session: SessionTypes.Struct
  }
}

const OPTIONAL_METHODS = [
  'eth_accounts',
  'eth_requestAccounts',
  'eth_sendRawTransaction',
  'eth_sign',
  'eth_signTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'personal_sign',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_registerOnboarding',
  'wallet_watchAsset',
  'wallet_scanQRCode',
  // EIP-5792
  'wallet_getCallsStatus',
  'wallet_sendCalls',
  'wallet_getCapabilities',
  // EIP-7715
  'wallet_grantPermissions',
  'wallet_revokePermissions',
  //EIP-7811
  'wallet_getAssets'
]
