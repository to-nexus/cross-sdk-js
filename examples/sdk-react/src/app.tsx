import { useEffect, useState } from 'react'
import { useAppKitAccount, useAppKitTheme } from '@to-nexus/sdk/react'

import { useAppKitAccount as useReownAccount } from '@reown/appkit/react'

import { AccountInfo } from './components/account-info'
import ActionButtonList from './components/action-button'
import Footer from './components/footer'
import InfoList from './components/info-list'
import { useWalletContext } from './contexts/wallet-context'

// Reown AppKit의 Web Component 타입 선언
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'w3m-network-button': {
        disabled?: boolean
      }
    }
  }
}

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark')
  const { setThemeMode: setCrossSdkTheme } = useAppKitTheme()
  const crossAccount = useAppKitAccount() // Cross SDK 계정
  const reownAccount = useReownAccount() // Reown AppKit 계정 (MetaMask QR)
  const { getActiveWalletType } = useWalletContext() // MetaMask Extension 상태

  useEffect(() => {
  document.documentElement.className = themeMode
    setCrossSdkTheme(themeMode)
  }, [themeMode, setCrossSdkTheme])

  // 활성 지갑 타입 확인
  const activeWalletType = getActiveWalletType()

  // MetaMask 연결: Extension 또는 QR Code
  const isMetaMaskConnected =
    activeWalletType === 'metamask' || // MetaMask Extension
    (reownAccount?.isConnected && !!reownAccount?.address) // MetaMask QR

  // CROSSx Wallet 연결: Extension 또는 QR Code
  const isCrossConnected =
    !isMetaMaskConnected && // MetaMask가 아니고
    crossAccount?.isConnected &&
    !!crossAccount?.address // boolean으로 명확히 변환

  return (
    <div className="page-container">
      <div className="logo-container">
        <img
          src={themeMode === 'dark' ? './nexus-logo-white.png' : './nexus-logo.png'}
          alt="Nexus"
          width="150"
        />
        <img src="./appkit-logo.png" alt="Cross Sdk" width="150" />
      </div>

      <h1 className="page-title">Cross React Sdk Example</h1>

      <button
        onClick={() => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))}
        style={{
          padding: '8px 16px',
          marginBottom: '20px',
          backgroundColor: themeMode === 'dark' ? '#333' : '#fff',
          color: themeMode === 'dark' ? '#fff' : '#333',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Toggle Theme: {themeMode === 'dark' ? '🌙 Dark' : '☀️ Light'}
      </button>

      {/* 조건부 네트워크 버튼: MetaMask는 Reown, CROSSx Wallet은 Cross SDK */}
      {isMetaMaskConnected ? (
        <w3m-network-button />
      ) : isCrossConnected ? (
        <appkit-network-button />
      ) : null}

      <ActionButtonList />
      <AccountInfo />
      <InfoList />
      <Footer />
    </div>
  )
}
