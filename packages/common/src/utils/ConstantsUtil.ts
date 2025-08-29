import type { ChainNamespace } from './TypeUtil.js'

function getEnv(): string {
  console.log('ConstantUtil.ts getEnv(), import.meta.env', import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_ENV_MODE']) {
    return import.meta.env['VITE_ENV_MODE']
  }

  if (typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_ENV_MODE']) {
    return process.env['NEXT_PUBLIC_ENV_MODE']
  }

  if (typeof process !== 'undefined' && process.env?.['NODE_ENV']) {
    return process.env['NODE_ENV']
  }

  return 'production'
}

export const ConstantsUtil = {
  WC_NAME_SUFFIX: '.reown.id',
  WC_NAME_SUFFIX_LEGACY: '.wcn.id',
  BLOCKCHAIN_API_RPC_URL: 'https://testnet.crosstoken.io:22001', // todo: why not provide mainnet option?
  PULSE_API_URL: 'https://pulse.walletconnect.org', // todo: remove this
  getWeb3mApiUrl() {
    const injectedEnv = getEnv()
    type EnvKey = keyof typeof ConstantsUtil.W3M_API_URL
    const envKey = injectedEnv.toUpperCase() as EnvKey
    return ConstantsUtil.W3M_API_URL[envKey]
  },
  W3M_API_URL: {
    DEVELOPMENT: 'https://wallet-server.crosstoken.io',
    STAGE: 'https://wallet-server.crosstoken.io',
    PRODUCTION: 'https://wallet-server.crosstoken.io'
  },
  getRelayUrl() {
    const injectedEnv = getEnv()
    type EnvKey = keyof typeof ConstantsUtil.RELAY_URL
    const envKey = injectedEnv.toUpperCase() as EnvKey
    return ConstantsUtil.RELAY_URL[envKey]
  },
  RELAY_URL: {
    DEVELOPMENT: 'wss://dev-cross-relay.crosstoken.io/ws',
    STAGE: 'wss://cross-relay.crosstoken.io/ws',
    PRODUCTION: 'wss://cross-relay.crosstoken.io/ws'
  },
  getVerifyUrl() {
    const injectedEnv = getEnv()
    type EnvKey = keyof typeof ConstantsUtil.VERIFY_URL
    const envKey = injectedEnv.toUpperCase() as EnvKey
    return ConstantsUtil.VERIFY_URL[envKey]
  },
  VERIFY_URL: {
    DEVELOPMENT: 'http://cross-verify.crosstoken.io',
    STAGE: 'http://cross-verify.crosstoken.io',
    PRODUCTION: 'http://cross-verify.crosstoken.io'
  },
  /* Connector IDs */
  CONNECTOR_ID: {
    WALLET_CONNECT: 'cross_wallet',
    INJECTED: 'injected',
    WALLET_STANDARD: 'announced',
    COINBASE: 'coinbaseWallet',
    COINBASE_SDK: 'coinbaseWalletSDK',
    SAFE: 'safe',
    LEDGER: 'ledger',
    OKX: 'okx',
    EIP6963: 'eip6963',
    AUTH: 'ID_AUTH'
  },
  CONNECTOR_NAMES: {
    AUTH: 'Auth'
  },
  AUTH_CONNECTOR_SUPPORTED_CHAINS: ['eip155', 'solana'],
  LIMITS: {
    PENDING_TRANSACTIONS: 99
  },
  CHAIN: {
    EVM: 'eip155',
    SOLANA: 'solana',
    POLKADOT: 'polkadot',
    BITCOIN: 'bip122'
  } as const satisfies Record<string, ChainNamespace>,
  CHAIN_NAME_MAP: {
    eip155: 'Ethereum',
    solana: 'Solana',
    polkadot: 'Polkadot',
    bip122: 'Bitcoin'
  } as const satisfies Record<ChainNamespace, string>,
  USDT_CONTRACT_ADDRESSES: [
    // Mainnet
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
    // Polygon
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    // Avalanche
    '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
    // Cosmos
    '0x919C1c267BC06a7039e03fcc2eF738525769109c',
    // Celo
    '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
    // Binance
    '0x55d398326f99059fF775485246999027B3197955',
    // Arbitrum
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
  ],
  HTTP_STATUS_CODES: {
    SERVICE_UNAVAILABLE: 503,
    FORBIDDEN: 403
  },
  UNSUPPORTED_NETWORK_NAME: 'Unknown Network'
} as const
