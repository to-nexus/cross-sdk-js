import type { CreateConnectorFn } from 'wagmi'
import { injected } from 'wagmi/connectors'

// ✅ Wrap Cross Extension provider to handle unsupported methods
function wrapCrossProvider(provider: any) {
  if (!provider?.request) {
    return provider
  }

  const originalRequest = provider.request.bind(provider)

  return new Proxy(provider, {
    get(target, prop) {
      if (prop === 'request') {
        return async (args: any) => {
          /*
           * Cross Extension doesn't support wallet_requestPermissions (EIP-2255)
           * Return empty array to satisfy wagmi, which will then use eth_requestAccounts
           */
          if (args.method === 'wallet_requestPermissions') {
            console.warn(
              '[Wagmi Cross Connector] wallet_requestPermissions not supported, returning empty permissions array'
            )

            return []
          }

          return originalRequest(args)
        }
      }

      return target[prop]
    }
  })
}

// Cross Extension의 EIP-6963 rdns
const CROSS_WALLET_RDNS = 'nexus.to.crosswallet.desktop'

// EIP-6963로 announce된 Cross provider 캐시
let announcedCrossProvider: any | undefined
let eip6963ListenerAttached = false

// EIP-6963 announce 리스너를 한 번만 부착하고 즉시 요청을 보낸다.
function ensureCrossEip6963Listener() {
  if (eip6963ListenerAttached || typeof window === 'undefined') {
    return
  }
  eip6963ListenerAttached = true

  window.addEventListener('eip6963:announceProvider', ((event: any) => {
    const detail = event?.detail
    if (detail?.info?.rdns === CROSS_WALLET_RDNS && detail.provider) {
      announcedCrossProvider = detail.provider
    }
  }) as EventListener)

  // 이미 announce된 provider를 회수하기 위해 요청 이벤트 dispatch
  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

// Cross Extension을 감지하기 위한 헬퍼 함수
function detectCrossExtensionProvider() {
  if (typeof window === 'undefined') {
    return undefined
  }

  ensureCrossEip6963Listener()

  // 1. EIP-6963로 announce된 provider (표준 방식, window.ethereum 점유와 무관)
  if (announcedCrossProvider) {
    return wrapCrossProvider(announcedCrossProvider)
  }

  // 2. window.crossWallet fallback (레거시 주입 방식)
  const crossWallet = (window as any).crossWallet
  if (crossWallet) {
    return wrapCrossProvider(crossWallet)
  }

  return undefined
}

// Cross Extension Wallet을 위한 커스텀 injected connector
export function crossExtensionConnector(): CreateConnectorFn {
  return injected({
    target() {
      const crossProvider = detectCrossExtensionProvider()
      if (crossProvider) {
        // Console.log('[Wagmi Cross Connector] ✅ CROSSx Extension provider detected and ready')
        return {
          id: 'nexus.to.crosswallet.desktop',
          name: 'ONEwallet+ Extension',
          provider: crossProvider
        }
      }
      /*
       * Console.log('[Wagmi Cross Connector] ⚠️ CROSSx Extension provider not detected, will retry on connect')
       * 실제 연결 시도 시점에 다시 감지를 시도하는 wrapper provider
       */

      return {
        id: 'nexus.to.crosswallet.desktop',
        name: 'ONEwallet+ Extension',
        provider: {
          request: async (args: any) => {
            // Console.log('[Wagmi Cross Connector] Connection attempt, retrying detection...')

            // 연결 시도 시 다시 감지
            const provider = detectCrossExtensionProvider()

            if (!provider) {
              throw new Error(
                'Cross Extension Wallet is not installed or not detected. Please install Cross Extension Wallet and refresh the page.'
              )
            }

            return provider.request(args)
          },
          on: (...args: any[]) => {
            const provider = detectCrossExtensionProvider()

            return provider?.on?.(...args) ?? undefined
          },
          removeListener: (...args: any[]) => {
            const provider = detectCrossExtensionProvider()

            return provider?.removeListener?.(...args) ?? undefined
          },
          isConnected: () => {
            const provider = detectCrossExtensionProvider()

            return provider?.isConnected?.() ?? false
          }
        }
      }
    }
  })
}
