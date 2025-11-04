import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import { useAppKit as useCrossAppKit } from '@to-nexus/appkit/react'
import { useAppKitAccount as useCrossAppKitAccount } from '@to-nexus/appkit/react'
import { useDisconnect as useCrossDisconnect } from '@to-nexus/appkit/react'
import { WagmiProvider } from 'wagmi'
import type { Config } from 'wagmi'

import { useAppKit as useReownAppKit } from '@reown/appkit/react'
import { useAppKitAccount as useReownAppKitAccount } from '@reown/appkit/react'
import { useDisconnect as useReownDisconnect } from '@reown/appkit/react'

import { type WalletType, cookieUtils } from '../utils/cookie-utils'
import { config, crossSdkConfig } from '../utils/wagmi-utils'

interface WalletContextType {
  currentWallet: WalletType
  setCurrentWallet: (wallet: WalletType) => void
  handleConnect: (wallet: WalletType) => Promise<void>
  handleDisconnect: () => Promise<void>
  isReady: boolean
}

const WalletContext = createContext<WalletContextType | null>(null)

// 유틸 함수: 대기
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface WalletProviderProps {
  children: ReactNode
  currentWalletCookie?: WalletType
}

export default function WalletProvider({ children, currentWalletCookie }: WalletProviderProps) {
  // 초기값은 쿠키에서 가져옴 (SSR 안전)
  const [currentWallet, setCurrentWallet] = useState<WalletType>(
    currentWalletCookie || 'cross_wallet'
  )
  const [isTransitioning, setIsTransitioning] = useState(false)

  // CrossWallet hooks
  const crossAppKit = useCrossAppKit()
  const { disconnect: disconnectCross } = useCrossDisconnect()

  // MetaMask (Reown) hooks
  const reownAppKit = useReownAppKit()
  const { disconnect: disconnectMetaMask } = useReownDisconnect()

  // IndexedDB 완전 삭제
  const clearIndexedDB = useCallback(async () => {
    if (typeof window === 'undefined') return

    try {
      const databases = await window.indexedDB.databases()

      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const request = window.indexedDB.deleteDatabase(db.name!)
              request.onsuccess = () => {
                console.log(`Deleted database: ${db.name}`)
                resolve()
              }
              request.onerror = () => reject(request.error)
              request.onblocked = () => {
                console.warn(`Delete blocked for: ${db.name}`)
                resolve() // 블록되어도 계속 진행
              }
            })
          }
          return Promise.resolve()
        })
      )

      console.log('All IndexedDB databases cleared')
    } catch (error) {
      console.error('Error clearing IndexedDB:', error)
    }
  }, [])

  // 지갑 연결 처리
  const handleConnect = useCallback(
    async (wallet: WalletType) => {
      console.log('handleConnect called with:', wallet)

      // 지갑 변경 시: 리마운트 필요
      if (wallet !== currentWallet) {
        console.log('Switching wallet from', currentWallet, 'to', wallet)
        setIsTransitioning(true)
        cookieUtils.setCurrentWallet(wallet)
        setCurrentWallet(wallet)

        // WagmiProvider 리마운트 대기 (key 변경으로 인한 리렌더링)
        await wait(300)
        setIsTransitioning(false)

        // 리마운트 완료 후 connect 호출
        try {
          if (wallet === 'cross_wallet') {
            console.log('Opening Cross AppKit modal...')
            crossAppKit.connect()
          } else {
            console.log('Opening Reown AppKit modal...')
            reownAppKit.open()
          }
        } catch (error) {
          console.error('Error connecting to wallet:', error)
        }
        return
      }

      // 같은 지갑 재연결
      console.log('Opening modal for current wallet:', wallet)
      if (wallet === 'cross_wallet') {
        crossAppKit.connect()
      } else {
        reownAppKit.open()
      }
    },
    [currentWallet, crossAppKit, reownAppKit]
  )

  // 지갑 연결 해제
  const handleDisconnect = useCallback(async () => {
    try {
      console.log('Disconnecting wallet:', currentWallet)

      // 1. 현재 연결된 지갑 연결 해제 (자동 감지)
      if (currentWallet === 'cross_wallet') {
        await disconnectCross()
      } else {
        await disconnectMetaMask()
      }

      // 2. 쿠키 삭제
      cookieUtils.removeCurrentWallet()

      // 3. IndexedDB 완전 삭제 (중요!)
      await clearIndexedDB()

      console.log('Disconnect completed and all data cleared')
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }, [currentWallet, disconnectCross, disconnectMetaMask, clearIndexedDB])

  // 동적 Config 선택
  const wagmiConfig = useMemo(() => {
    if (currentWallet === 'cross_wallet') {
      console.log('Using crossSdkConfig for cross_wallet')
      return crossSdkConfig as Config
    } else {
      console.log('Using config for metamask')
      return config as Config
    }
  }, [currentWallet])

  // Context 값
  const value = useMemo<WalletContextType>(
    () => ({
      currentWallet,
      setCurrentWallet,
      handleConnect,
      handleDisconnect,
      isReady: true
    }),
    [currentWallet, handleConnect, handleDisconnect]
  )

  return (
    <>
      {/* 지갑 전환 중 전체 화면 오버레이 */}
      {isTransitioning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              borderRadius: '16px',
              backgroundColor: 'white',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div
              style={{
                height: '48px',
                width: '48px',
                animation: 'spin 1s linear infinite',
                borderRadius: '9999px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#00D5AA'
              }}
            ></div>
            <p style={{ fontWeight: 600, fontSize: '18px', color: '#111827' }}>지갑 전환 중...</p>
          </div>
        </div>
      )}

      {/* key prop으로 지갑 변경 시 강제 리마운트 */}
      <WagmiProvider key={currentWallet} config={wagmiConfig as Config}>
        <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
      </WagmiProvider>

      {/* 스핀 애니메이션 추가 */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}

// Hook: WalletContext 사용
export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
