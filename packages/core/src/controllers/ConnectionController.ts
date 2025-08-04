import {
  type CaipNetwork,
  type ChainNamespace,
  ConstantsUtil,
  type CustomData
} from '@to-nexus/appkit-common'
import { type W3mFrameTypes } from '@to-nexus/appkit-wallet'
import { proxy, ref } from 'valtio/vanilla'
import { subscribeKey as subKey } from 'valtio/vanilla/utils'

import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { SIWXUtil } from '../utils/SIWXUtil.js'
import { StorageUtil } from '../utils/StorageUtil.js'
import type {
  Connector,
  EstimateGasTransactionArgs,
  ReadContractArgs,
  SendTransactionArgs,
  SignEIP712Args,
  SignTypedDataV4Args,
  WalletGetAssetsParams,
  WalletGetAssetsResponse,
  WcWallet,
  WriteContractArgs
} from '../utils/TypeUtil.js'
import { ChainController } from './ChainController.js'
import { ConnectorController } from './ConnectorController.js'
import { EventsController } from './EventsController.js'
import { ModalController } from './ModalController.js'
import { TransactionsController } from './TransactionsController.js'

// -- Types --------------------------------------------- //
export interface ConnectExternalOptions {
  id: Connector['id']
  type: Connector['type']
  provider?: Connector['provider']
  info?: Connector['info']
  chain?: ChainNamespace
  chainId?: number | string
  caipNetwork?: CaipNetwork
}

export interface ConnectionControllerClient {
  connectWalletConnect?: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (params: { message: string; customData?: CustomData }) => Promise<string>
  signEIP712: (args: SignEIP712Args) => Promise<string>
  signTypedDataV4: (paramsData: SignTypedDataV4Args, customData?: CustomData) => Promise<string>
  sendTransaction: (args: SendTransactionArgs) => Promise<{ hash: `0x${string}` } | null>
  estimateGas: (args: EstimateGasTransactionArgs) => Promise<bigint>
  parseUnits: (value: string, decimals: number) => bigint
  formatUnits: (value: bigint, decimals: number) => string
  connectExternal?: (options: ConnectExternalOptions) => Promise<void>
  reconnectExternal?: (options: ConnectExternalOptions) => Promise<void>
  checkInstalled?: (ids?: string[]) => boolean
  writeContract: (args: WriteContractArgs) => Promise<{ hash: `0x${string}` } | null>
  readContract: (args: ReadContractArgs) => Promise<unknown>
  getEnsAddress: (value: string) => Promise<false | string>
  getEnsAvatar: (value: string) => Promise<false | string>
  grantPermissions: (params: readonly unknown[] | object) => Promise<unknown>
  revokePermissions: (params: {
    pci: string
    permissions: unknown[]
    expiry: number
    address: `0x${string}`
  }) => Promise<`0x${string}`>
  getCapabilities: (params: string) => Promise<unknown>
  walletGetAssets: (params: WalletGetAssetsParams) => Promise<WalletGetAssetsResponse>
}

export interface ConnectionControllerState {
  _client?: ConnectionControllerClient
  wcUri?: string
  wcPairingExpiry?: number
  wcLinking?: {
    href: string
    name: string
  }
  wcError?: boolean
  recentWallet?: WcWallet
  buffering: boolean
  status?: 'connecting' | 'connected' | 'disconnected'
  connectionControllerClient?: ConnectionControllerClient
}

type StateKey = keyof ConnectionControllerState

// -- State --------------------------------------------- //
const state = proxy<ConnectionControllerState>({
  wcError: false,
  buffering: false,
  status: 'disconnected'
})

