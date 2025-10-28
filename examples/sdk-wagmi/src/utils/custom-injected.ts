import type { CreateConnectorFn } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Cross Extension을 감지하기 위한 헬퍼 함수
function detectCrossExtensionProvider() {
  if (typeof window === 'undefined') return null

  console.log('[Cross Detector] Starting detection...')
  console.log(
    '[Cross Detector] Window keys with "cross":',
    Object.keys(window).filter(k => k.toLowerCase().includes('cross'))
  )

  // 1. window.crossWallet 확인 (Cross Extension의 주요 주입 방식)
  const crossWallet = (window as any).crossWallet
  if (crossWallet) {
    console.log('[Cross Detector] ✅ Found via window.crossWallet')
    console.log('[Cross Detector] window.crossWallet properties:', {
      hasRequest: typeof crossWallet.request === 'function',
      hasOn: typeof crossWallet.on === 'function',
      hasRemoveListener: typeof crossWallet.removeListener === 'function',
      hasIsConnected: typeof crossWallet.isConnected === 'function',
      constructor: crossWallet.constructor?.name
    })
    return crossWallet
  }

  const ethereum = (window as any).ethereum

  // 디버깅: window.ethereum 구조 출력
  if (ethereum) {
    console.log('[Cross Detector] window.ethereum structure:', {
      isCrossWallet: ethereum.isCrossWallet,
      isCross: ethereum.isCross,
      isCrossExtension: ethereum.isCrossExtension,
      isMetaMask: ethereum.isMetaMask,
      hasProviders: !!ethereum.providers,
      providersCount: ethereum.providers?.length,
      rdns: ethereum['nexus.to.crosswallet.desktop']
    })
  }

  // 2. window.ethereum.providers 배열에서 Cross Extension 찾기
  if (ethereum?.providers && Array.isArray(ethereum.providers)) {
    console.log('[Cross Detector] Checking providers array...')
    for (let i = 0; i < ethereum.providers.length; i++) {
      const provider = ethereum.providers[i]
      console.log(`[Cross Detector] Provider ${i}:`, {
        isCrossWallet: provider.isCrossWallet,
        isCross: provider.isCross,
        isCrossExtension: provider.isCrossExtension,
        isMetaMask: provider.isMetaMask
      })

      if (provider.isCrossWallet || provider.isCross || provider.isCrossExtension) {
        console.log('[Cross Detector] ✅ Found Cross Extension in providers array at index', i)
        return provider
      }
    }
  }

  // 3. window.ethereum 자체가 Cross Extension인지 확인
  if (ethereum?.isCrossWallet || ethereum?.isCross || ethereum?.isCrossExtension) {
    console.log('[Cross Detector] ✅ Found Cross Extension as main ethereum provider')
    return ethereum
  }

  // 4. RDNS 기반 확인
  const rdns = 'nexus.to.crosswallet.desktop'
  if (ethereum?.[rdns]) {
    console.log('[Cross Detector] ✅ Found Cross Extension via RDNS')
    return ethereum[rdns]
  }

  // 5. window.crossExtension 확인
  if ((window as any).crossExtension) {
    console.log('[Cross Detector] ✅ Found via window.crossExtension')
    return (window as any).crossExtension
  }

  // 6. window.cross 확인
  if ((window as any).cross) {
    console.log('[Cross Detector] ✅ Found via window.cross')
    return (window as any).cross
  }

  console.log('[Cross Detector] ❌ Cross Extension not found')
  return null
}

// Cross Extension Wallet을 위한 커스텀 injected connector
export function crossExtensionConnector(): CreateConnectorFn {
  return injected({
    target() {
      console.log('[Wagmi Cross Connector] Initializing connector...')

      const crossProvider = detectCrossExtensionProvider()

      if (crossProvider) {
        console.log('[Wagmi Cross Connector] ✅ Cross Extension provider detected and ready')
        return {
          id: 'cross-extension',
          name: 'Cross Extension',
          provider: crossProvider
        }
      }

      // Cross Extension을 찾지 못한 경우에도 connector는 반환
      // 이렇게 해야 connectors 리스트에 포함됨
      console.log(
        '[Wagmi Cross Connector] ⚠️ Cross Extension not found initially, will retry on connect'
      )

      // 실제 연결 시도 시점에 다시 감지를 시도하는 wrapper provider
      return {
        id: 'cross-extension',
        name: 'Cross Extension',
        provider: {
          request: async (args: any) => {
            console.log('[Wagmi Cross Connector] Connection attempt, retrying detection...')

            // 연결 시도 시 다시 감지
            const provider = detectCrossExtensionProvider()

            if (!provider) {
              throw new Error(
                'Cross Extension Wallet is not installed or not detected. Please install Cross Extension Wallet and refresh the page.'
              )
            }

            console.log('[Wagmi Cross Connector] ✅ Found provider on retry, forwarding request')
            return provider.request(args)
          },
          on: (...args: any[]) => {
            const provider = detectCrossExtensionProvider()
            if (provider && provider.on) {
              return provider.on(...args)
            }
          },
          removeListener: (...args: any[]) => {
            const provider = detectCrossExtensionProvider()
            if (provider && provider.removeListener) {
              return provider.removeListener(...args)
            }
          },
          isConnected: () => {
            const provider = detectCrossExtensionProvider()
            return provider ? (provider.isConnected?.() ?? false) : false
          }
        } as any
      }
    }
  })
}
