import { type Balance, type CaipAddress, NumberUtil } from '@to-nexus/appkit-common'
import { ContractUtil } from '@to-nexus/appkit-common'
import { W3mFrameRpcConstants } from '@to-nexus/appkit-wallet'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import { subscribeKey as subKey } from 'valtio/vanilla/utils'

import { ConstantsUtil } from '../utils/ConstantsUtil.js'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { SendApiUtil } from '../utils/SendApiUtil.js'
import { type CustomData } from '../utils/TypeUtil.js'
import { AccountController } from './AccountController.js'
import { ChainController } from './ChainController.js'
import { ConnectionController } from './ConnectionController.js'
import { EventsController } from './EventsController.js'
import { RouterController } from './RouterController.js'
import { SnackController } from './SnackController.js'

// -- Types --------------------------------------------- //

export interface TxParams {
  receiverAddress: string
  sendTokenAmount: number
  decimals: string
  data?: string
  customData?: CustomData
  type?: number
  gas?: bigint
  gasPrice?: bigint
  maxFee?: bigint
  maxPriorityFee?: bigint
}

export interface ContractWriteParams {
  receiverAddress: string
  contractAddress: string
  sendTokenAmount: number
  decimals: string
  customData?: CustomData
  type?: number
  gas?: bigint
  gasPrice?: bigint
  maxFee?: bigint
  maxPriorityFee?: bigint
}
export interface SendControllerState {
  tokenBalances: Balance[]
  token?: Balance
  sendTokenAmount?: number
  receiverAddress?: string
  receiverProfileName?: string
  receiverProfileImageUrl?: string
  gasPrice?: bigint
  gasPriceInUSD?: number
  networkBalanceInUSD?: string
  loading: boolean
  lastRetry?: number
}

type StateKey = keyof SendControllerState

// -- State --------------------------------------------- //
const state = proxy<SendControllerState>({
  tokenBalances: [],
  loading: false
})