// eslint-disable-next-line init-declarations
let wcConnectionPromise: Promise<void> | undefined
// -- Controller ---------------------------------------- //
export const ConnectionController = {
  state,
  subscribeKey<K extends StateKey>(
    key: K,
    callback: (value: ConnectionControllerState[K]) => void
  ) {
    return subKey(state, key, callback)
  },

  _getClient() {
    return state._client
  },

  setClient(client: ConnectionControllerClient) {
    state._client = ref(client)
  },

  async connectWalletConnect() {
    console.log('###?? connectWalletConnect : start ', new Date().toLocaleTimeString())
    // Connect all namespaces to WalletConnect
    const namespaces = [...ChainController.state.chains.keys()]
    namespaces.forEach(namespace => {
      StorageUtil.setConnectedConnectorId(namespace, ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT)
    })

    if (CoreHelperUtil.isTelegram() || (CoreHelperUtil.isSafari() && CoreHelperUtil.isIos())) {
      if (wcConnectionPromise) {
        await wcConnectionPromise
        wcConnectionPromise = undefined

        return
      }

      if (!CoreHelperUtil.isPairingExpired(state?.wcPairingExpiry)) {
        const link = state.wcUri
        state.wcUri = link

        return
      }
      wcConnectionPromise = this._getClient()
        ?.connectWalletConnect?.()
        .catch(() => undefined)
      this.state.status = 'connecting'
      await wcConnectionPromise
      wcConnectionPromise = undefined
      state.wcPairingExpiry = undefined
      this.state.status = 'connected'
    } else {
      await this._getClient()?.connectWalletConnect?.()
    }
  },

  async connectExternal(options: ConnectExternalOptions, chain: ChainNamespace, setChain = true) {
    console.log('###?? connectExternal : start ', new Date().toLocaleTimeString())
    await this._getClient()?.connectExternal?.(options)

    if (setChain) {
      ChainController.setActiveNamespace(chain)
    }
  },

  async reconnectExternal(options: ConnectExternalOptions) {
    console.log('###?? reconnectExternal : start ', new Date().toLocaleTimeString())
    await this._getClient()?.reconnectExternal?.(options)
    const namespace = options.chain || ChainController.state.activeChain
    if (namespace) {
      StorageUtil.setConnectedConnectorId(namespace, options.id)
    }
  },

  async setPreferredAccountType(accountType: W3mFrameTypes.AccountType) {
    console.log('###?? setPreferredAccountType : start ', new Date().toLocaleTimeString())
    ModalController.setLoading(true)
    const authConnector = ConnectorController.getAuthConnector()
    if (!authConnector) {
      return
    }
    await authConnector?.provider.setPreferredAccount(accountType)
    await this.reconnectExternal(authConnector)
    ModalController.setLoading(false)
    EventsController.sendEvent({
      type: 'track',
      event: 'SET_PREFERRED_ACCOUNT_TYPE',
      properties: {
        accountType,
        network: ChainController.state.activeCaipNetwork?.caipNetworkId || ''
      }
    })
  },

  async signMessage(params: { message: string; customData?: CustomData }) {
    console.log('###?? signMessage : start ', new Date().toLocaleTimeString())

    return this._getClient()?.signMessage(params)
  },

  async signEIP712(args: SignEIP712Args) {
    console.log('###?? signEIP712 : start ConnectionController : ', new Date().toLocaleTimeString())

    return this._getClient()?.signEIP712(args)
  },

  async signTypedDataV4(paramsData: SignTypedDataV4Args, customData?: CustomData) {
    return this._getClient()?.signTypedDataV4(paramsData, customData)
  },

  parseUnits(value: string, decimals: number) {
    return this._getClient()?.parseUnits(value, decimals)
  },

  formatUnits(value: bigint, decimals: number) {
    return this._getClient()?.formatUnits(value, decimals)
  },

  async sendTransaction(args: SendTransactionArgs) {
    console.log('###?? sendTransaction : start ', new Date().toLocaleTimeString())

    return this._getClient()?.sendTransaction(args)
  },

  async getCapabilities(params: string) {
    console.log('###?? getCapabilities : start ', new Date().toLocaleTimeString())

    return this._getClient()?.getCapabilities(params)
  },

  async grantPermissions(params: object | readonly unknown[]) {
    console.log('###?? grantPermissions : start ', new Date().toLocaleTimeString())

    return this._getClient()?.grantPermissions(params)
  },

  async walletGetAssets(params: WalletGetAssetsParams): Promise<WalletGetAssetsResponse> {
    console.log('###?? walletGetAssets : start ', new Date().toLocaleTimeString())

    return this._getClient()?.walletGetAssets(params) ?? {}
  },

  async estimateGas(args: EstimateGasTransactionArgs) {
    console.log('###?? estimateGas : start ', new Date().toLocaleTimeString())

    return this._getClient()?.estimateGas(args)
  },

  async writeContract(args: WriteContractArgs) {
    console.log('###?? writeContract : start ', new Date().toLocaleTimeString())

    return this._getClient()?.writeContract(args)
  },

  async readContract(args: ReadContractArgs) {
    console.log('###?? readContract : start ', new Date().toLocaleTimeString())

    return this._getClient()?.readContract(args)
  },

  async getEnsAddress(value: string) {
    console.log('###?? getEnsAddress : start ', new Date().toLocaleTimeString())

    return this._getClient()?.getEnsAddress(value)
  },

  async getEnsAvatar(value: string) {
    console.log('###?? getEnsAvatar : start ', new Date().toLocaleTimeString())

    return this._getClient()?.getEnsAvatar(value)
  },

  checkInstalled(ids?: string[]) {
    return this._getClient()?.checkInstalled?.(ids) || false
  },

  resetWcConnection() {
    state.wcUri = undefined
    state.wcPairingExpiry = undefined
    state.wcLinking = undefined
    state.recentWallet = undefined
    state.status = 'disconnected'
    TransactionsController.resetTransactions()
    StorageUtil.deleteWalletConnectDeepLink()
  },

  setUri(uri: string) {
    state.wcUri = uri
    state.wcPairingExpiry = CoreHelperUtil.getPairingExpiry()
  },

  setWcLinking(wcLinking: ConnectionControllerState['wcLinking']) {
    state.wcLinking = wcLinking
  },

  setWcError(wcError: ConnectionControllerState['wcError']) {
    state.wcError = wcError
    state.buffering = false
  },

  setRecentWallet(wallet: ConnectionControllerState['recentWallet']) {
    state.recentWallet = wallet
  },

  setBuffering(buffering: ConnectionControllerState['buffering']) {
    state.buffering = buffering
  },

  setStatus(status: ConnectionControllerState['status']) {
    state.status = status
  },

  async disconnect() {
    console.log('###?? disconnect : start ', new Date().toLocaleTimeString())
    try {
      ModalController.setLoading(true)
      await SIWXUtil.clearSessions()
      await ChainController.disconnect()
      ModalController.setLoading(false)
    } catch (error) {
      throw new Error('Failed to disconnect')
    }
  }
}
