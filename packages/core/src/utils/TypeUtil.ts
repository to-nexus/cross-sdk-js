import type {
  AdapterType,
  AppKitNetwork,
  AppKitSdkVersion,
  Balance,
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ChainNamespace,
  SdkFramework,
  Transaction
} from '@to-nexus/appkit-common'
import type { W3mFrameProvider, W3mFrameTypes } from '@to-nexus/appkit-wallet'
import type UniversalProvider from '@to-nexus/universal-provider'

import type { AccountControllerState } from '../controllers/AccountController.js'
import type { ConnectionControllerClient } from '../controllers/ConnectionController.js'
import type { ReownName } from '../controllers/EnsController.js'
import type { OnRampProviderOption } from '../controllers/OnRampController.js'
import type { ConstantsUtil } from './ConstantsUtil.js'

type InitializeAppKitConfigs = {
  showWallets?: boolean
  siweConfig?: {
    options: {
      enabled?: boolean
      nonceRefetchIntervalMs?: number
      sessionRefetchIntervalMs?: number
      signOutOnDisconnect?: boolean
      signOutOnAccountChange?: boolean
      signOutOnNetworkChange?: boolean
    }
  }
  themeMode?: 'dark' | 'light'
  themeVariables?: ThemeVariables
  allowUnsupportedChain?: boolean
  networks: (string | number)[]
  defaultNetwork?: AppKitNetwork
  chainImages?: Record<number | string, string>
  connectorImages?: Record<string, string>
  coinbasePreference?: 'all' | 'smartWalletOnly' | 'eoaOnly'
  metadata?: Metadata
}

export type CaipNetworkCoinbaseNetwork =
  | 'Ethereum'
  | 'Arbitrum One'
  | 'Polygon'
  | 'Avalanche'
  | 'OP Mainnet'
  | 'Celo'

export type ConnectedWalletInfo = {
  name: string
  icon?: string
  type?: string
  [key: string]: unknown
}

export type User = {
  email?: string | null | undefined
  username?: string | null | undefined
}

export interface LinkingRecord {
  redirect: string
  href: string
}

export type ProjectId = string

export type Platform = 'mobile' | 'desktop' | 'browser' | 'web' | 'qrcode' | 'unsupported'

export type ConnectorType =
  | 'EXTERNAL'
  | 'WALLET_CONNECT'
  | 'INJECTED'
  | 'ANNOUNCED'
  | 'AUTH'
  | 'MULTI_CHAIN'
  | 'ID_AUTH'

export type SocialProvider =
  | 'google'
  | 'github'
  | 'apple'
  | 'facebook'
  | 'x'
  | 'discord'
  | 'farcaster'

export type Connector = {
  id: string
  type: ConnectorType
  name: string
  imageId?: string
  explorerId?: string
  imageUrl?: string
  info?: {
    uuid?: string
    name?: string
    icon?: string
    rdns?: string
  }
  provider?: Provider | W3mFrameProvider | UniversalProvider
  chain: ChainNamespace
  connectors?: Connector[]
}

export interface AuthConnector extends Connector {
  provider: W3mFrameProvider
  socials?: SocialProvider[]
  email?: boolean
}

export type CaipNamespaces = Record<
  string,
  {
    chains: CaipNetworkId[]
    methods: string[]
    events: string[]
  }
>

export type SdkVersion = `${SdkFramework}-${AdapterType}-${string}` | AppKitSdkVersion

export interface BaseError {
  message?: string
}

export type Metadata = {
  name: string
  description: string
  url: string
  icons: string[]
  redirect?: {
    universal?: string
  }
}

// -- ApiController Types -------------------------------------------------------
export interface WcWallet {
  id: string
  name: string
  badge_type?: BadgeType
  homepage?: string
  image_id?: string
  image_url?: string
  order?: number
  mobile_link?: string | null
  desktop_link?: string | null
  webapp_link?: string | null
  app_store?: string | null
  play_store?: string | null
  chrome_store?: string | null
  rdns?: string | null
  injected?:
    | {
        namespace?: string
        injected_id?: string
      }[]
    | null
}

export interface ApiGetWalletsRequest {
  page: number
  chains: string
  entries: number
  search?: string
  badge?: BadgeType
  include?: string[]
  exclude?: string[]
}