// -- Controller ---------------------------------------- //
export const SendController = {
  state,

  subscribe(callback: (newState: SendControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: SendControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  setToken(token: SendControllerState['token']) {
    if (token) {
      state.token = ref(token)
    }
  },

  setTokenAmount(sendTokenAmount: SendControllerState['sendTokenAmount']) {
    state.sendTokenAmount = sendTokenAmount
  },

  setReceiverAddress(receiverAddress: SendControllerState['receiverAddress']) {
    state.receiverAddress = receiverAddress
  },

  setReceiverProfileImageUrl(
    receiverProfileImageUrl: SendControllerState['receiverProfileImageUrl']
  ) {
    state.receiverProfileImageUrl = receiverProfileImageUrl
  },

  setReceiverProfileName(receiverProfileName: SendControllerState['receiverProfileName']) {
    state.receiverProfileName = receiverProfileName
  },

  setGasPrice(gasPrice: SendControllerState['gasPrice']) {
    state.gasPrice = gasPrice
  },

  setGasPriceInUsd(gasPriceInUSD: SendControllerState['gasPriceInUSD']) {
    state.gasPriceInUSD = gasPriceInUSD
  },

  setNetworkBalanceInUsd(networkBalanceInUSD: SendControllerState['networkBalanceInUSD']) {
    state.networkBalanceInUSD = networkBalanceInUSD
  },

  setLoading(loading: SendControllerState['loading']) {
    state.loading = loading
  },

  sendToken() {
    switch (ChainController.state.activeCaipNetwork?.chainNamespace) {
      case 'eip155':
        this.sendEvmToken()

        return
      case 'solana':
        this.sendSolanaToken()

        return
      default:
        throw new Error('Unsupported chain')
    }
  },

  sendEvmToken() {
    if (this.state.token?.address && this.state.sendTokenAmount && this.state.receiverAddress) {
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_INITIATED',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token.address,
          amount: this.state.sendTokenAmount,
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || ''
        }
      })
      this.sendERC20Token({
        receiverAddress: this.state.receiverAddress,
        contractAddress: this.state.token.address,
        sendTokenAmount: this.state.sendTokenAmount,
        decimals: this.state.token.quantity.decimals
      })
    } else if (
      this.state.receiverAddress &&
      this.state.sendTokenAmount &&
      this.state.gasPrice &&
      this.state.token?.quantity.decimals
    ) {
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_INITIATED',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token?.symbol,
          amount: this.state.sendTokenAmount,
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || ''
        }
      })
      this.sendNativeToken({
        receiverAddress: this.state.receiverAddress,
        sendTokenAmount: this.state.sendTokenAmount,
        gasPrice: this.state.gasPrice,
        decimals: this.state.token.quantity.decimals
      })
    } else {
      console.log(`invalid token. not native nor erc20`)
    }
  },

  // Not used in the appkit.
  async fetchTokenBalance(onError?: (error: unknown) => void): Promise<Balance[]> {
    state.loading = true
    const chainId = ChainController.state.activeCaipNetwork?.caipNetworkId
    const chain = ChainController.state.activeCaipNetwork?.chainNamespace
    const caipAddress = ChainController.state.activeCaipAddress
    const address = caipAddress ? CoreHelperUtil.getPlainAddress(caipAddress) : undefined
    if (
      state.lastRetry &&
      !CoreHelperUtil.isAllowedRetry(state.lastRetry, 30 * ConstantsUtil.ONE_SEC_MS)
    ) {
      state.loading = false

      return []
    }

    try {
      if (address && chainId && chain) {
        const balances = await SendApiUtil.getMyTokensWithBalance()
        state.tokenBalances = balances
        state.lastRetry = undefined

        return balances
      }
    } catch (error) {
      state.lastRetry = Date.now()

      onError?.(error)
      SnackController.showError('Token Balance Unavailable')
    } finally {
      state.loading = false
    }

    return []
  },

  fetchNetworkBalance() {
    if (state.tokenBalances.length === 0) {
      return
    }

    const networkTokenBalances = SendApiUtil.mapBalancesToSwapTokens(state.tokenBalances)
    if (!networkTokenBalances) {
      return
    }

    const networkToken = networkTokenBalances.find(
      token => token.address === ChainController.getActiveNetworkTokenAddress()
    )

    if (!networkToken) {
      return
    }

    state.networkBalanceInUSD = networkToken
      ? NumberUtil.multiply(networkToken.quantity.numeric, networkToken.price).toString()
      : '0'
  },

  isInsufficientNetworkTokenForGas(networkBalanceInUSD: string, gasPriceInUSD: number | undefined) {
    const gasPrice = gasPriceInUSD || '0'

    if (NumberUtil.bigNumber(networkBalanceInUSD).eq(0)) {
      return true
    }

    return NumberUtil.bigNumber(NumberUtil.bigNumber(gasPrice)).gt(networkBalanceInUSD)
  },

  hasInsufficientGasFunds() {
    let isInsufficientNetworkTokenForGas = true
    if (
      AccountController.state.preferredAccountType ===
      W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
    ) {
      // Smart Accounts may pay gas in any ERC20 token
      isInsufficientNetworkTokenForGas = false
    } else if (state.networkBalanceInUSD) {
      isInsufficientNetworkTokenForGas = this.isInsufficientNetworkTokenForGas(
        state.networkBalanceInUSD,
        state.gasPriceInUSD
      )
    }

    return isInsufficientNetworkTokenForGas
  },

  async sendNativeToken(params: TxParams) {
    try {
      RouterController.pushTransactionStack({
        view: 'Account',
        goBack: false
      })

      const to = params.receiverAddress as `0x${string}`
      const address = AccountController.state.address as `0x${string}`
      const value = ConnectionController.parseUnits(
        params.sendTokenAmount.toString(),
        Number(params.decimals)
      )

      const data = (params.data as `0x${string}`) ?? '0x'
      const customData = params.customData

      const type = params.type ?? ConstantsUtil.TRANSACTION_TYPE.LEGACY

      const gas = params.gas
      // Legacy fee
      const gasPrice = params.gasPrice
      // Dynamic fee
      const maxFee = params.maxFee
      const maxPriorityFee = params.maxPriorityFee

      const resTx = await ConnectionController.sendTransaction({
        chainNamespace: 'eip155',
        to,
        address,
        data,
        value: value ?? BigInt(0),
        gas,
        gasPrice,
        maxFee,
        maxPriorityFee,
        customData,
        type
      })

      SnackController.showSuccess('Transaction started')
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_SUCCESS',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token?.symbol || '',
          amount: params.sendTokenAmount,
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || ''
        }
      })
      this.resetSend()

      return resTx
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('SendController:sendNativeToken - failed to send native token', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_ERROR',
        properties: {
          message: errorMessage,
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token?.symbol || '',
          amount: params.sendTokenAmount,
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || ''
        }
      })
      SnackController.showError('Something went wrong')

      return null
    }
  },

  async sendERC20Token(params: ContractWriteParams) {
    try {
      RouterController.pushTransactionStack({
        view: 'Account',
        goBack: false
      })

      const amount = ConnectionController.parseUnits(
        params.sendTokenAmount.toString(),
        Number(params.decimals)
      )

      if (
        AccountController.state.address &&
        params.sendTokenAmount &&
        params.receiverAddress &&
        params.contractAddress
      ) {
        const contractAddress = CoreHelperUtil.getPlainAddress(
          params.contractAddress as CaipAddress
        ) as `0x${string}`

        const customData = params.customData

        const type = params.type ?? ConstantsUtil.TRANSACTION_TYPE.LEGACY

        const gas = params.gas
        // Legacy fee
        const gasPrice = params.gasPrice
        // Dynamic fee
        const maxFee = params.maxFee
        const maxPriorityFee = params.maxPriorityFee

        const resTx = await ConnectionController.writeContract({
          fromAddress: AccountController.state.address as `0x${string}`,
          contractAddress,
          args: [params.receiverAddress as `0x${string}`, amount ?? BigInt(0)],
          method: 'transfer',
          abi: ContractUtil.getERC20Abi(contractAddress),
          chainNamespace: 'eip155',
          customData,
          type,
          gas,
          gasPrice,
          maxFee,
          maxPriorityFee
        })

        SnackController.showSuccess('Transaction started')
        this.resetSend()

        return resTx
      }
      throw new Error('Invalid params to sendERC20Token')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('SendController:sendERC20Token - failed to send erc20 token', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_ERROR',
        properties: {
          message: errorMessage,
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token?.symbol || '',
          amount: params.sendTokenAmount,
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || ''
        }
      })
      SnackController.showError('Something went wrong')

      return null
    }
  },

  sendSolanaToken() {
    if (!this.state.sendTokenAmount || !this.state.receiverAddress) {
      SnackController.showError('Please enter a valid amount and receiver address')

      return
    }

    RouterController.pushTransactionStack({
      view: 'Account',
      goBack: false
    })

    ConnectionController.sendTransaction({
      chainNamespace: 'solana',
      to: this.state.receiverAddress as `0x${string}`,
      value: this.state.sendTokenAmount
    })
      .then(() => {
        this.resetSend()
        AccountController.fetchTokenBalance()
      })
      .catch(error => {
        SnackController.showError('Failed to send transaction. Please try again.')
        // eslint-disable-next-line no-console
        console.error('SendController:sendToken - failed to send solana transaction', error)
      })
  },

  resetSend() {
    state.token = undefined
    state.sendTokenAmount = undefined
    state.receiverAddress = undefined
    state.receiverProfileImageUrl = undefined
    state.receiverProfileName = undefined
    state.loading = false
    state.tokenBalances = []
  }
}
