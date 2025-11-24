import { WagmiAdapter as ToNexusWagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'
import {
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  kaiaMainnet,
  kaiaTestnet,
  roninMainnet,
  roninTestnet
} from '@to-nexus/appkit/networks'
import type { AppKitNetwork } from '@to-nexus/appkit/networks'
import { createDefaultSIWXConfig } from '@to-nexus/appkit/react'

import { WagmiAdapter as ReownWagmiAdapter } from '@reown/appkit-adapter-wagmi'

// 프로젝트 ID들
// VITE_PROJECT_ID는 Cross SDK용 (다른 examples와 일관성 유지)
export const crossSdkProjectId =
  import.meta.env['VITE_PROJECT_ID'] || '0979fd7c92ec3dbd8e78f433c3e5a523'
// MetaMask (Reown)용 Project ID (환경변수 또는 기본값)
export const projectId =
  import.meta.env['VITE_METAMASK_PROJECT_ID'] || 'a48aa6e93d89fbc0f047637579e65356'

// 지원하는 네트워크 정의
export const networks = [
  etherMainnet,
  etherTestnet,
  bscMainnet,
  bscTestnet,
  crossTestnet,
  crossMainnet,
  kaiaMainnet,
  kaiaTestnet,
  roninMainnet,
  roninTestnet
]

// MetaMask용 Reown AppKit Adapter
export const wagmiAdapter = new ReownWagmiAdapter({
  projectId, // Reown 프로젝트 ID
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]]
})

// SIWX 설정 (SIWE 인증)
export const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in with your wallet to Cross SDK Wagmi Sample App',

  // 🔐 백엔드에서 nonce 가져오기 (보안 필수!)
  getNonce: async () => {
    // 데모용: 임시로 랜덤 생성 (프로덕션에서는 절대 사용 금지!)
    console.warn(
      '⚠️ Using client-side nonce generation. Implement backend /api/siwe/nonce for production!'
    )
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },

  // 백엔드에서 서명 검증 및 세션 저장
  addSession: async session => {
    // 데모용: localStorage에 저장 (프로덕션에서는 백엔드에 저장!)
    console.log('✅ SIWX Session (save to backend in production):', {
      address: session.data.accountAddress,
      chainId: session.data.chainId,
      signature: session.signature.substring(0, 20) + '...'
    })
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },

  // 백엔드에서 세션 조회
  getSessions: async (chainId, address) => {
    // 데모용: localStorage에서 조회 (단수와 복수 키 모두 확인)

    // 1. siwx_session (단수) 확인 - Extension + SIWE
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (
        session.data.chainId === chainId &&
        session.data.accountAddress.toLowerCase() === address.toLowerCase()
      ) {
        return [session]
      }
    }

    // 2. siwx_sessions (복수) 확인 - QR code + SIWE
    const sessionsStr = localStorage.getItem('siwx_sessions')
    if (sessionsStr) {
      const sessions = JSON.parse(sessionsStr)
      const matchingSessions = sessions.filter(
        (session: any) =>
          session.data.chainId === chainId &&
          session.data.accountAddress.toLowerCase() === address.toLowerCase()
      )
      if (matchingSessions.length > 0) {
        return matchingSessions
      }
    }

    return []
  },

  // ✅ 일반 Connect 시 자동 SIWE 모달을 띄우지 않음 (Connect + Auth 버튼에서만 SIWE 수행)
  getRequired: () => false
})

// CrossWallet용 CROSS SDK Adapter
export const sdkWagmiAdapter = new ToNexusWagmiAdapter({
  projectId: crossSdkProjectId, // CROSS SDK 프로젝트 ID
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]],
  siwx: siwxConfig // ✅ SIWX 설정 추가
})

// 각각의 Wagmi Config 추출
export const config = wagmiAdapter.wagmiConfig
export const crossSdkConfig = sdkWagmiAdapter.wagmiConfig
