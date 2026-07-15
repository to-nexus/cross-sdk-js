import type { ChainNamespace } from './TypeUtil.js'

function getEnv(): string {
  // Console.log('ConstantUtil.ts getEnv(), import.meta.env', import.meta.env)
  if (import.meta?.env?.['VITE_ENV_MODE']) {
    return import.meta.env['VITE_ENV_MODE']
  }

  // 브라우저 환경에서는 process가 정의되지 않을 수 있음
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  if (typeof process !== 'undefined' && process?.env?.['NEXT_PUBLIC_ENV_MODE']) {
    return process.env['NEXT_PUBLIC_ENV_MODE']
  }

  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  if (typeof process !== 'undefined' && process?.env?.['NODE_ENV']) {
    return process.env['NODE_ENV']
  }

  return 'production'
}

export const ConstantsUtil = {
  WC_NAME_SUFFIX: '.reown.id',
  WC_NAME_SUFFIX_LEGACY: '.wcn.id',
  BLOCKCHAIN_API_RPC_URL: 'https://testnet.crosstoken.io:22001', // Todo: why not provide mainnet option?
  PULSE_API_URL: 'https://pulse.walletconnect.org', // Todo: remove this
  getWeb3mApiUrl() {
    const injectedEnv = getEnv()
    type EnvKey = keyof typeof ConstantsUtil.W3M_API_URL
    const envKey = injectedEnv.toUpperCase() as EnvKey

    return ConstantsUtil.W3M_API_URL[envKey]
  },
  W3M_API_URL: {
    DEVELOPMENT: 'https://dev-wallet-server.crosstoken.io',
    STAGE: 'https://stg-wallet-server.crosstoken.io',
    PRODUCTION: 'https://wallet-server.crosstoken.io'
  },
  getRelayUrl() {
    // VITE_CROSS_RELAY 환경변수가 있으면 우선 사용 (Vite 전용)
    if (import.meta?.env?.['VITE_CROSS_RELAY']) {
      console.log(
        'Using VITE_CROSS_RELAY from import.meta.env:',
        import.meta.env['VITE_CROSS_RELAY']
      )

      return import.meta.env['VITE_CROSS_RELAY']
    }

    // CROSS_RELAY 환경변수가 있으면 우선 사용
    if (import.meta?.env?.['CROSS_RELAY']) {
      console.log('Using CROSS_RELAY from import.meta.env:', import.meta.env['CROSS_RELAY'])

      return import.meta.env['CROSS_RELAY']
    }

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (typeof process !== 'undefined' && process?.env?.['CROSS_RELAY']) {
      console.log('Using CROSS_RELAY from process.env:', process.env['CROSS_RELAY'])

      return process.env['CROSS_RELAY']
    }

    console.log('Using relay URL:', ConstantsUtil.RELAY_URL.PRODUCTION)

    return ConstantsUtil.RELAY_URL.PRODUCTION
  },
  RELAY_URL: {
    DEVELOPMENT: 'wss://dev-cross-relay.crosstoken.io/ws',
    STAGE: 'wss://stg-cross-relay.crosstoken.io/ws',
    PRODUCTION: 'wss://cross-relay.crosstoken.io/ws'
  },
  getUniversalLink() {
    // VITE_UNIVERSAL_LINK 환경변수가 있으면 우선 사용 (Vite 전용)
    if (import.meta?.env?.['VITE_UNIVERSAL_LINK']) {
      console.log(
        'Using VITE_UNIVERSAL_LINK from import.meta.env:',
        import.meta.env['VITE_UNIVERSAL_LINK']
      )

      return import.meta.env['VITE_UNIVERSAL_LINK']
    }

    // UNIVERSAL_LINK 환경변수가 있으면 우선 사용
    if (import.meta?.env?.['UNIVERSAL_LINK']) {
      console.log('Using UNIVERSAL_LINK from import.meta.env:', import.meta.env['UNIVERSAL_LINK'])

      return import.meta.env['UNIVERSAL_LINK']
    }

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (typeof process !== 'undefined' && process?.env?.['UNIVERSAL_LINK']) {
      console.log('Using UNIVERSAL_LINK from process.env:', process.env['UNIVERSAL_LINK'])

      return process.env['UNIVERSAL_LINK']
    }

    console.log('Using universal link:', ConstantsUtil.UNIVERSAL_LINK.PRODUCTION)

    return undefined
  },
  UNIVERSAL_LINK: {
    DEVELOPMENT: 'https://dev-cross-wallet.crosstoken.io',
    STAGE: 'https://stg-cross-wallet.crosstoken.io',
    PRODUCTION: 'https://cross-wallet.crosstoken.io'
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
  getCrossWalletWebappLink() {
    const injectedEnv = getEnv()
    type EnvKey = keyof typeof ConstantsUtil.CROSS_WALLET_WEBAPP_LINK
    const envKey = injectedEnv.toUpperCase() as EnvKey

    return ConstantsUtil.CROSS_WALLET_WEBAPP_LINK[envKey]
  },
  getCrossWalletDeepLink() {
    const injectedEnv = getEnv()
    type EnvKey = keyof typeof ConstantsUtil.CROSS_WALLET_DEEP_LINK
    const envKey = injectedEnv.toUpperCase() as EnvKey

    return ConstantsUtil.CROSS_WALLET_DEEP_LINK[envKey]
  },
  CROSS_WALLET_WEBAPP_LINK: {
    DEVELOPMENT: 'https://dev-cross-wallet.crosstoken.io/wc',
    STAGE: 'https://stg-cross-wallet.crosstoken.io/wc',
    PRODUCTION: 'https://cross-wallet.crosstoken.io/wc'
  },
  CROSS_WALLET_DEEP_LINK: {
    DEVELOPMENT: 'crossx://',
    STAGE: 'crossx://',
    PRODUCTION: 'crossx://'
  },

  // ONEwallet+ 로고 (data URI로 임베드 — 원격 호스팅 불필요)
  ONE_WALLET_IMAGE:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF83MjgzN18yNDA2OSkiPgo8bWFzayBpZD0ibWFzazBfNzI4MzdfMjQwNjkiIHN0eWxlPSJtYXNrLXR5cGU6bHVtaW5hbmNlIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+CjxwYXRoIGQ9Ik01MCAwQzEwLjUyODkgMCAwIDEwLjUyODkgMCA1MEMwIDg5LjQ3MTEgMTAuNTI4OSAxMDAgNTAgMTAwQzg5LjQ3MTEgMTAwIDEwMCA4OS40NzExIDEwMCA1MEMxMDAgMTAuNTI4OSA4OS40NzExIDAgNTAgMFoiIGZpbGw9IndoaXRlIi8+CjwvbWFzaz4KPGcgbWFzaz0idXJsKCNtYXNrMF83MjgzN18yNDA2OSkiPgo8cGF0aCBkPSJNOTkuOTUwMSAwLjA0OTkyNjhIMFYxMDBIOTkuOTUwMVYwLjA0OTkyNjhaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfNzI4MzdfMjQwNjkpIi8+CjxwYXRoIGQ9Ik0zNC45MzAyIDEwMEg5OS45NzUxVjE5LjA2MTlMMzQuOTMwMiA2MC43Mjg2VjEwMFoiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl83MjgzN18yNDA2OSkiLz4KPHBhdGggZD0iTTM0LjkzMDEgMTAwSDBWMjMuODAyNEwzNC45MzAxIDYwLjcyODVWMTAwWiIgZmlsbD0idXJsKCNwYWludDJfbGluZWFyXzcyODM3XzI0MDY5KSIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2RfNzI4MzdfMjQwNjkpIj4KPHBhdGggZD0iTTQ5Ljk1MDMgMjEuNDgyMUwzMS45ODYyIDMxLjg2MTNDMjguODE3NiAzMy42ODI3IDI3LjcxOTggMzcuNzc0NSAyOS41NDExIDQwLjk0MzJDMzEuMzYyNSA0NC4xMTE4IDM1LjQ1NDMgNDUuMjA5NiAzOC42MjMgNDMuMzg4M0w1My44MTc2IDM0LjYwNThMNDYuNTgyIDQyLjM2NTNWNzIuODA0NEM0Ni41ODIgNzYuNDcyMSA0OS41NzYgNzkuNDY2MSA1My4yNDM3IDc5LjQ2NjFDNTYuOTExNCA3OS40NjYxIDU5LjkwNTQgNzYuNDcyMSA1OS45MDU0IDcyLjgwNDRWMjcuMjQ1NUM1OS45MDU0IDI1Ljk3MzEgNTkuNTA2MiAyNC43MjU2IDU5LjAwNzIgMjMuOTAyMkM1Ny4xMzU5IDIwLjc1ODUgNTMuMDk0IDE5LjYzNTggNDkuOTI1NCAyMS40NTcxTDQ5Ljk1MDMgMjEuNDgyMVoiIGZpbGw9IndoaXRlIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzcyODM3XzI0MDY5IiB4PSI3LjQyODYiIHk9Ii0wLjY1MDAxNCIgd2lkdGg9Ijg3LjgzMSIgaGVpZ2h0PSIxMTUuNDciIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeD0iNy4wNjA4OCIgZHk9IjcuMDYwODgiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMTQuMTQ2NyIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjgzMTM3MyAwIDAgMCAwIDAuMTEzNzI1IDAgMCAwIDAgMC4zNTY4NjMgMCAwIDAgMC4zIDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfNzI4MzdfMjQwNjkiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfNzI4MzdfMjQwNjkiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl83MjgzN18yNDA2OSIgeDE9Ii0xMS41NzY4IiB5MT0iLTEyLjAwMSIgeDI9IjEwNi41NjIiIHkyPSIxMDYuOTg2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNGMzc1MkQiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRUMxMjcyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhcl83MjgzN18yNDA2OSIgeDE9IjI0Ljk1MDEiIHkxPSIyMy4wMDQiIHgyPSI3My42Mjc4IiB5Mj0iNjQuODQ1MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwLjUiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQyX2xpbmVhcl83MjgzN18yNDA2OSIgeDE9IjYyLjM1MDMiIHkxPSIzLjQ2ODA0IiB4Mj0iMTYuMzQyMyIgeTI9IjYzLjM3MzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMC41Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzcyODM3XzI0MDY5Ij4KPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==',

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
