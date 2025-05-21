import type { ChainNamespace } from './TypeUtil.js'

export type NamespacedConnectorKey = `@cross/${ChainNamespace}:connected_connector_id`
export type SafeLocalStorageItems = {
  '@cross/wallet_id': string
  '@cross/wallet_name': string
  '@cross/solana_wallet': string
  '@cross/solana_caip_chain': string
  '@cross/active_caip_network_id': string
  '@cross/connected_social': string
  '@cross-wallet/SOCIAL_USERNAME': string
  '@cross/recent_wallets': string
  '@cross/active_namespace': string
  '@cross/connected_namespaces': string
  '@cross/connection_status': string
  '@cross/siwx-auth-token': string
  '@cross/siwx-nonce-token': string
  '@cross/social_provider': string
  '@cross/native_balance_cache': string
  '@cross/portfolio_cache': string
  '@cross/ens_cache': string
  '@cross/identity_cache': string
  /*
   * DO NOT CHANGE: @to-nexus/universal-provider requires us to set this specific key
   *  This value is a stringified version of { href: stiring; name: string }
   */
  WALLETCONNECT_DEEPLINK_CHOICE: string
}

export const SafeLocalStorageKeys = {
  WALLET_ID: '@cross/wallet_id',
  WALLET_NAME: '@cross/wallet_name',
  SOLANA_WALLET: '@cross/solana_wallet',
  SOLANA_CAIP_CHAIN: '@cross/solana_caip_chain',
  ACTIVE_CAIP_NETWORK_ID: '@cross/active_caip_network_id',
  CONNECTED_SOCIAL: '@cross/connected_social',
  CONNECTED_SOCIAL_USERNAME: '@cross-wallet/SOCIAL_USERNAME',
  RECENT_WALLETS: '@cross/recent_wallets',
  DEEPLINK_CHOICE: 'WALLETCONNECT_DEEPLINK_CHOICE',
  ACTIVE_NAMESPACE: '@cross/active_namespace',
  CONNECTED_NAMESPACES: '@cross/connected_namespaces',
  CONNECTION_STATUS: '@cross/connection_status',
  SIWX_AUTH_TOKEN: '@cross/siwx-auth-token',
  SIWX_NONCE_TOKEN: '@cross/siwx-nonce-token',
  SOCIAL_PROVIDER: '@cross/social_provider',
  NATIVE_BALANCE_CACHE: '@cross/native_balance_cache',
  PORTFOLIO_CACHE: '@cross/portfolio_cache',
  ENS_CACHE: '@cross/ens_cache',
  IDENTITY_CACHE: '@cross/identity_cache'
} as const satisfies Record<string, keyof SafeLocalStorageItems>

export type SafeLocalStorageKey = keyof SafeLocalStorageItems | NamespacedConnectorKey

export function getSafeConnectorIdKey(namespace?: ChainNamespace): NamespacedConnectorKey {
  if (!namespace) {
    throw new Error('Namespace is required for CONNECTED_CONNECTOR_ID')
  }

  return `@cross/${namespace}:connected_connector_id`
}

export const SafeLocalStorage = {
  setItem(key: SafeLocalStorageKey, value?: string): void {
    if (isSafe() && value !== undefined) {
      localStorage.setItem(key, value)
    }
  },
  getItem(key: SafeLocalStorageKey): string | undefined {
    if (isSafe()) {
      return localStorage.getItem(key) || undefined
    }

    return undefined
  },
  removeItem(key: SafeLocalStorageKey): void {
    if (isSafe()) {
      localStorage.removeItem(key)
    }
  },
  clear(): void {
    if (isSafe()) {
      localStorage.clear()
    }
  }
}

export function isSafe(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}
