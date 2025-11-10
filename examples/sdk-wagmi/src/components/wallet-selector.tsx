import { useCallback, useEffect, useState } from 'react'

import { useAppKit, useAppKitState } from '@to-nexus/appkit/react'
import { useAppKitWallet } from '@to-nexus/appkit/react'
import { useAccount } from 'wagmi'

import { useAppKit as useReownAppKit } from '@reown/appkit/react'

import { useWallet } from '../providers/WalletProvider'
import { sdkWagmiAdapter } from '../utils/wagmi-utils'

export function WalletSelector() {
  const { currentWallet, handleConnect, handleDisconnect } = useWallet()
  const { address, isConnected } = useAccount()

  // ✅ 개별 버튼별 loading state 관리
  const [loadingStates, setLoadingStates] = useState({
    metamaskQR: false,
    metamaskExtension: false,
    crossQR: false,
    crossExtension: false,
    authenticateCrossExtension: false,
    authenticateWalletConnect: false
  })

  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const [isMetaMaskExtensionInstalled, setIsMetaMaskExtensionInstalled] = useState(false)

  // Cross SDK hooks
  const { connect, connectCrossExtensionWallet, isInstalledCrossExtensionWallet } =
    useAppKitWallet()
  const crossAppKit = useAppKit()
  const appKitState = useAppKitState()

  // Reown AppKit hook
  const reownAppKit = useReownAppKit()

  // ✅ 전체 loading 여부 계산
  const isAnyLoading = Object.values(loadingStates).some(state => state)

  // MetaMask provider 찾기 헬퍼
  const findMetaMaskProvider = useCallback(() => {
    if (typeof window.ethereum === 'undefined') {
      return null
    }

    const ethereum = window.ethereum as any

    // 여러 지갑이 설치되어 있는 경우
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      const metamaskProvider = ethereum.providers.find(
        (provider: any) => provider.isMetaMask && !provider.isCrossWallet
      )
      return metamaskProvider || null
    }

    // 단일 지갑이 설치되어 있는 경우
    if (ethereum.isMetaMask && !ethereum.isCrossWallet) {
      return ethereum
    }

    return null
  }, [])

  // Cross Extension 설치 확인
  const checkCrossExtension = useCallback(() => {
    try {
      const installed = isInstalledCrossExtensionWallet()
      setIsCrossExtensionInstalled(installed)
    } catch (error) {
      console.error('Cross Extension 설치 상태 확인 중 오류:', error)
      setIsCrossExtensionInstalled(false)
    }
  }, [])

  // MetaMask Extension 설치 확인
  const checkMetaMaskExtension = useCallback(() => {
    try {
      const metamaskProvider = findMetaMaskProvider()
      setIsMetaMaskExtensionInstalled(!!metamaskProvider)
    } catch (error) {
      console.error('MetaMask Extension 설치 상태 확인 중 오류:', error)
      setIsMetaMaskExtensionInstalled(false)
    }
  }, [findMetaMaskProvider])

  useEffect(() => {
    // 초기 확인
    checkCrossExtension()
    checkMetaMaskExtension()

    // 3초마다 확인
    const interval = setInterval(() => {
      checkCrossExtension()
      checkMetaMaskExtension()
    }, 3000)

    return () => clearInterval(interval)
  }, [checkCrossExtension, checkMetaMaskExtension])

  // ✅ 연결 해제 시 모든 loading state 초기화
  useEffect(() => {
    if (!isConnected) {
      setLoadingStates({
        metamaskQR: false,
        metamaskExtension: false,
        crossQR: false,
        crossExtension: false,
        authenticateCrossExtension: false,
        authenticateWalletConnect: false
      })
    }
  }, [isConnected])

  // ✅ 모달이 닫힐 때 WalletConnect 인증 로딩 상태 리셋
  useEffect(() => {
    if (!appKitState.open && loadingStates.authenticateWalletConnect) {
      setLoadingStates(prev => ({ ...prev, authenticateWalletConnect: false }))
    }
  }, [appKitState.open, loadingStates.authenticateWalletConnect])

  // MetaMask QR Code 연결
  const handleConnectMetaMaskQRCode = async () => {
    // ✅ MetaMask 연결 시 Cross SDK의 자동 SIWE 모달 방지
    let SIWXUtil: any = null
    try {
      const core = await import('@to-nexus/appkit-core')
      SIWXUtil = core.SIWXUtil
      if (SIWXUtil) {
        SIWXUtil._isAuthenticating = true
      }
    } catch (e) {
      // Ignore if SIWXUtil is not available
    }

    try {
      setLoadingStates(prev => ({ ...prev, metamaskQR: true }))

      if (currentWallet === 'metamask') {
        reownAppKit.open()
      } else {
        await handleConnect('metamask', { autoConnect: false })
        await new Promise(resolve => setTimeout(resolve, 500))
        reownAppKit.open()
      }
    } catch (error) {
      console.error('Error connecting MetaMask QR Code:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, metamaskQR: false }))
      if (SIWXUtil) {
        setTimeout(() => {
          SIWXUtil._isAuthenticating = false
        }, 1000)
      }
    }
  }

  // MetaMask Extension 연결
  const handleConnectMetaMaskExtension = async () => {
    // ✅ MetaMask 연결 시 Cross SDK의 자동 SIWE 모달 방지
    let SIWXUtil: any = null
    try {
      const core = await import('@to-nexus/appkit-core')
      SIWXUtil = core.SIWXUtil
      if (SIWXUtil) {
        SIWXUtil._isAuthenticating = true
      }
    } catch (e) {
      // Ignore if SIWXUtil is not available
    }

    try {
      setLoadingStates(prev => ({ ...prev, metamaskExtension: true }))

      const metamaskProvider = findMetaMaskProvider()

      if (!metamaskProvider) {
        alert(
          'MetaMask Extension이 설치되어 있지 않습니다.\n\n' +
            'MetaMask를 설치하시거나, 이미 설치되어 있다면:\n' +
            '1. MetaMask Extension을 활성화해주세요\n' +
            '2. 다른 지갑 Extension을 비활성화하고 새로고침해주세요\n' +
            '3. MetaMask (QR Code) 버튼을 사용해 모바일로 연결하세요'
        )
        return
      }

      if (currentWallet === 'metamask') {
        await metamaskProvider.request({
          method: 'eth_requestAccounts'
        })
      } else {
        await handleConnect('metamask', { autoConnect: false })
        await new Promise(resolve => setTimeout(resolve, 500))
        await metamaskProvider.request({
          method: 'eth_requestAccounts'
        })
      }
    } catch (error) {
      console.error('Error connecting MetaMask Extension:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, metamaskExtension: false }))
      if (SIWXUtil) {
        setTimeout(() => {
          SIWXUtil._isAuthenticating = false
        }, 1000)
      }
    }
  }

  // CrossWallet QR Code 연결
  const handleConnectCrossWalletQRCode = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, crossQR: true }))

      if (currentWallet === 'cross_wallet') {
        connect('cross_wallet')
      } else {
        await handleConnect('cross_wallet')
        await new Promise(resolve => setTimeout(resolve, 1000))
        connect('cross_wallet')
      }
    } catch (error) {
      console.error('Error connecting CrossWallet QR Code:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, crossQR: false }))
    }
  }

  // Cross Extension 연결
  const handleConnectCrossExtension = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, crossExtension: true }))

      if (currentWallet === 'cross_wallet') {
        await connectCrossExtensionWallet()
      } else {
        await handleConnect('cross_wallet')
        await new Promise(resolve => setTimeout(resolve, 1200))
        await connectCrossExtensionWallet()
      }
    } catch (error) {
      console.error('Error connecting Cross Extension:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, crossExtension: false }))
    }
  }

  // ✅ Cross Extension 연결 + SIWE 인증 통합
  const handleAuthenticateCrossExtension = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, authenticateCrossExtension: true }))

      if (currentWallet === 'cross_wallet') {
        const result = await sdkWagmiAdapter.authenticateCrossExtensionWallet()

        if (result && result.authenticated && result.sessions && result.sessions.length > 0) {
          const session = result.sessions[0]
          if (session) {
            alert(
              `🎉 SIWE 인증 성공!\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📍 Address:\n${session.data.accountAddress}\n\n` +
                `🔗 Chain ID:\n${session.data.chainId}\n\n` +
                `✍️ Signature:\n${session.signature.substring(0, 20)}...${session.signature.substring(session.signature.length - 20)}\n\n` +
                `📅 Expires:\n${session.data.expirationTime || 'N/A'}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━`
            )
          }
        }
      } else {
        await handleConnect('cross_wallet')
        await new Promise(resolve => setTimeout(resolve, 1200))

        const result = await sdkWagmiAdapter.authenticateCrossExtensionWallet()

        if (result && result.authenticated && result.sessions && result.sessions.length > 0) {
          const session = result.sessions[0]
          if (session) {
            alert(
              `🎉 SIWE 인증 성공!\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📍 Address:\n${session.data.accountAddress}\n\n` +
                `🔗 Chain ID:\n${session.data.chainId}\n\n` +
                `✍️ Signature:\n${session.signature.substring(0, 20)}...${session.signature.substring(session.signature.length - 20)}\n\n` +
                `📅 Expires:\n${session.data.expirationTime || 'N/A'}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━`
            )
          }
        }
      }
    } catch (error) {
      console.error('Error authenticating Cross Extension:', error)
      alert(`인증 실패: ${(error as Error).message}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, authenticateCrossExtension: false }))
    }
  }

  // ✅ QR Code 연결 + SIWE 인증 통합
  const handleAuthenticateWalletConnect = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, authenticateWalletConnect: true }))

      if (currentWallet === 'cross_wallet') {
        const result = await crossAppKit.authenticateWalletConnect()

        if (result && typeof result === 'object' && 'authenticated' in result) {
          if (result.authenticated && result.sessions && result.sessions.length > 0) {
            const session = result.sessions[0]
            if (session) {
              alert(
                `🎉 SIWE 인증 성공!\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `📍 Address:\n${session.data.accountAddress}\n\n` +
                  `🔗 Chain ID:\n${session.data.chainId}\n\n` +
                  `✍️ Signature:\n${session.signature.substring(0, 20)}...${session.signature.substring(session.signature.length - 20)}\n\n` +
                  `📅 Expires:\n${session.data.expirationTime || 'N/A'}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━`
              )
            }
          }
        }
      } else {
        await handleConnect('cross_wallet')
        await new Promise(resolve => setTimeout(resolve, 1200))

        const result = await crossAppKit.authenticateWalletConnect()

        if (result && typeof result === 'object' && 'authenticated' in result) {
          if (result.authenticated && result.sessions && result.sessions.length > 0) {
            const session = result.sessions[0]
            if (session) {
              alert(
                `🎉 SIWE 인증 성공!\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `📍 Address:\n${session.data.accountAddress}\n\n` +
                  `🔗 Chain ID:\n${session.data.chainId}\n\n` +
                  `✍️ Signature:\n${session.signature.substring(0, 20)}...${session.signature.substring(session.signature.length - 20)}\n\n` +
                  `📅 Expires:\n${session.data.expirationTime || 'N/A'}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━`
              )
            }
          }
        }
      }
    } catch (error) {
      console.error('Error authenticating WalletConnect:', error)
      alert(`인증 실패: ${(error as Error).message}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, authenticateWalletConnect: false }))
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px'
      }}
    >
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>🔐 지갑 선택 및 연결</h2>

      {/* 현재 상태 표시 */}
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
          현재 지갑:{' '}
          <strong>{currentWallet === 'cross_wallet' ? 'CrossWallet' : 'MetaMask'}</strong>
        </p>
        {isConnected && (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            연결된 주소:{' '}
            <code style={{ fontSize: '12px' }}>
              {address?.slice(0, 10)}...{address?.slice(-8)}
            </code>
          </p>
        )}
      </div>

      {/* 연결되지 않은 경우 */}
      {!isConnected && (
        <>
          {/* MetaMask 연결 버튼들 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#F6851B' }}>
              🦊 MetaMask
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleConnectMetaMaskQRCode}
                disabled={isAnyLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: '#F6851B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isAnyLoading ? 0.6 : 1
                }}
              >
                {loadingStates.metamaskQR ? 'Connecting...' : 'Connect MetaMask (QR Code)'}
              </button>
              <button
                onClick={handleConnectMetaMaskExtension}
                disabled={!isMetaMaskExtensionInstalled || isAnyLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: isMetaMaskExtensionInstalled ? '#F6851B' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isMetaMaskExtensionInstalled && !isAnyLoading ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isMetaMaskExtensionInstalled && !isAnyLoading ? 1 : 0.6
                }}
              >
                {loadingStates.metamaskExtension
                  ? 'Connecting...'
                  : `Connect MetaMask Extension ${isMetaMaskExtensionInstalled ? '✅' : '❌'}`}
              </button>
            </div>
          </div>

          {/* CrossWallet 연결 버튼들 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#00D5AA' }}>
              ⚡ CrossWallet
            </h3>

            {/* 일반 연결 버튼 */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleConnectCrossWalletQRCode}
                disabled={isAnyLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: '#00D5AA',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isAnyLoading ? 0.6 : 1
                }}
              >
                {loadingStates.crossQR ? 'Connecting...' : 'Connect CROSSx (QR Code)'}
              </button>
              <button
                onClick={handleConnectCrossExtension}
                disabled={!isCrossExtensionInstalled || isAnyLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: isCrossExtensionInstalled ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isCrossExtensionInstalled && !isAnyLoading ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isCrossExtensionInstalled && !isAnyLoading ? 1 : 0.6
                }}
              >
                {loadingStates.crossExtension
                  ? 'Connecting...'
                  : `Connect Cross Extension ${isCrossExtensionInstalled ? '✅' : '❌'}`}
              </button>
            </div>

            {/* ✅ Connect + Auth (SIWE) 버튼 */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              <button
                onClick={handleAuthenticateWalletConnect}
                disabled={isAnyLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isAnyLoading ? 0.6 : 1,
                  boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)'
                }}
              >
                {loadingStates.authenticateWalletConnect
                  ? 'Authenticating...'
                  : '🔐 Connect + Auth (QR Code)'}
              </button>
              <button
                onClick={handleAuthenticateCrossExtension}
                disabled={!isCrossExtensionInstalled || isAnyLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: isCrossExtensionInstalled ? '#6366F1' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isCrossExtensionInstalled && !isAnyLoading ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isCrossExtensionInstalled && !isAnyLoading ? 1 : 0.6,
                  boxShadow: isCrossExtensionInstalled
                    ? '0 4px 6px rgba(99, 102, 241, 0.3)'
                    : 'none'
                }}
              >
                {loadingStates.authenticateCrossExtension
                  ? 'Authenticating...'
                  : `🔐 Connect + Auth (Extension) ${isCrossExtensionInstalled ? '✅' : '❌'}`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 연결된 경우 */}
      {isConnected && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDisconnect}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '12px 24px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#DC2626'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#EF4444'
            }}
          >
            🔓 연결 해제
          </button>
        </div>
      )}

      {/* 안내 메시지 */}
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontStyle: 'italic'
        }}
      >
        💡 QR Code는 모바일 앱 연결, Extension은 브라우저 확장 프로그램 연결입니다.
      </p>
    </div>
  )
}
