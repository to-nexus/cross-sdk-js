import type { CreateConnectorFn } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Cross Extension을 감지하기 위한 헬퍼 함수
function detectCrossExtensionProvider() {
  if (typeof window !== 'undefined') {
    // 1. window.crossWallet 확인 (Cross Extension의 주요 주입 방식)
    const crossWallet = (window as any).crossWallet
    if (crossWallet) {
      return crossWallet
    }
  }

  return undefined
}

// Cross Extension Wallet을 위한 커스텀 injected connector
export function crossExtensionConnector(): CreateConnectorFn {
  return injected({
    target() {
      const crossProvider = detectCrossExtensionProvider()
      if (crossProvider) {
        // Console.log('[Wagmi Cross Connector] ✅ Cross Wallet Desktop provider detected and ready')
        return {
          id: 'nexus.to.crosswallet.desktop',
          name: 'Cross Wallet Desktop',
          provider: crossProvider
        }
      }
      /*
       * Console.log('[Wagmi Cross Connector] ⚠️ Cross Wallet Desktop provider not detected, will retry on connect')
       * 실제 연결 시도 시점에 다시 감지를 시도하는 wrapper provider
       */

      return {
        id: 'nexus.to.crosswallet.desktop',
        name: 'Cross Wallet Desktop',
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
