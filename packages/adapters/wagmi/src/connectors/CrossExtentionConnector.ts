import type { CreateConnectorFn } from 'wagmi'
import { injected } from 'wagmi/connectors'

/**
 * Cross Extension Wallet을 위한 커스텀 injected connector
 * localStorage에 연결 상태 보존 및 자동 연결 지원
 */
export function crossExtensionConnector(): CreateConnectorFn {
  return injected({
    target: {
      id: 'nexus.to.crosswallet.desktop',
      name: 'Cross Wallet Desktop',
      provider: () => {
        if (typeof window === 'undefined') {
          return undefined
        }

        // 1. window.crossWallet 확인
        /* @ts-expect-error - Cross Wallet은 window.crossWallet에 정의됨 */
        if (window.crossWallet) {
          // eslint-disable-next-line no-console
          console.log('🔍 Cross Wallet 감지: window.crossWallet 사용')

          /* @ts-expect-error - Cross Wallet 타입 처리 */
          return window.crossWallet
        }

        return undefined
      }
    },
    // 연결 해제 시 localStorage에 상태 저장 (새로고침 시 자동 연결 지원)
    shimDisconnect: true
  })
}
