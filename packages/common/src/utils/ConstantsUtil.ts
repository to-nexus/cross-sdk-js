import type { ChainNamespace } from './TypeUtil.js'

function getEnv(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_ENV_MODE']) {
    return import.meta.env['VITE_ENV_MODE'];
  }
  
  if (typeof process !== 'undefined' && process.env?.["NEXT_PUBLIC_ENV_MODE"]) {
    return process.env["NEXT_PUBLIC_ENV_MODE"];
  }

  if (typeof process !== 'undefined' && process.env?.["NODE_ENV"]) {
    return process.env["NODE_ENV"];
  }

  return 'development';
}

export const ConstantsUtil = {
  WC_NAME_SUFFIX: '.reown.id',
  WC_NAME_SUFFIX_LEGACY: '.wcn.id',
  BLOCKCHAIN_API_RPC_URL: 'https://testnet.crosstoken.io:22001',
  PULSE_API_URL: 'https://pulse.walletconnect.org',
  W3M_API_URL: getEnv() === 'development' ? 'https://dev-wallet-server.crosstoken.io' : 'https://wallet-server.crosstoken.io',
  RELAY_URL_DEV: "wss://dev-cross-relay.crosstoken.io/ws",
  RELAY_URL_PROD: "wss://cross-relay.crosstoken.io/ws",
  VERIFY_URL_DEV: "http://dev-cross-verify.crosstoken.io",
  VERIFY_URL_PROD: "http://cross-verify.crosstoken.io",
  /* Connector IDs */
  CONNECTOR_ID: {
    WALLET_CONNECT: 'walletConnect',
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
