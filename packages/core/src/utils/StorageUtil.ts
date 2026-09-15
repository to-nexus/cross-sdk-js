/* eslint-disable no-console */
import {
  type Balance,
  type CaipNetworkId,
  type ChainNamespace,
  ConstantsUtil as CommonConstantsUtil,
  NetworkUtil,
  SafeLocalStorage,
  SafeLocalStorageKeys,
  getSafeConnectorIdKey
} from '@to-nexus/appkit-common'

import { CoreHelperUtil } from './CoreHelperUtil.js'
import type {
  BlockchainApiIdentityResponse,
  BlockchainApiLookupEnsName,
  ConnectionStatus,
  SocialProvider,
  WcWallet
} from './TypeUtil.js'

// -- Utility -----------------------------------------------------------------
export const StorageUtil = {
  // Cache expiry in milliseconds
  cacheExpiry: {
    portfolio: 30000,
    nativeBalance: 30000,
    ens: 300000,
    identity: 300000
  },
  isCacheExpired(timestamp: number, cacheExpiry: number) {
    return Date.now() - timestamp > cacheExpiry
  },
  getActiveNetworkProps() {
    const namespace = StorageUtil.getActiveNamespace()
    const caipNetworkId = StorageUtil.getActiveCaipNetworkId() as CaipNetworkId | undefined
    const stringChainId = caipNetworkId ? caipNetworkId.split(':')[1] : undefined

    // eslint-disable-next-line no-nested-ternary
    const chainId = stringChainId
      ? isNaN(Number(stringChainId))
        ? stringChainId
        : Number(stringChainId)
      : undefined

    return {
      namespace,
      caipNetworkId,
      chainId
    }
  },

  setWalletConnectDeepLink({ name, href }: { href: string; name: string }) {
    try {
      /*
       * 🔑 핵심: 플랫폼별 최적의 링크 전략
       *
       * 📱 iOS:
       * - Universal Link (https://)는 최초 연결에는 좋지만,
       *   비동기 작업(서명/트랜잭션) 중에는 사용자 인터랙션 컨텍스트가 상실되어 실패
       * - Custom URL Scheme (crossx://)는 비동기 작업 후에도 안정적으로 앱 열기 가능
       * - 따라서 서명/트랜잭션용으로는 Deep Link로 변환 필요 ✅
       *
       * 🤖 Android:
       * - 프로그래밍 방식으로 Universal Link 사용 가능 (비동기 작업에서도 안정적)
       * - Universal Link 사용 시 앱 미설치 시 웹으로 fallback 가능 (더 나은 UX)
       * - 따라서 Universal Link를 그대로 유지 ✅
       *
       * 💡 하이브리드 전략:
       * - 최초 연결: Universal Link + 자동 버튼 클릭 (iOS)
       * - 서명/트랜잭션: iOS는 Deep Link, Android는 Universal Link
       *
       * ⚠️ 왜 트랜잭션은 Deep Link가 필요한가?
       *
       * 트랜잭션 플로우:
       * 1. 사용자 "Send Transaction" 버튼 클릭 (인터랙션 컨텍스트 시작)
       * 2. 가스 추정 (await estimateGas) - 네트워크 요청 ~200-300ms
       * 3. 수수료 조회 (await getFeeData) - 네트워크 요청 ~200ms
       * 4. 트랜잭션 전송 (await eth_sendTransaction) - 지갑 열기 시도
       *
       * 문제: 4번 시점에는 이미 500ms+ 경과, iOS 인터랙션 컨텍스트 상실
       * → Universal Link 실패 (iOS 정책)
       * → Deep Link는 비동기 후에도 작동 가능 ✅
       *
       * Android는 인터랙션 컨텍스트 제약이 덜 엄격하므로 Universal Link 유지
       */
      const isIos = CoreHelperUtil.isIos()
      let finalHref = href

      /*
       * IOS에서만 Universal Link → Deep Link 변환
       * Android는 Universal Link 그대로 유지
       */
      if (isIos && href.startsWith('https://')) {
        const crossWalletDomains = Object.values(CommonConstantsUtil.UNIVERSAL_LINK)

        for (const domain of crossWalletDomains) {
          if (href.startsWith(domain)) {
            /*
             * ⚠️ 중요: 슬래시 개수에 주의!
             *
             * Domain: "https://cross-wallet.crosstoken.io"   (끝에 / 없음)
             * Href:   "https://cross-wallet.crosstoken.io/"  (끝에 / 있음)
             *
             * Replace(domain, 'crossx:/') 사용 이유:
             * - 'crossx://' (슬래시 2개)를 사용하면 → "crossx:///" (슬래시 3개) 결과 ❌
             * - 'crossx:/'  (슬래시 1개)를 사용하면 → "crossx://"  (슬래시 2개) 결과 ✅
             *
             * 예시:
             * - "https://cross-wallet.crosstoken.io/" → "crossx://"
             * - "https://cross-wallet.crosstoken.io/wc?uri=xxx" → "crossx://wc?uri=xxx"
             */
            finalHref = href.replace(domain, 'crossx:/')
            break
          }
        }
      }

      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.DEEPLINK_CHOICE,
        JSON.stringify({ href: finalHref, name })
      )
    } catch {
      console.info('Unable to set WalletConnect deep link')
    }
  },

  getWalletConnectDeepLink() {
    try {
      const deepLink = SafeLocalStorage.getItem(SafeLocalStorageKeys.DEEPLINK_CHOICE)
      if (deepLink) {
        return JSON.parse(deepLink)
      }
    } catch {
      console.info('Unable to get WalletConnect deep link')
    }

    return undefined
  },

  deleteWalletConnectDeepLink() {
    try {
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.DEEPLINK_CHOICE)
    } catch {
      console.info('Unable to delete WalletConnect deep link')
    }
  },

  setActiveNamespace(namespace: ChainNamespace) {
    try {
      SafeLocalStorage.setItem(SafeLocalStorageKeys.ACTIVE_NAMESPACE, namespace)
    } catch {
      console.info('Unable to set active namespace')
    }
  },

  setActiveCaipNetworkId(caipNetworkId: CaipNetworkId) {
    try {
      console.log(`setActiveCaipNetworkId - caipNetworkId: ${caipNetworkId} now storing in storage`)

      /*
       * 지갑이 네트워크 초기화 전에 보고한 placeholder id(eip155:0 등)는 저장하지 않는다.
       * 저장하면 스토리지가 오염될 뿐 아니라 아래 clearAddressCache까지 트리거되어
       * 정상 네트워크의 잔고/identity 캐시가 통째로 날아간다.
       */
      if (!NetworkUtil.isValidCaipNetworkId(caipNetworkId)) {
        console.warn(`Ignoring invalid caipNetworkId: ${caipNetworkId}`)

        return
      }

      // 이전 네트워크 ID 가져오기
      const previousNetworkId = SafeLocalStorage.getItem(
        SafeLocalStorageKeys.ACTIVE_CAIP_NETWORK_ID
      )

      // 네트워크가 실제로 바뀌었는지 확인
      if (previousNetworkId && previousNetworkId !== caipNetworkId) {
        console.log(
          `Network changed from ${previousNetworkId} to ${caipNetworkId}, clearing all storage for previous network`
        )

        // 이전 네트워크의 모든 스토리지 제거
        StorageUtil.clearAddressCache()
      }

      SafeLocalStorage.setItem(SafeLocalStorageKeys.ACTIVE_CAIP_NETWORK_ID, caipNetworkId)
      StorageUtil.setActiveNamespace(caipNetworkId.split(':')[0] as ChainNamespace)
    } catch {
      console.info('Unable to set active caip network id')
    }
  },

  getActiveCaipNetworkId() {
    try {
      return SafeLocalStorage.getItem(SafeLocalStorageKeys.ACTIVE_CAIP_NETWORK_ID) as
        | CaipNetworkId
        | undefined
    } catch {
      console.info('Unable to get active caip network id')

      return undefined
    }
  },

  deleteActiveCaipNetworkId() {
    try {
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.ACTIVE_CAIP_NETWORK_ID)
    } catch {
      console.info('Unable to delete active caip network id')
    }
  },

  deleteConnectedConnectorId(namespace: ChainNamespace) {
    try {
      const key = getSafeConnectorIdKey(namespace)
      SafeLocalStorage.removeItem(key)
    } catch {
      console.info('Unable to delete connected connector id')
    }
  },

  setAppKitRecent(wallet: WcWallet) {
    try {
      const recentWallets = StorageUtil.getRecentWallets()
      const exists = recentWallets.find(w => w.id === wallet.id)
      if (!exists) {
        recentWallets.unshift(wallet)
        if (recentWallets.length > 2) {
          recentWallets.pop()
        }
        SafeLocalStorage.setItem(SafeLocalStorageKeys.RECENT_WALLETS, JSON.stringify(recentWallets))
      }
    } catch {
      console.info('Unable to set AppKit recent')
    }
  },

  getRecentWallets(): WcWallet[] {
    try {
      const recent = SafeLocalStorage.getItem(SafeLocalStorageKeys.RECENT_WALLETS)

      return recent ? JSON.parse(recent) : []
    } catch {
      console.info('Unable to get AppKit recent')
    }

    return []
  },

  setConnectedConnectorId(namespace: ChainNamespace, connectorId: string) {
    try {
      const key = getSafeConnectorIdKey(namespace)
      SafeLocalStorage.setItem(key, connectorId)
    } catch {
      console.info('Unable to set Connected Connector Id')
    }
  },

  getActiveNamespace() {
    try {
      const activeNamespace = SafeLocalStorage.getItem(SafeLocalStorageKeys.ACTIVE_NAMESPACE)

      return activeNamespace as ChainNamespace | undefined
    } catch {
      console.info('Unable to get active namespace')
    }

    return undefined
  },

  getConnectedConnectorId(namespace: ChainNamespace | undefined) {
    if (!namespace) {
      return undefined
    }

    try {
      const key = getSafeConnectorIdKey(namespace)

      return SafeLocalStorage.getItem(key)
    } catch (e) {
      console.info('Unable to get connected connector id in namespace ', namespace)
    }

    return undefined
  },

  setConnectedSocialProvider(socialProvider: SocialProvider) {
    try {
      SafeLocalStorage.setItem(SafeLocalStorageKeys.CONNECTED_SOCIAL, socialProvider)
    } catch {
      console.info('Unable to set connected social provider')
    }
  },

  getConnectedSocialProvider() {
    try {
      return SafeLocalStorage.getItem(SafeLocalStorageKeys.CONNECTED_SOCIAL)
    } catch {
      console.info('Unable to get connected social provider')
    }

    return undefined
  },

  deleteConnectedSocialProvider() {
    try {
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.CONNECTED_SOCIAL)
    } catch {
      console.info('Unable to delete connected social provider')
    }
  },

  getConnectedSocialUsername() {
    try {
      return SafeLocalStorage.getItem(SafeLocalStorageKeys.CONNECTED_SOCIAL_USERNAME)
    } catch {
      console.info('Unable to get connected social username')
    }

    return undefined
  },

  getStoredActiveCaipNetworkId() {
    const storedCaipNetworkId = SafeLocalStorage.getItem(
      SafeLocalStorageKeys.ACTIVE_CAIP_NETWORK_ID
    )
    const networkId = storedCaipNetworkId?.split(':')?.[1]

    return networkId
  },

  setConnectionStatus(status: ConnectionStatus) {
    try {
      SafeLocalStorage.setItem(SafeLocalStorageKeys.CONNECTION_STATUS, status)
    } catch {
      console.info('Unable to set connection status')
    }
  },

  getConnectionStatus() {
    try {
      return SafeLocalStorage.getItem(SafeLocalStorageKeys.CONNECTION_STATUS) as ConnectionStatus
    } catch {
      return undefined
    }
  },

  getConnectedNamespaces() {
    try {
      const namespaces = SafeLocalStorage.getItem(SafeLocalStorageKeys.CONNECTED_NAMESPACES)

      if (!namespaces?.length) {
        return []
      }

      return namespaces.split(',') as ChainNamespace[]
    } catch {
      return []
    }
  },

  setConnectedNamespaces(namespaces: ChainNamespace[]) {
    try {
      const uniqueNamespaces = Array.from(new Set(namespaces))
      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.CONNECTED_NAMESPACES,
        uniqueNamespaces.join(',')
      )
    } catch {
      console.info('Unable to set namespaces in storage')
    }
  },

  addConnectedNamespace(namespace: ChainNamespace) {
    try {
      const namespaces = StorageUtil.getConnectedNamespaces()
      if (!namespaces.includes(namespace)) {
        namespaces.push(namespace)
        StorageUtil.setConnectedNamespaces(namespaces)
      }
    } catch {
      console.info('Unable to add connected namespace')
    }
  },

  removeConnectedNamespace(namespace: ChainNamespace) {
    try {
      const namespaces = StorageUtil.getConnectedNamespaces()
      const index = namespaces.indexOf(namespace)
      if (index > -1) {
        namespaces.splice(index, 1)
        StorageUtil.setConnectedNamespaces(namespaces)
      }
    } catch {
      console.info('Unable to remove connected namespace')
    }
  },
  getBalanceCache() {
    let cache: Record<string, { timestamp: number; balance: Balance[] }> = {}
    try {
      const result = SafeLocalStorage.getItem(SafeLocalStorageKeys.PORTFOLIO_CACHE)
      cache = result ? JSON.parse(result) : {}
    } catch {
      console.info('Unable to get balance cache')
    }

    return cache
  },
  removeAddressFromBalanceCache(caipAddress: string) {
    try {
      const cache = StorageUtil.getBalanceCache()
      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.PORTFOLIO_CACHE,
        JSON.stringify({ ...cache, [caipAddress]: undefined })
      )
    } catch {
      console.info('Unable to remove address from balance cache', caipAddress)
    }
  },
  getBalanceCacheForCaipAddress(caipAddress: string) {
    try {
      const cache = StorageUtil.getBalanceCache()
      const balanceCache = cache[caipAddress]
      // We want to discard cache if it's older than the cache expiry
      if (
        balanceCache &&
        !this.isCacheExpired(balanceCache.timestamp, this.cacheExpiry.portfolio)
      ) {
        return balanceCache.balance
      }

      StorageUtil.removeAddressFromBalanceCache(caipAddress)
    } catch {
      console.info('Unable to get balance cache for address', caipAddress)
    }

    return undefined
  },
  updateBalanceCache(params: { caipAddress: string; balance: Balance[]; timestamp: number }) {
    try {
      const cache = StorageUtil.getBalanceCache()
      const { caipAddress, balance, timestamp } = params
      cache[caipAddress] = { balance, timestamp }
      SafeLocalStorage.setItem(SafeLocalStorageKeys.PORTFOLIO_CACHE, JSON.stringify(cache))
    } catch {
      console.info('Unable to update balance cache', params)
    }
  },

  getNativeBalanceCache() {
    let cache: Record<
      string,
      { caipAddress: string; balance: string; symbol: string; timestamp: number }
    > = {}
    try {
      const result = SafeLocalStorage.getItem(SafeLocalStorageKeys.NATIVE_BALANCE_CACHE)
      cache = result ? JSON.parse(result) : {}
    } catch {
      console.info('Unable to get balance cache')
    }

    return cache
  },
  removeAddressFromNativeBalanceCache(caipAddress: string) {
    try {
      const cache = StorageUtil.getNativeBalanceCache()
      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.NATIVE_BALANCE_CACHE,
        JSON.stringify({ ...cache, [caipAddress]: undefined })
      )
    } catch {
      console.info('Unable to remove address from native balance cache', caipAddress)
    }
  },
  getNativeBalanceCacheForCaipAddress(caipAddress: string) {
    try {
      const cache = StorageUtil.getNativeBalanceCache()
      const nativeBalanceCache = cache[caipAddress]
      // We want to discard cache if it's older than the cache expiry
      if (
        nativeBalanceCache &&
        !this.isCacheExpired(nativeBalanceCache.timestamp, this.cacheExpiry.nativeBalance)
      ) {
        return nativeBalanceCache
      }

      console.info('Discarding cache for address', caipAddress)
      StorageUtil.removeAddressFromNativeBalanceCache(caipAddress)
    } catch {
      console.info('Unable to get balance cache for address', caipAddress)
    }

    return undefined
  },
  updateNativeBalanceCache(params: {
    caipAddress: string
    balance: string
    symbol: string
    timestamp: number
  }) {
    try {
      const cache = StorageUtil.getNativeBalanceCache()
      cache[params.caipAddress] = params
      SafeLocalStorage.setItem(SafeLocalStorageKeys.NATIVE_BALANCE_CACHE, JSON.stringify(cache))
    } catch {
      console.info('Unable to update balance cache', params)
    }
  },

  getEnsCache() {
    let cache: Record<string, { ens: BlockchainApiLookupEnsName[]; timestamp: number }> = {}
    try {
      const result = SafeLocalStorage.getItem(SafeLocalStorageKeys.ENS_CACHE)
      cache = result ? JSON.parse(result) : {}
    } catch {
      console.info('Unable to get ens name cache')
    }

    return cache
  },
  getEnsFromCacheForAddress(address: string) {
    try {
      const cache = StorageUtil.getEnsCache()
      const ensCache = cache[address]
      // We want to discard cache if it's older than the cache expiry
      if (ensCache && !this.isCacheExpired(ensCache.timestamp, this.cacheExpiry.ens)) {
        return ensCache.ens
      }
      StorageUtil.removeEnsFromCache(address)
    } catch {
      console.info('Unable to get ens name from cache', address)
    }

    return undefined
  },
  updateEnsCache(params: {
    address: string
    timestamp: number
    ens: BlockchainApiLookupEnsName[]
  }) {
    try {
      const cache = StorageUtil.getEnsCache()
      cache[params.address] = params
      SafeLocalStorage.setItem(SafeLocalStorageKeys.ENS_CACHE, JSON.stringify(cache))
    } catch {
      console.info('Unable to update ens name cache', params)
    }
  },
  removeEnsFromCache(address: string) {
    try {
      const cache = StorageUtil.getEnsCache()
      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.ENS_CACHE,
        JSON.stringify({ ...cache, [address]: undefined })
      )
    } catch {
      console.info('Unable to remove ens name from cache', address)
    }
  },
  getIdentityCache() {
    let cache: Record<
      string,
      {
        identity: BlockchainApiIdentityResponse
        timestamp: number
      }
    > = {}
    try {
      const result = SafeLocalStorage.getItem(SafeLocalStorageKeys.IDENTITY_CACHE)
      cache = result ? JSON.parse(result) : {}
    } catch {
      console.info('Unable to get identity cache')
    }

    return cache
  },
  getIdentityFromCacheForAddress(address: string) {
    try {
      const cache = StorageUtil.getIdentityCache()
      const identityCache = cache[address]
      // We want to discard cache if it's older than the cache expiry
      if (
        identityCache &&
        !this.isCacheExpired(identityCache.timestamp, this.cacheExpiry.identity)
      ) {
        return identityCache.identity
      }
      StorageUtil.removeIdentityFromCache(address)
    } catch {
      console.info('Unable to get identity from cache', address)
    }

    return undefined
  },
  updateIdentityCache(params: {
    address: string
    timestamp: number
    identity: BlockchainApiIdentityResponse
  }) {
    try {
      const cache = StorageUtil.getIdentityCache()
      cache[params.address] = {
        identity: params.identity,
        timestamp: params.timestamp
      }
      SafeLocalStorage.setItem(SafeLocalStorageKeys.IDENTITY_CACHE, JSON.stringify(cache))
    } catch {
      console.info('Unable to update identity cache', params)
    }
  },
  removeIdentityFromCache(address: string) {
    try {
      const cache = StorageUtil.getIdentityCache()
      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.IDENTITY_CACHE,
        JSON.stringify({ ...cache, [address]: undefined })
      )
    } catch {
      console.info('Unable to remove identity from cache', address)
    }
  },

  clearAddressCache() {
    try {
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.PORTFOLIO_CACHE)
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.NATIVE_BALANCE_CACHE)
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.ENS_CACHE)
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.IDENTITY_CACHE)
    } catch {
      console.info('Unable to clear address cache')
    }
  }
}
