import { useCallback, useEffect, useState } from 'react'

import { useAppKit as useReownAppKit } from '@reown/appkit/react'
import { useAppKitWallet } from '@to-nexus/appkit/react'

import { useWallet } from '../providers/WalletProvider'
import { useAccount } from 'wagmi'

export function WalletSelector() {
  const { currentWallet, handleConnect, handleDisconnect } = useWallet()
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const [isMetaMaskExtensionInstalled, setIsMetaMaskExtensionInstalled] = useState(false)

  // Cross SDK hooks
  const { connect, connectCrossExtensionWallet, isInstalledCrossExtensionWallet } =
    useAppKitWallet()

  // Reown AppKit hook
  const reownAppKit = useReownAppKit()

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
  }, [isInstalledCrossExtensionWallet])

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

  // MetaMask QR Code 연결
  const handleConnectMetaMaskQRCode = async () => {
    try {
      setIsLoading(true)
      console.log('🦊 MetaMask QR Code 연결 시도')
      
      // 이미 MetaMask로 설정되어 있으면 바로 모달 열기
      if (currentWallet === 'metamask') {
        console.log('✅ 이미 MetaMask로 설정됨, 모달 열기')
        reownAppKit.open()
      } else {
        // CrossWallet에서 전환 필요
        console.log('🔄 MetaMask로 전환 중...')
        await handleConnect('metamask')
        
        // 지갑 전환 완료 대기 (리마운트 시간)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('✅ MetaMask로 전환 완료, 모달 열기')
        reownAppKit.open()
      }
    } catch (error) {
      console.error('Error connecting MetaMask QR Code:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // MetaMask Extension 연결
  const handleConnectMetaMaskExtension = async () => {
    try {
      setIsLoading(true)
      console.log('🦊 MetaMask Extension 연결 시도')

      // MetaMask provider 찾기
      const metamaskProvider = findMetaMaskProvider()

      if (!metamaskProvider) {
        console.log('❌ MetaMask not found')
        alert(
          'MetaMask Extension이 설치되어 있지 않습니다.\n\n' +
          'MetaMask를 설치하시거나, 이미 설치되어 있다면:\n' +
          '1. MetaMask Extension을 활성화해주세요\n' +
          '2. 다른 지갑 Extension을 비활성화하고 새로고침해주세요\n' +
          '3. MetaMask (QR Code) 버튼을 사용해 모바일로 연결하세요'
        )
        return
      }

      console.log('✅ MetaMask provider found:', metamaskProvider.isMetaMask)

      // 이미 MetaMask로 설정되어 있으면 바로 연결
      if (currentWallet === 'metamask') {
        console.log('✅ 이미 MetaMask로 설정됨, Extension 연결')
        
        const accounts = await metamaskProvider.request({
          method: 'eth_requestAccounts'
        })

        if (accounts && accounts.length > 0) {
          console.log('✅ MetaMask Extension 연결 성공:', accounts[0])
        }
      } else {
        // CrossWallet에서 전환 필요
        console.log('🔄 MetaMask로 전환 중...')
        await handleConnect('metamask')
        
        // 지갑 전환 완료 대기 (리마운트 시간 + 추가)
        await new Promise(resolve => setTimeout(resolve, 1200))

        console.log('✅ MetaMask로 전환 완료, Extension 연결')
        
        const accounts = await metamaskProvider.request({
          method: 'eth_requestAccounts'
        })

        if (accounts && accounts.length > 0) {
          console.log('✅ MetaMask Extension 연결 성공:', accounts[0])
        }
      }
    } catch (error) {
      console.error('Error connecting MetaMask Extension:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // CrossWallet QR Code 연결
  const handleConnectCrossWalletQRCode = async () => {
    try {
      setIsLoading(true)
      console.log('⚡ CROSSx QR Code 연결 시도')

      // 이미 CrossWallet으로 설정되어 있으면 바로 모달 열기
      if (currentWallet === 'cross_wallet') {
        console.log('✅ 이미 CrossWallet으로 설정됨, QR Code 모달 열기')
        connect('cross_wallet')
      } else {
        // MetaMask에서 전환 필요
        console.log('🔄 CrossWallet으로 전환 중...')
        await handleConnect('cross_wallet')
        
        // 지갑 전환 완료 대기 (리마운트 시간)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('✅ CrossWallet으로 전환 완료, QR Code 모달 열기')
        connect('cross_wallet')
      }
    } catch (error) {
      console.error('Error connecting CrossWallet QR Code:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Cross Extension 연결
  const handleConnectCrossExtension = async () => {
    try {
      setIsLoading(true)
      console.log('⚡ Cross Extension Wallet 연결 시도')

      // 이미 CrossWallet으로 설정되어 있으면 바로 연결
      if (currentWallet === 'cross_wallet') {
        console.log('✅ 이미 CrossWallet으로 설정됨, Extension 연결')
        
        const result = await connectCrossExtensionWallet()
        console.log('✅ Cross Extension 연결 완료:', result)
      } else {
        // MetaMask에서 전환 필요
        console.log('🔄 CrossWallet으로 전환 중...')
        await handleConnect('cross_wallet')

        // 지갑 전환 완료 대기 (리마운트 시간 + 추가)
        await new Promise(resolve => setTimeout(resolve, 1200))

        console.log('✅ CrossWallet으로 전환 완료, Extension 연결')
        
        const result = await connectCrossExtensionWallet()
        console.log('✅ Cross Extension 연결 완료:', result)
      }
    } catch (error) {
      console.error('Error connecting Cross Extension:', error)
      alert(`연결 실패: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
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
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
        🔐 지갑 선택 및 연결
      </h2>

      {/* 현재 상태 표시 */}
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
          현재 지갑: <strong>{currentWallet === 'cross_wallet' ? 'CrossWallet' : 'MetaMask'}</strong>
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
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: '#F6851B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? 'Connecting...' : 'Connect MetaMask (QR Code)'}
              </button>
              <button
                onClick={handleConnectMetaMaskExtension}
                disabled={!isMetaMaskExtensionInstalled || isLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: isMetaMaskExtensionInstalled ? '#F6851B' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isMetaMaskExtensionInstalled && !isLoading ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isMetaMaskExtensionInstalled && !isLoading ? 1 : 0.6
                }}
              >
                {isLoading
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
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleConnectCrossWalletQRCode}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: '#00D5AA',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? 'Connecting...' : 'Connect CROSSx (QR Code)'}
              </button>
              <button
                onClick={handleConnectCrossExtension}
                disabled={!isCrossExtensionInstalled || isLoading}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 24px',
                  backgroundColor: isCrossExtensionInstalled ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isCrossExtensionInstalled && !isLoading ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isCrossExtensionInstalled && !isLoading ? 1 : 0.6
                }}
              >
                {isLoading
                  ? 'Connecting...'
                  : `Connect Cross Extension ${isCrossExtensionInstalled ? '✅' : '❌'}`}
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