export interface ApiGetWalletsResponse {
  data: WcWallet[]
  count: number
}

export interface ApiGetAnalyticsConfigResponse {
  isAnalyticsEnabled: boolean
}

export interface ApiBalanceResponse extends ApiBaseReponse {
  data: Balance[]
}

export interface ApiGasPriceRequest {
  chainId: string
}

export interface ApiGasPriceResponse extends ApiBaseReponse {
  // CROSS api returns with code, message and data
  data: {
    standard: string
    fast: string
    instant: string
  }
}

export interface ApiBaseReponse {
  // CROSS api returns with code, message and data
  code?: number
  message?: string
  data?: any
}

export type ThemeMode = 'dark' | 'light'

export interface ThemeVariables {
  '--w3m-font-family'?: string
  '--w3m-accent'?: string
  '--w3m-color-mix'?: string
  '--w3m-color-mix-strength'?: number
  '--w3m-font-size-master'?: string
  '--w3m-border-radius-master'?: string
  '--w3m-z-index'?: number
  '--w3m-qr-color'?: string
}

// -- BlockchainApiController Types ---------------------------------------------
export interface BlockchainApiIdentityRequest {
  address: string
}

export interface BlockchainApiIdentityResponse {
  avatar: string | null
  name: string | null
}

export interface BlockchainApiTransactionsRequest {
  account: string
  cursor?: string
  onramp?: 'coinbase'
  signal?: AbortSignal
  cache?: RequestCache
  chainId?: string
}

export interface BlockchainApiTransactionsResponse {
  data: Transaction[]
  next: string | null
}

export type SwapToken = {
  name: string
  symbol: string
  address: CaipAddress
  decimals: number
  logoUri: string
  eip2612?: boolean
}

export type SwapTokenWithBalance = SwapToken & {
  quantity: {
    decimals: string
    numeric: string
  }
  price: number
  value: number
}

export interface BlockchainApiSwapTokensRequest {
  chainId?: string
}

export interface BlockchainApiSwapTokensResponse {
  tokens: SwapToken[]
}

export interface BlockchainApiSwapQuoteRequest {
  chainId?: string
  amount: string
  userAddress: string
  from: string
  to: string
  gasPrice: string
}

export interface BlockchainApiSwapQuoteResponse {
  quotes: {
    id: string | null
    fromAmount: string
    fromAccount: string
    toAmount: string
    toAccount: string
  }[]
}

export interface BlockchainApiTokenPriceRequest {
  currency?: 'usd' | 'eur' | 'gbp' | 'aud' | 'cad' | 'inr' | 'jpy' | 'btc' | 'eth'
  addresses: string[]
}

export interface BlockchainApiTokenPriceResponse {
  fungibles: {
    name: string
    symbol: string
    iconUrl: string
    price: number
  }[]
}

export interface BlockchainApiSwapAllowanceRequest {
  tokenAddress: string
  userAddress: string
}

export interface BlockchainApiSwapAllowanceResponse {
  allowance: string
}

export interface BlockchainApiGasPriceRequest {
  chainId: string
}

export interface BlockchainApiGasPriceResponse {
  standard: string
  fast: string
  instant: string
}

export interface BlockchainApiGenerateSwapCalldataRequest {
  userAddress: string
  from: string
  to: string
  amount: string
  eip155?: {
    slippage: string
    permit?: string
  }
}

export interface BlockchainApiGenerateSwapCalldataResponse {
  tx: {
    from: CaipAddress
    to: CaipAddress
    data: `0x${string}`
    amount: string
    eip155: {
      gas: string
      gasPrice: string
    }
  }
}

export interface BlockchainApiGenerateApproveCalldataRequest {
  userAddress: string
  from: string
  to: string
  amount?: number
}

export interface BlockchainApiGenerateApproveCalldataResponse {
  tx: {
    from: CaipAddress
    to: CaipAddress
    data: `0x${string}`
    value: string
    eip155: {
      gas: number
      gasPrice: string
    }
  }
}

export interface BlockchainApiLookupEnsName {
  name: ReownName
  registered: number
  updated: number
  addresses: Record<
    string,
    {
      address: string
      created: string
    }
  >
  attributes: {
    avatar?: string
    bio?: string
  }[]
}

export interface BlockchainApiRegisterNameParams {
  coinType: number
  message: string
  signature: string
  address: `0x${string}`
}

export interface BlockchainApiSuggestionResponse {
  suggestions: {
    name: string
    registered: boolean
  }[]
}

export interface BlockchainApiEnsError extends BaseError {
  status: string
  reasons: { name: string; description: string }[]
}

// -- OptionsController Types ---------------------------------------------------
export interface Token {
  address: string
  image?: string
}

export type Tokens = Record<CaipNetworkId, Token>

export type CustomWallet = Pick<
  WcWallet,
  | 'id'
  | 'name'
  | 'homepage'
  | 'image_url'
  | 'mobile_link'
  | 'desktop_link'
  | 'webapp_link'
  | 'app_store'
  | 'play_store'
>

// -- EventsController Types ----------------------------------------------------

export type Event =
  | {
      type: 'track'
      address?: string
      event: 'MODAL_CREATED'
    }
  | {
      type: 'track'
      event: 'MODAL_OPEN'
      properties: {
        connected: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'MODAL_CLOSE'
      properties: {
        connected: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_ALL_WALLETS'
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_WALLET'
      properties: {
        name: string
        platform: Platform
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CONNECT_SUCCESS'
      properties: {
        method: 'qrcode' | 'mobile' | 'browser' | 'email'
        name: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CONNECT_ERROR'
      properties: {
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'DISCONNECT_SUCCESS'
    }
  | {
      type: 'track'
      address?: string
      event: 'DISCONNECT_ERROR'
      properties?: {
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_WALLET_HELP'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_NETWORK_HELP'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_GET_WALLET'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_TRANSACTIONS'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'ERROR_FETCH_TRANSACTIONS'
      properties: {
        address: string
        projectId: string
        cursor: string | undefined
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'LOAD_MORE_TRANSACTIONS'
      properties: {
        address: string | undefined
        projectId: string
        cursor: string | undefined
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_SIGN_SIWX_MESSAGE'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_CANCEL_SIWX'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_NETWORKS'
    }
  | {
      type: 'track'
      address?: string
      event: 'SIWX_AUTH_SUCCESS'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SIWX_AUTH_ERROR'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_LOGIN_SELECTED'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_SUBMITTED'
    }
  | {
      type: 'track'
      address?: string
      event: 'DEVICE_REGISTERED_FOR_EMAIL'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_VERIFICATION_CODE_SENT'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_VERIFICATION_CODE_PASS'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_VERIFICATION_CODE_FAIL'
      properties: {
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_EDIT'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_UPGRADE_FROM_MODAL'
    }
  | {
      type: 'track'
      address?: string
      event: 'SWITCH_NETWORK'
      properties: {
        network: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_CONVERT'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_SELECT_TOKEN_TO_SWAP'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_SELECT_NETWORK_TO_SWAP'
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_BUY_CRYPTO'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_BUY_PROVIDER'
      properties: {
        provider: OnRampProviderOption
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_WHAT_IS_A_BUY'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SET_PREFERRED_ACCOUNT_TYPE'
      properties: {
        accountType: W3mFrameTypes.AccountType
        network: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'OPEN_SWAP'
      properties: {
        isSmartAccount: boolean
        network: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'INITIATE_SWAP'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SWAP_SUCCESS'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SWAP_ERROR'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SWAP_APPROVAL_ERROR'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_STARTED'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_SUCCESS'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_ERROR'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_REQUEST_USER_DATA'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_CANCELED'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'OPEN_ENS_FLOW'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'REGISTER_NAME_INITIATED'
      properties: {
        isSmartAccount: boolean
        ensName: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'REGISTER_NAME_SUCCESS'
      properties: {
        isSmartAccount: boolean
        ensName: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'REGISTER_NAME_ERROR'
      properties: {
        isSmartAccount: boolean
        ensName: string
        error: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'OPEN_SEND'
      properties: {
        isSmartAccount: boolean
        network: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SEND_INITIATED'
      properties: {
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SEND_SUCCESS'
      properties: {
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SEND_ERROR'
      properties: {
        message: string
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CONNECT_PROXY_ERROR'
      properties: {
        message: string
        uri: string
        mobile_link: string
        name: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SEARCH_WALLET'
      properties: {
        badge: string
        search: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'INITIALIZE'
      properties: InitializeAppKitConfigs
    }
// Onramp Types
export type DestinationWallet = {
  address: string
  blockchains: string[]
  assets: string[]
}

export type GenerateOnRampUrlArgs = {
  destinationWallets: DestinationWallet[]
  partnerUserId: string
  defaultNetwork?: string
  purchaseAmount?: number
  paymentAmount?: number
}

export type CoinbaseNetwork = {
  name: string
  display_name: string
  chain_id: string
  contract_address: string
}

export type PaymentLimits = {
  id: string
  min: string
  max: string
}

export type PaymentCurrency = {
  id: string
  payment_method_limits: PaymentLimits[]
}

export type QuoteAmount = {
  amount: string
  currency: string
}

export type PurchaseCurrency = {
  id: string
  name: string
  symbol: string
  networks: CoinbaseNetwork[]
}

export type OnrampQuote = {
  paymentTotal: QuoteAmount
  paymentSubtotal: QuoteAmount
  purchaseAmount: QuoteAmount
  coinbaseFee: QuoteAmount
  networkFee: QuoteAmount
  quoteId: string
}

export type GetQuoteArgs = {
  purchaseCurrency: PurchaseCurrency
  paymentCurrency: PaymentCurrency
  amount: string
  network: string
}

export type NamespaceTypeMap = {
  eip155: 'eoa' | 'smartAccount'
  solana: 'eoa'
  bip122: 'payment' | 'ordinal' | 'stx'
  polkadot: 'eoa'
}

export type AccountTypeMap = {
  [K in ChainNamespace]: {
    namespace: K
    address: string
    type: NamespaceTypeMap[K]
    publicKey?: K extends 'bip122' ? string : never
    path?: K extends 'bip122' ? string : never
  }
}
type Hex = `0x${string}`
type AssetType = 'native' | 'erc20' | 'erc721'
type Address = Hex
export type AddressOrNative = Address | 'native'
export type AssetFilterType = Record<
  `0x${string}`,
  {
    address: AddressOrNative
    type: AssetType
  }[]
>

export type WalletGetAssetsParams = {
  account: `0x${string}`
  assetFilter?: AssetFilterType
  assetTypeFilter?: ('NATIVE' | 'ERC20')[]
  chainFilter?: `0x${string}`[]
}

export type WalletGetAssetsResponse = Record<
  `0x${string}`,
  {
    address: `0x${string}` | 'native'
    balance: `0x${string}`
    type: 'NATIVE' | 'ERC20'
    metadata: Record<string, unknown>
  }[]
>
export type AccountType = AccountTypeMap[ChainNamespace]

export type SendTransactionArgs =
  | {
      chainNamespace?: undefined | 'eip155'
      to: `0x${string}`
      data: `0x${string}`
      value: bigint
      gas?: bigint
      gasPrice?: bigint
      maxFee?: bigint
      maxPriorityFee?: bigint
      address: `0x${string}`
      customData?: CustomData
      type?: number
    }
  | { chainNamespace: 'solana'; to: string; value: number }

export type EstimateGasTransactionArgs =
  | {
      chainNamespace?: undefined | 'eip155'
      address: `0x${string}`
      to: `0x${string}`
      data: `0x${string}`
    }
  | {
      chainNamespace: 'solana'
    }

/**
 * @description Legacy ERC-2612 permit signature arguments
 * 
 * ⚠️ DEPRECATED: This interface is limited to ERC-2612 permit signatures only.
 * Use SignTypedDataV4Args instead for a generic, flexible EIP-712 implementation
 * that can handle any typed data structure.
 * 
 * This interface was designed specifically for token permit operations and lacks
 * the flexibility needed for modern dApp requirements.
 * 
 * @deprecated Use SignTypedDataV4Args for new implementations
 * @see SignTypedDataV4Args for the improved, generic alternative
 */
export interface SignEIP712Args {
  contractAddress: `0x${string}`
  fromAddress: `0x${string}`
  spenderAddress: `0x${string}`
  value: bigint
  chainNamespace: ChainNamespace
  chainId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  name: string
  nonce: number
  deadline: number
  customData?: CustomData
}

export interface WriteContractArgs {
  contractAddress: `0x${string}`
  fromAddress: `0x${string}`
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
  args: unknown[]
  chainNamespace: ChainNamespace
  customData?: CustomData
  type?: number
  gas?: bigint
  gasPrice?: bigint
  maxFee?: bigint
  maxPriorityFee?: bigint
}

export interface ReadContractArgs {
  contractAddress: `0x${string}`
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
  args: unknown[]
}

export interface CustomData {
  metadata: Record<string, unknown> | string
  [key: string]: unknown
}

export interface NetworkControllerClient {
  switchCaipNetwork: (network: CaipNetwork) => Promise<void>
  getApprovedCaipNetworksData: () => Promise<{
    approvedCaipNetworkIds: CaipNetworkId[]
    supportsAllNetworks: boolean
  }>
}

export type AdapterNetworkState = {
  supportsAllNetworks: boolean
  isUnsupportedChain?: boolean
  _client?: NetworkControllerClient
  caipNetwork?: CaipNetwork
  requestedCaipNetworks?: CaipNetwork[]
  approvedCaipNetworkIds?: CaipNetworkId[]
  allowUnsupportedCaipNetwork?: boolean
  smartAccountEnabledNetworks?: number[]
}

export type ChainAdapter = {
  connectionControllerClient?: ConnectionControllerClient
  networkControllerClient?: NetworkControllerClient
  accountState?: AccountControllerState
  networkState?: AdapterNetworkState
  namespace?: ChainNamespace
  caipNetworks?: CaipNetwork[]
  projectId?: string
  adapterType?: string
}

export type ProviderEventListener = {
  connect: (connectParams: { chainId: number }) => void
  disconnect: (error: Error) => void
  display_uri: (uri: string) => void
  chainChanged: (chainId: string) => void
  accountsChanged: (accounts: string[]) => void
  message: (message: { type: string; data: unknown }) => void
}

export interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export interface Provider {
  connect: (params?: { onUri?: (uri: string) => void }) => Promise<string>
  disconnect: () => Promise<void>
  request: <T>(args: RequestArguments) => Promise<T>
  on<T extends keyof ProviderEventListener>(event: T, listener: ProviderEventListener[T]): void
  removeListener: <T>(event: string, listener: (data: T) => void) => void
  emit: (event: string, data?: unknown) => void
}

export type CombinedProvider = W3mFrameProvider & Provider

export type CoinbasePaySDKChainNameValues =
  keyof typeof ConstantsUtil.WC_COINBASE_PAY_SDK_CHAIN_NAME_MAP

export type WalletFeature = 'swaps' | 'send' | 'receive' | 'onramp'

export type ConnectMethod = 'email' | 'social' | 'wallet'

export type Features = {
  /**
   * @description Enable or disable the swaps feature. Enabled by default.
   * @type {boolean}
   */
  swaps?: boolean
  /**
   * @description Enable or disable the onramp feature. Enabled by default.
   * @type {boolean}
   */
  onramp?: boolean
  /**
   * @description Enable or disable the receive feature. Enabled by default.
   * This feature is only visible when connected with email/social. It's not possible to configure when connected with wallet, which is enabled by default.
   * @type {boolean}
   */
  receive?: boolean
  /**
   * @description Enable or disable the send feature. Enabled by default.
   * @type {boolean}
   */
  send?: boolean
  /**
   * @description Enable or disable the email feature. Enabled by default.
   * @type {boolean}
   */
  email?: boolean
  /**
   * @description Show or hide the regular wallet options when email is enabled. Enabled by default.
   * @deprecated - This property will be removed in the next major release. Please use `features.collapseWallets` instead.
   * @type {boolean}
   */
  emailShowWallets?: boolean
  /**
   * @description Enable or disable the socials feature. Enabled by default.
   * @type {SocialProvider[]}
   */
  socials?: SocialProvider[] | false
  /**
   * @description Enable or disable the history feature. Enabled by default.
   * @type {boolean}
   */
  history?: boolean
  /**
   * @description Enable or disable the analytics feature. Enabled by default.
   * @type {boolean}
   */
  analytics?: boolean
  /**
   * @description Enable or disable the all wallets feature. Enabled by default.
   * @type {boolean}
   */
  allWallets?: boolean
  /**
   * @description Enable or disable the Smart Sessions feature. Disabled by default.
   * @type {boolean}
   */
  smartSessions?: boolean
  /**
   * Enable or disable the terms of service and/or privacy policy checkbox.
   * @default false
   */
  legalCheckbox?: boolean
  /**
   * @description The order of the connect methods. This is experimental and subject to change.
   * @default ['email', 'social', 'wallet']
   * @type {('email' | 'social' | 'wallet')[]}
   */
  connectMethodsOrder?: ConnectMethod[]
  /**
   * @
   * @description The order of the wallet features. This is experimental and subject to change.
   * @default ['receive' | 'onramp' | 'swaps' | 'send']
   * @type {('receive' | 'onramp' | 'swaps' | 'send')[]}
   */
  walletFeaturesOrder?: WalletFeature[]
  /**
   * @description Enable or disable the collapse wallets as a single "Continue with wallet" button for simple UI in connect page.
   * This can be activated when only have another connect method like email or social activated along with wallets.
   * @default false
   */
  collapseWallets?: boolean
}

export type FeaturesKeys = keyof Features

export type WalletGuideType = 'get-started' | 'explore'

export type UseAppKitAccountReturn = {
  allAccounts: AccountType[]
  caipAddress: CaipAddress | undefined
  address: string | undefined
  isConnected: boolean
  embeddedWalletInfo?: {
    user: AccountControllerState['user']
    authProvider: AccountControllerState['socialProvider'] | 'email'
    accountType: W3mFrameTypes.AccountType | undefined
    isSmartAccountDeployed: boolean
  }
  status: AccountControllerState['status']
  balance?: AccountControllerState['balance']
  balanceSymbol?: AccountControllerState['balanceSymbol']
  balanceLoading?: AccountControllerState['balanceLoading']
  tokenBalance?: AccountControllerState['tokenBalance']
}

export type UseAppKitNetworkReturn = {
  caipNetwork: CaipNetwork | undefined
  chainId: number | string | undefined
  caipNetworkId: CaipNetworkId | undefined
  switchNetwork: (network: AppKitNetwork) => void
}

export type BadgeType = 'none' | 'certified'

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting'

/**
 * @description The default account types for each namespace.
 * @default
 */
export type DefaultAccountTypes = { [Key in keyof NamespaceTypeMap]: NamespaceTypeMap[Key] }

// EIP-712 Typed Data Definitions
// These types represent the standard EIP-712 typed data structure for secure message signing

/**
 * @description EIP-712 domain separator data
 * Used to differentiate between different dApps and prevent replay attacks across different contexts
 */
export interface TypedDataDomain {
  /** Human-readable name of the signing domain */
  name?: string
  /** Current version of the signing domain */
  version?: string
  /** EIP-155 chain id of the network */
  chainId?: number
  /** Address of the contract that will verify the signature */
  verifyingContract?: string
  /** Salt value for domain separation (rarely used) */
  salt?: string
}

/**
 * @description Definition of a single field in EIP-712 typed data
 */
export interface TypedDataField {
  /** Name of the field */
  name: string
  /** Solidity type of the field (e.g., 'uint256', 'address', 'bytes32') */
  type: string
}

/**
 * @description Complete type definitions for EIP-712 structured data
 * Must always include EIP712Domain, and can include custom types
 */
export interface TypedDataTypes {
  /** Standard EIP712Domain type definition - always required */
  EIP712Domain: TypedDataField[]
  /** Custom type definitions specific to the message being signed */
  [key: string]: TypedDataField[]
}

/**
 * @description Complete EIP-712 typed data structure for signing
 * This is an improved, generic version that replaces the limited SignEIP712Args
 * which was designed only for specific permit signatures
 */
export interface SignTypedDataV4Args {
  /** Domain separator information */
  domain: TypedDataDomain
  /** Type definitions for all data structures */
  types: TypedDataTypes
  /** Name of the primary type being signed (must exist in types) */
  primaryType: string
  /** Actual data values to be signed, matching the primaryType structure */
  message: Record<string, any>
}

