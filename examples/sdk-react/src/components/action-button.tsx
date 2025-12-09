import { useCallback, useEffect, useRef, useState } from 'react'

import {
  AccountController,
  ChainController,
  ConnectionController,
  ConstantsUtil,
  CoreHelperUtil,
  OptionsController,
  SIWXUtil,
  SendController,
  UniversalProvider,
  bscMainnet,
  bscTestnet,
  createDefaultSIWXConfig,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  getUniversalProvider,
  initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  roninMainnet,
  roninTestnet,
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
  useAppKitWallet,
  useDisconnect
} from '@to-nexus/sdk/react'
import type { AssetFilterType, SignTypedDataV4Args, WriteContractArgs } from '@to-nexus/sdk/react'
import { v4 as uuidv4 } from 'uuid'

import {
  useAppKitAccount as useReownAccount,
  useAppKit as useReownAppKit,
  useAppKitProvider as useReownAppKitProvider,
  useDisconnect as useReownDisconnect,
  useAppKitNetwork as useReownNetwork
} from '@reown/appkit/react'

import { useWalletContext } from '../contexts/wallet-context'
import { sampleEIP712 } from '../contracts/sample-eip712'
import { sampleErc20ABI } from '../contracts/sample-erc20'
import { sampleErc721ABI } from '../contracts/sample-erc721'
import { useResultModal } from '../hooks/use-result-modal'
import { ResultModal } from './result-modal'

const contractData = {
  612044: {
    coin: 'CROSS',
    erc20: '0xe934057Ac314cD9bA9BC17AE2378959fd39Aa2E3',
    erc721: '0xaD31a95fE6bAc89Bc4Cf84dEfb23ebBCA080c013',
    network: crossTestnet
  },
  612055: {
    coin: 'CROSS',
    erc20: '0xe9013a5231BEB721f4F801F2d07516b8ca19d953',
    erc721: '',
    network: crossMainnet
  },
  97: {
    coin: 'BNB',
    erc20: '',
    erc721: '',
    network: bscTestnet
  },
  56: {
    coin: 'BNB',
    erc20: '',
    erc721: '',
    network: bscMainnet
  },
  1001: {
    coin: 'KAIA',
    erc20: '0xd4846dddf83278d10b92bf6c169c5951d6f5abb8',
    erc721: '',
    network: kaiaTestnet
  },
  8217: {
    coin: 'KAIA',
    erc20: '',
    erc721: '',
    network: kaiaMainnet
  },
  1: {
    coin: 'ETH',
    erc20: '',
    erc721: '',
    network: etherMainnet
  },
  11155111: {
    coin: 'ETH',
    erc20: '',
    erc721: '',
    network: etherTestnet
  },
  2020: {
    coin: 'RON',
    erc20: '',
    erc721: '',
    network: roninMainnet
  },
  2021: {
    coin: 'tRON',
    erc20: '',
    erc721: '',
    network: roninTestnet
  }
}

// API Response types for EIP-712 signing
interface SignTypedDataApiResponse {
  code: number // API response code
  message: string // API response message
  data: {
    params: [string, SignTypedDataV4Args] // Server still sends [address, typedData] tuple
    hash: string
    uuid: string
    recover: object // Recover data object, not string
  }
}

// Your unique project id provided by Cross Team. If you don't have one, please contact us.
const projectId = import.meta.env['VITE_PROJECT_ID']
// Redirect URL to return to after wallet app interaction
const redirectUrl = window.location.href

const metadata = {
  name: 'Cross JS SDK Sample',
  description: 'Cross SDK for React',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

// SDK 초기화 with SIWX (이제 SDK가 기본 구현 제공!)
initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'dark',
  mobileLink: ConstantsUtil.getUniversalLink(),
  // ⚠️ 개발/데모용: 클라이언트에서 랜덤 nonce 생성 (보안 취약!)
  // siwx: createDefaultSIWXConfig({
  //   statement: 'Sign in with your wallet to Cross SDK Sample App'
  // })

  // ✅ 프로덕션 권장: 백엔드에서 nonce 생성 및 서명 검증
  siwx: createDefaultSIWXConfig({
    statement: 'Sign in with your wallet to Cross SDK Sample App',

    // 🔐 SIWE를 선택적으로 만들기 (기본 연결 시 SIWE 모달 안 뜸!)
    getRequired: () => false, // false = SIWE 선택 사항, true = SIWE 필수

    // 🔐 백엔드에서 nonce 가져오기 (보안 필수!)
    getNonce: async () => {
      try {
        // 실제 프로덕션에서는 백엔드 API를 호출해야 합니다
        // const response = await fetch('/api/siwe/nonce')
        // const { nonce } = await response.json()
        // return nonce

        // 데모용: 임시로 랜덤 생성 (프로덕션에서는 절대 사용 금지!)
        console.warn(
          '⚠️ Using client-side nonce generation. Implement backend /api/siwe/nonce for production!'
        )
        return (
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        )
      } catch (error) {
        console.error('Failed to get nonce:', error)
        throw error
      }
    },

    // 백엔드에서 서명 검증 및 세션 저장
    addSession: async session => {
      try {
        // 실제 프로덕션에서는 백엔드로 서명 검증 요청
        // const response = await fetch('/api/siwe/verify', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     message: session.message,
        //     signature: session.signature,
        //     nonce: session.data.nonce,
        //     address: session.data.accountAddress,
        //     chainId: session.data.chainId
        //   })
        // })
        //
        // if (!response.ok) {
        //   throw new Error('Signature verification failed')
        // }

        // 데모용: localStorage에 다중 체인 세션 저장 (프로덕션에서는 백엔드에 저장!)
        const sessionsKey = 'siwx_multi_chain_sessions'
        const existingSessionsStr = localStorage.getItem(sessionsKey)
        let sessions: any[] = existingSessionsStr ? JSON.parse(existingSessionsStr) : []

        // 동일한 chainId + address 조합이 있으면 제거 (갱신)
        sessions = sessions.filter(
          s =>
            !(
              s.data.chainId === session.data.chainId &&
              s.data.accountAddress.toLowerCase() === session.data.accountAddress.toLowerCase()
            )
        )

        // 새 세션 추가
        sessions.push(session)

        localStorage.setItem(sessionsKey, JSON.stringify(sessions))
        console.log(
          `✅ SIWE 세션 저장됨 (chainId: ${session.data.chainId}, address: ${session.data.accountAddress})`
        )
      } catch (error) {
        console.error('Failed to verify signature:', error)
        throw error
      }
    },

    // 백엔드에서 세션 조회
    getSessions: async (chainId, address) => {
      try {
        // 실제 프로덕션에서는 백엔드에서 세션 조회
        // const response = await fetch(
        //   `/api/siwe/sessions?chain=${chainId}&address=${address}`
        // )
        // return response.json()

        // 데모용: localStorage에서 다중 체인 세션 조회
        const sessionsKey = 'siwx_multi_chain_sessions'
        const sessionsStr = localStorage.getItem(sessionsKey)

        if (!sessionsStr) {
          console.log(`⏭️ 저장된 세션 없음`)
          return []
        }

        const sessions = JSON.parse(sessionsStr)

        // 해당 chainId + address 조합으로 필터링
        const matchingSessions = sessions.filter(
          (session: any) =>
            session.data.chainId === chainId &&
            session.data.accountAddress.toLowerCase() === address.toLowerCase()
        )

        if (matchingSessions.length > 0) {
          console.log(
            `✅ 세션 찾음 (chainId: ${chainId}, address: ${address}, count: ${matchingSessions.length})`
          )
        } else {
          console.log(
            `⏭️ 해당 네트워크에 대한 세션 없음 (chainId: ${chainId}, address: ${address})`
          )
        }

        return matchingSessions
      } catch (error) {
        console.error('Failed to get sessions:', error)
        return []
      }
    },

    // ✅ setSessions도 커스텀 구현 (Connect + Auth에서 사용됨!)
    setSessions: async sessions => {
      try {
        const sessionsKey = 'siwx_multi_chain_sessions'

        if (sessions.length === 0) {
          localStorage.removeItem(sessionsKey)
          console.log('🗑️ 모든 세션 제거됨')
          return
        }

        // 기존 세션 로드
        const existingSessionsStr = localStorage.getItem(sessionsKey)
        let allSessions: any[] = existingSessionsStr ? JSON.parse(existingSessionsStr) : []

        // 새 세션들을 추가/갱신
        sessions.forEach(newSession => {
          // 동일한 chainId + address 조합의 기존 세션 제거
          allSessions = allSessions.filter(
            s =>
              !(
                s.data.chainId === newSession.data.chainId &&
                s.data.accountAddress.toLowerCase() === newSession.data.accountAddress.toLowerCase()
              )
          )
          // 새 세션 추가
          allSessions.push(newSession)
        })

        localStorage.setItem(sessionsKey, JSON.stringify(allSessions))
        console.log(
          `✅ 세션 저장됨 (총 ${allSessions.length}개):`,
          allSessions.map(s => `${s.data.chainId}:${s.data.accountAddress.slice(0, 6)}...`)
        )
      } catch (error) {
        console.error('Failed to set sessions:', error)
        throw error
      }
    }

    // 세션 만료 시간 커스터마이징 (선택사항)
    // expirationTime: (issuedAt) =>
    //   new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일
  })
})

// TypeScript용 전역 Caver 타입 선언
declare global {
  interface Window {
    Caver: any
  }
}

export function ActionButtonList() {
  const appKit = useAppKit()
  const account = useAppKitAccount()
  const network = useAppKitNetwork()
  const { disconnect } = useDisconnect()
  const { switchNetwork } = useAppKitNetwork()
  const [contractArgs, setContractArgs] = useState<WriteContractArgs | null>(null)
  const { walletProvider } = useAppKitProvider<UniversalProvider>('eip155')
  const {
    connect,
    connectCrossExtensionWallet,
    authenticateCrossExtensionWallet,
    isInstalledCrossExtensionWallet
  } = useAppKitWallet()
  const reownAppKit = useReownAppKit()
  const reownAccount = useReownAccount() // 🆕 Reown AppKit 계정 (MetaMask QR)
  const reownNetwork = useReownNetwork() // 🆕 Reown AppKit 네트워크 (MetaMask QR)
  const { walletProvider: reownWalletProvider } =
    useReownAppKitProvider<UniversalProvider>('eip155') // 🆕 Reown provider (MetaMask QR)
  const { disconnect: reownDisconnect } = useReownDisconnect() // 🆕 Reown disconnect
  const { isOpen, title, content, type, showSuccess, showError, closeModal } = useResultModal()
  const [loadingStates, setLoadingStates] = useState({
    crossExtension: false,
    authenticateCrossExtension: false,
    metamaskExtension: false,
    authenticateWalletConnect: false
  })
  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const appKitState = useAppKitState()

  // 🆕 MetaMask Extension 상태 관리 (Context 사용)
  const {
    metamaskProvider,
    metamaskAccount,
    metamaskChainId,
    setMetamaskProvider,
    setMetamaskAccount,
    setMetamaskChainId
  } = useWalletContext()

  // 🆕 활성 지갑 감지 함수 (vanilla example 패턴)
  const getActiveWallet = useCallback(() => {
    // 1. MetaMask Extension으로 연결된 경우
    if (metamaskProvider && metamaskAccount) {
      return {
        type: 'metamask_extension' as const,
        provider: metamaskProvider,
        account: metamaskAccount,
        chainId: metamaskChainId
      }
    }

    // 2. MetaMask QR Code (Reown AppKit)로 연결된 경우
    if (reownAccount?.isConnected && reownAccount?.address && reownWalletProvider) {
      return {
        type: 'metamask_qr' as const,
        provider: reownWalletProvider,
        account: reownAccount.address,
        chainId: reownNetwork?.chainId
      }
    }

    // 3. CROSSx Wallet (Extension 또는 QR)로 연결된 경우
    if (account?.isConnected && walletProvider) {
      return {
        type: 'cross' as const,
        provider: walletProvider,
        account: account.address,
        chainId: network.chainId
      }
    }

    return null
  }, [
    metamaskProvider,
    metamaskAccount,
    metamaskChainId,
    reownAccount,
    reownNetwork,
    reownWalletProvider,
    account,
    walletProvider,
    network
  ])

  // ✅ 연결 상태 변화 감지 (CROSSx Wallet QR code 연결)
  useEffect(() => {
    if (account?.isConnected && account.address) {
      const activeWallet = getActiveWallet()
      if (activeWallet?.type === 'cross') {
        // CROSSx Wallet QR code 연결 성공 시 플래그 저장
        localStorage.setItem('wallet_connected', 'true')
        localStorage.setItem('wallet_type', 'cross')
      }
    }
  }, [account?.isConnected, account?.address, getActiveWallet])

  // 🆕 Error analysis utility function
  const analyzeAndShowError = useCallback(
    (error: unknown, operationType: 'sign' | 'transaction') => {
      console.error(`Error in ${operationType}:`, error)

      // Extract error message properly
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        // Try to extract message from error object
        const errorObj = error as any
        errorMessage = errorObj.message || errorObj.reason || JSON.stringify(error, null, 2)
      } else {
        errorMessage = String(error)
      }

      const isUserRejection =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('User cancelled') ||
        errorMessage.includes('rejected methods') ||
        errorMessage.includes('Sign message failed') ||
        errorMessage.includes('rejected') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('denied')

      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('expired')

      const operationName = operationType === 'sign' ? 'Signature' : 'Transaction'

      if (isUserRejection) {
        showError(
          `${operationName} Cancelled`,
          `User cancelled the ${operationName.toLowerCase()}.`
        )
      } else if (isTimeout) {
        showError(
          `${operationName} Timeout`,
          `The ${operationName.toLowerCase()} request timed out. Please try again.`
        )
      } else {
        showError(
          `${operationName} Failed`,
          `An error occurred during ${operationName.toLowerCase()}:\n\n${errorMessage}`
        )
      }
    },
    [showError]
  )

  // erc20 token contract address
  const ERC20_ADDRESS = contractData[network.chainId as keyof typeof contractData]
    .erc20 as `0x${string}`
  // define decimals of erc20 token (ERC20 standard is 18)
  const ERC20_DECIMALS = 18
  // erc20 token contract address in caip format - eip155:{chainId}:{address}
  const ERC20_CAIP_ADDRESS = `${network.caipNetworkId}:${ERC20_ADDRESS}`
  // erc721 token contract address
  const ERC721_ADDRESS = contractData[network.chainId as keyof typeof contractData]
    .erc721 as `0x${string}`
  // address to send erc20 token or cross
  const RECEIVER_ADDRESS = '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379'
  // address of wallet owner
  const FROM_ADDRESS = AccountController.state.address as `0x${string}`
  // amount of erc20 token in eth to send
  const SEND_ERC20_AMOUNT = 1
  // amount of erc20 token in wei to send
  const SEND_ERC20_AMOUNT_IN_WEI = ConnectionController.parseUnits(
    SEND_ERC20_AMOUNT.toString(),
    ERC20_DECIMALS
  )
  // amount of cross to send
  const SEND_CROSS_AMOUNT = network.chainId === 1 || network.chainId === 11155111 ? 0.0001 : 1

  useEffect(() => {
    // contractArgs change tracking
  }, [contractArgs?.args])

  // 모달이 닫힐 때 WalletConnect 인증 로딩 상태 리셋
  useEffect(() => {
    if (!appKitState.open && loadingStates.authenticateWalletConnect) {
      setLoadingStates(prev => ({ ...prev, authenticateWalletConnect: false }))
    }
  }, [appKitState.open, loadingStates.authenticateWalletConnect])

  // Cross Extension Wallet 설치 상태 확인 함수를 메모이제이션
  const checkExtensionInstalled = useCallback(() => {
    try {
      const installed = isInstalledCrossExtensionWallet()
      setIsCrossExtensionInstalled(installed)
    } catch (error) {
      console.error('Extension 설치 상태 확인 중 오류:', error)
      setIsCrossExtensionInstalled(false)
    }
  }, [isInstalledCrossExtensionWallet])

  // Cross Extension Wallet 설치 상태 확인
  useEffect(() => {
    // 초기 확인
    checkExtensionInstalled()

    // 3초마다 확인 (익스텐션이 설치/제거될 수 있음)
    const interval = setInterval(checkExtensionInstalled, 3000)

    return () => clearInterval(interval)
  }, [checkExtensionInstalled])

  // MetaMask QR Code (Reown AppKit) 자동 재연결 확인
  useEffect(() => {
    // Reown AppKit이 세션을 자동으로 복원했는지 확인
    if (reownAccount?.isConnected && reownAccount?.address) {
      const connectionType = localStorage.getItem('metamask_connection_type')
      if (!connectionType) {
        // 세션은 복원되었지만 타입이 저장되지 않았으면 qrcode로 설정
        localStorage.setItem('metamask_connection_type', 'qrcode')
      }
    }
  }, [reownAccount?.isConnected, reownAccount?.address])

  // MetaMask Extension 자동 재연결 (페이지 로드 시)
  // MetaMask Extension 스마트 자동 재연결 (명시적으로 disconnect한 경우만 재연결 안함)
  useEffect(() => {
    const autoReconnectMetaMask = async () => {
      try {
        // localStorage에서 이전 연결 타입 확인
        const connectionType = localStorage.getItem('metamask_connection_type')

        // QR Code로 연결된 경우 Extension 자동 재연결 건너뛰기
        if (connectionType === 'qrcode') {
          return
        }

        // localStorage에 'extension'이 없으면 사용자가 명시적으로 disconnect했거나 처음 방문
        if (connectionType !== 'extension') {
          return
        }

        // MetaMask가 설치되어 있는지 확인
        if (typeof window.ethereum === 'undefined') {
          localStorage.removeItem('metamask_connection_type')
          return
        }

        // MetaMask provider 찾기
        const findMetaMaskProvider = () => {
          const ethereum = window.ethereum as any
          if (ethereum.providers && Array.isArray(ethereum.providers)) {
            return ethereum.providers.find((p: any) => p.isMetaMask && !p.isCrossWallet)
          }
          if (ethereum.isMetaMask && !ethereum.isCrossWallet) {
            return ethereum
          }
          return null
        }

        const provider = findMetaMaskProvider()
        if (!provider) {
          localStorage.removeItem('metamask_connection_type')
          return
        }

        // eth_accounts는 이미 연결된 계정만 반환 (사용자 승인 불필요)
        // 이 메서드로 실제 MetaMask가 이 dApp과 여전히 연결되어 있는지 확인
        const accounts = await provider.request({ method: 'eth_accounts' })

        // 연결이 끊어진 경우 (사용자가 MetaMask에서 연결을 해제했을 수 있음)
        if (!accounts || accounts.length === 0) {
          localStorage.removeItem('metamask_connection_type')
          return
        }

        // 여기까지 도달하면: localStorage에 'extension' 기록 있고, 실제로 연결되어 있음
        // → 자동 재연결 진행

        // ✅ MetaMask 연결 상태 및 provider 저장
        setMetamaskProvider(provider)
        setMetamaskAccount(accounts[0])

        // ethers provider로 네트워크 정보 가져오기
        const { ethers } = await import('ethers')
        const ethersProvider = new ethers.BrowserProvider(provider)
        const networkInfo = await ethersProvider.getNetwork()
        const chainId = Number(networkInfo.chainId)
        setMetamaskChainId(chainId)

        // 이벤트 리스너 중복 방지
        provider.removeAllListeners?.('chainChanged')
        provider.removeAllListeners?.('accountsChanged')

        // 네트워크 변경 이벤트 리스너
        provider.on('chainChanged', (newChainId: string) => {
          const newChainIdNumber = parseInt(newChainId, 16)
          setMetamaskChainId(newChainIdNumber)
        })

        // 계정 변경 이벤트 리스너
        provider.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            // 연결 해제됨 (사용자가 MetaMask에서 연결 해제)
            setMetamaskProvider(null)
            setMetamaskAccount(null)
            setMetamaskChainId(null)
            localStorage.removeItem('metamask_connection_type')
          } else {
            // 계정 변경됨
            setMetamaskAccount(newAccounts[0] || null)
          }
        })

        // Extension 연결 타입 유지 (이미 localStorage에 있지만 명시적으로 재설정)
        localStorage.setItem('metamask_connection_type', 'extension')
      } catch (error) {
        // 자동 재연결 실패는 무시 (사용자가 수동으로 연결할 수 있음)
      }
    }

    autoReconnectMetaMask()
  }, []) // 페이지 로드 시 한 번만 실행

  // 세션 관리 로직 (SDK에서 이벤트 리스너 제거 후 DApp에서 직접 관리)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // 탭 활성화 시: 엔진에 cleanup 포함 강제 점검을 요청
        await checkWalletConnectionStatus(true)
      }
    }

    const handlePageFocus = async () => {
      if (!isOpen) {
        await checkWalletConnectionStatus(true)
      }
    }

    const handlePageBlur = () => {}

    // 지갑 연결 상태를 확인하는 도우미 함수입니다.
    // shouldCleanup=true 이면 엔진 내부에서 세션 정리 후 상태를 확인합니다.
    const checkWalletConnectionStatus = async (shouldCleanup: boolean): Promise<boolean> => {
      try {
        // UniversalProvider를 통한 세션 확인
        if (walletProvider?.client?.engine) {
          // Engine의 간단한 세션 활성 상태 확인 함수 사용
          let isSessionActive = false
          try {
            const universalProvider = await getUniversalProvider()
            const currentTopic = universalProvider?.session?.topic

            // Engine의 validateSessionAndGetStatus 함수로 단순화
            isSessionActive = await (
              walletProvider.client.engine as any
            ).validateSessionAndGetStatus(currentTopic, shouldCleanup)
          } catch (error) {
            console.error('Error checking session active status:', error)
            // 에러 발생 시 비활성 상태로 처리
            isSessionActive = false
          }

          // 확장 프로그램(EIP1193Provider) 연결의 경우 Universal Provider 세션이 없을 수 있으므로
          // 계정이 연결되어 있으면 활성로 간주
          const isExtensionProvider = walletProvider?.constructor?.name === 'EIP1193Provider'
          if (!isSessionActive && isExtensionProvider && account?.isConnected) {
            isSessionActive = true
          }

          return isSessionActive
        }
        return false
      } catch (error) {
        return false
      }
    }

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handlePageFocus)
    window.addEventListener('blur', handlePageBlur)

    // AppKit에서 전달된 세션 끊김 이벤트 구독
    const handleSessionDisconnected = (event: CustomEvent) => {
      // 세션 해제 처리
    }

    window.addEventListener(
      'appkit_session_disconnected',
      handleSessionDisconnected as EventListener
    )

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handlePageFocus)
      window.removeEventListener('blur', handlePageBlur)
      window.removeEventListener(
        'appkit_session_disconnected',
        handleSessionDisconnected as EventListener
      )
    }
  }, [isOpen])

  // 수동으로 세션 상태 확인하는 함수 (읽기 전용)
  const getSessionStatus = async () => {
    if (!walletProvider?.client?.engine) {
      showError('Engine not available', 'Engine is not initialized')
      return
    }

    try {
      // Engine의 getSessionStatus 메서드 호출
      const result = await (walletProvider.client.engine as any).getSessionStatus()

      if (result.error) {
        showError('Session Check Failed', `Error: ${result.error}`)
        return
      }

      if (result.total === 0) {
        // 세션이 없다고 나와도 실제로는 있을 수 있으므로 더 자세한 확인

        // 직접 세션 확인
        const directSessions =
          (walletProvider.client.engine as any).client?.session?.getAll?.() || []
        if (directSessions.length > 0) {
          showSuccess(
            'Sessions Found (Direct Check)',
            `Found ${directSessions.length} sessions via direct check. Engine getSessionStatus may have an issue.`
          )
        } else {
          showSuccess('No Active Sessions', 'There are no active sessions to check')
        }
        return
      }

      // 결과 메시지 생성
      const sessionDetails = result.sessions
        .map((session: any) => {
          const statusIcon = session.status === 'healthy' ? '✅' : '❌'
          const topicShort = session.topic.substring(0, 8) + '...'
          const errorInfo = session.error ? ` (${session.error})` : ''
          return `${statusIcon} ${topicShort} - ${session.status}${errorInfo}`
        })
        .join('\n')

      const resultMessage =
        `Session Status Check Complete:\n\n` +
        `Total Sessions: ${result.total}\n` +
        `Healthy: ${result.healthy}\n` +
        `Disconnected: ${result.disconnected}\n\n` +
        `Details:\n${sessionDetails}`

      if (result.disconnected > 0) {
        showError('Session Check Results', resultMessage)
      } else {
        showSuccess('All Sessions Healthy', resultMessage)
      }
    } catch (error) {
      console.error('📱 [ACTION-BUTTON] Error checking session status:', error)
      showError('Session Check Failed', `Error: ${error}`)
    }
  }

  // 수동으로 세션 삭제 테스트하는 함수
  const testManualSessionDeletion = async () => {
    try {
      if (!walletProvider?.client?.engine) {
        showError('Engine not available', 'Universal Provider engine is not available')
        return
      }

      // 현재 세션 확인
      const sessions = walletProvider.client.session.getAll()

      if (sessions.length === 0) {
        showError('No Sessions', 'No active sessions found')
        return
      }

      // 첫 번째 세션 삭제
      const sessionToDelete = sessions[0]

      await (walletProvider.client.engine as any).deleteSession({
        topic: sessionToDelete?.topic,
        emitEvent: true
      })

      // 삭제 후 세션 확인
      const sessionsAfter = walletProvider.client.session.getAll()

      showSuccess(
        'Manual Session Deletion',
        `Deleted session: ${sessionToDelete?.topic.substring(0, 8)}...\nSessions before: ${sessions.length}, after: ${sessionsAfter.length}`
      )
    } catch (error) {
      console.error('📱 [ACTION-BUTTON] Error in manual session deletion:', error)
      showError('Manual Session Deletion Failed', `Error: ${error}`)
    }
  }

  // used for connecting wallet with wallet list
  async function handleConnect() {
    // 먼저 Reown AppKit과 MetaMask Extension 상태 클리어
    try {
      await reownDisconnect()
    } catch (e) {
      // 연결되지 않았을 수 있으므로 에러 무시
    }
    setMetamaskProvider(null)
    setMetamaskAccount(null)
    setMetamaskChainId(null)

    appKit.connect()
  }

  // used for connecting CROSS wallet directly
  async function handleConnectWallet() {
    // 먼저 Reown AppKit과 MetaMask Extension 상태 클리어
    try {
      await reownDisconnect()
    } catch (e) {
      // 연결되지 않았을 수 있으므로 에러 무시
    }
    setMetamaskProvider(null)
    setMetamaskAccount(null)
    setMetamaskChainId(null)

    connect('cross_wallet')
  }

  // Cross Extension 연결 + SIWE 인증을 한번에 수행 (이제 SDK가 처리!)
  async function handleAuthenticateCrossExtension() {
    try {
      setLoadingStates(prev => ({ ...prev, authenticateCrossExtension: true }))

      // 다른 연결 상태 클리어
      try {
        await reownDisconnect()
      } catch (e) {
        // 무시
      }
      setMetamaskProvider(null)
      setMetamaskAccount(null)
      setMetamaskChainId(null)

      // Cross Extension이 설치되어 있는지 확인
      if (!isInstalledCrossExtensionWallet()) {
        showError('Cross Extension 미설치', 'CROSSx Wallet Extension을 먼저 설치해주세요.')
        return
      }

      // 🎉 이제 SDK의 authenticateCrossExtensionWallet()가 모든 걸 처리합니다!
      // - Extension 연결
      // - SIWE 메시지 생성
      // - 사용자 서명
      // - 세션 저장
      const result = await authenticateCrossExtensionWallet()

      if (result && result.authenticated && result.sessions && result.sessions.length > 0) {
        const session = result.sessions[0]
        if (!session) {
          showError('인증 오류', '세션 정보를 가져올 수 없습니다.')
          return
        }

        const signature = session.signature
        const address = session.data.accountAddress
        const chainId = session.data.chainId
        const message = session.message
        const expiresAt = session.data.expirationTime

        // SIWE 메시지 요약 (첫 줄만)
        const messageSummary = message.split('\n')[0]

        // ✅ 연결 및 인증 상태 저장 (세션 포함)
        localStorage.setItem('wallet_connected', 'true')
        localStorage.setItem('wallet_type', 'cross')
        localStorage.setItem('has_siwx_session', 'true')

        showSuccess(
          '🎉 SIWE 인증 성공!',
          `Cross Extension이 연결되고 SIWE 인증이 완료되었습니다!\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📍 Address:\n${address}\n\n` +
            `🔗 Chain ID:\n${chainId}\n\n` +
            `📝 SIWE Message:\n${messageSummary}...\n\n` +
            `✍️ Signature:\n${signature.substring(0, 20)}...${signature.substring(signature.length - 20)}\n\n` +
            `⏰ Expires At:\n${expiresAt}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
      } else {
        // ✅ 일반 연결 시에도 상태 저장
        localStorage.setItem('wallet_connected', 'true')
        localStorage.setItem('wallet_type', 'cross')

        showSuccess('연결 성공', 'Cross Extension이 연결되었습니다.')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      showError(
        '인증 오류',
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      )
    } finally {
      setLoadingStates(prev => ({ ...prev, authenticateCrossExtension: false }))
    }
  }

  // WalletConnect (QR Code) 연결 + SIWE 인증을 한번에 수행
  async function handleAuthenticateWalletConnect() {
    try {
      setLoadingStates(prev => ({ ...prev, authenticateWalletConnect: true }))

      // 먼저 Reown AppKit과 MetaMask Extension 상태 클리어
      try {
        await reownDisconnect()
      } catch (e) {
        // 연결되지 않았을 수 있으므로 에러 무시
      }
      setMetamaskProvider(null)
      setMetamaskAccount(null)
      setMetamaskChainId(null)

      // 한번에 연결 + SIWE 인증 수행 (일반 연결 후 자동 SIWE)
      const result = await appKit.authenticateWalletConnect()

      if (result && typeof result === 'object' && 'authenticated' in result) {
        if (result.authenticated && result.sessions && result.sessions.length > 0) {
          const session = result.sessions[0]
          if (!session) {
            showError('인증 오류', '세션 정보를 가져올 수 없습니다.')
            return
          }

          const signature = session.signature
          const address = session.data.accountAddress
          const chainId = session.data.chainId
          const message = session.message
          const expiresAt = session.data.expirationTime

          // SIWE 메시지 요약 (첫 줄만)
          const messageSummary = message.split('\n')[0]

          // ✅ 연결 및 인증 상태 저장 (세션 포함)
          localStorage.setItem('wallet_connected', 'true')
          localStorage.setItem('wallet_type', 'cross')
          localStorage.setItem('has_siwx_session', 'true')

          // 서명 정보를 포함한 성공 메시지
          showSuccess(
            '🎉 SIWE 인증 성공!',
            `지갑이 연결되고 SIWE 인증이 완료되었습니다!\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n` +
              `📍 Address:\n${address}\n\n` +
              `🔗 Chain ID:\n${chainId}\n\n` +
              `📝 SIWE Message:\n${messageSummary}...\n\n` +
              `✍️ Signature:\n${signature.substring(0, 20)}...${signature.substring(signature.length - 20)}\n\n` +
              `⏰ Expires At:\n${expiresAt}\n` +
              `━━━━━━━━━━━━━━━━━━━━━━`
          )
        } else if (result.authenticated) {
          // authenticated는 true인데 sessions가 비어있는 경우
          showSuccess(
            '✅ 연결 및 인증 완료',
            '지갑이 연결되고 SIWE 인증이 완료되었습니다!\n세션 정보는 콘솔을 확인하세요.'
          )
        } else {
          showSuccess('연결 성공', '지갑이 연결되었습니다.')
        }
      } else if (result) {
        showSuccess('연결 성공', '지갑이 연결되고 인증이 완료되었습니다! 🎉')
      } else {
        showError(
          '인증 실패',
          'SIWE 인증이 설정되지 않았거나 지원하지 않는 체인입니다.\n일반 연결을 사용해주세요.'
        )
      }
    } catch (error) {
      console.error('Authentication error:', error)
      showError(
        '인증 오류',
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      )
    } finally {
      setLoadingStates(prev => ({ ...prev, authenticateWalletConnect: false }))
    }
  }

  // MetaMask QR Code 모달 직접 열기 (WalletConnect via Reown)
  // Extension 감지 없이 무조건 QR Code 모달만 표시
  async function handleConnectMetaMaskQRCode() {
    // MetaMask Extension 상태 클리어
    setMetamaskProvider(null)
    setMetamaskAccount(null)
    setMetamaskChainId(null)

    reownAppKit.open()
  }

  // MetaMask Extension 직접 연결
  async function handleConnectMetaMaskExtension() {
    try {
      setLoadingStates(prev => ({ ...prev, metamaskExtension: true }))

      // 먼저 Reown AppKit만 해제
      try {
        await reownDisconnect()
      } catch (e) {
        // 연결되지 않았을 수 있으므로 에러 무시
      }

      // MetaMask가 설치되어 있는지 확인
      if (typeof window.ethereum === 'undefined') {
        showError(
          'MetaMask 미설치',
          'MetaMask가 설치되어 있지 않습니다. MetaMask를 먼저 설치해주세요.'
        )
        return
      }

      // MetaMask provider 찾기 (여러 지갑이 설치된 경우 대비)
      const findMetaMaskProvider = () => {
        const ethereum = window.ethereum as any
        if (ethereum.providers && Array.isArray(ethereum.providers)) {
          return ethereum.providers.find((p: any) => p.isMetaMask && !p.isCrossWallet)
        }
        if (ethereum.isMetaMask && !ethereum.isCrossWallet) {
          return ethereum
        }
        return null
      }

      const provider = findMetaMaskProvider()

      if (!provider) {
        showError(
          'MetaMask 찾을 수 없음',
          'MetaMask Extension을 찾을 수 없습니다.\n\n' +
            '1. MetaMask Extension을 활성화해주세요\n' +
            '2. 다른 지갑 Extension을 비활성화하고 새로고침해주세요'
        )
        return
      }

      // MetaMask 연결 요청
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      })

      if (accounts && accounts.length > 0) {
        // ✅ MetaMask 연결 상태 및 provider 저장
        setMetamaskProvider(provider)
        setMetamaskAccount(accounts[0])

        // ethers provider로 네트워크 정보 가져오기
        const { ethers } = await import('ethers')
        const ethersProvider = new ethers.BrowserProvider(provider)
        const networkInfo = await ethersProvider.getNetwork()
        const chainId = Number(networkInfo.chainId)
        setMetamaskChainId(chainId)

        // ✅ 연결 상태 저장
        localStorage.setItem('wallet_connected', 'true')
        localStorage.setItem('wallet_type', 'metamask')
        // Extension 연결 타입 저장 (자동 재연결 시 QR Code와 구분하기 위해)
        localStorage.setItem('metamask_connection_type', 'extension')

        // 네트워크 변경 이벤트 리스너
        provider.on('chainChanged', (newChainId: string) => {
          const newChainIdNumber = parseInt(newChainId, 16)
          setMetamaskChainId(newChainIdNumber)
        })

        // 계정 변경 이벤트 리스너
        provider.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            // 연결 해제됨
            setMetamaskProvider(null)
            setMetamaskAccount(null)
            setMetamaskChainId(null)
            localStorage.removeItem('metamask_connection_type')
          } else {
            // 계정 변경됨
            setMetamaskAccount(newAccounts[0] || null)
          }
        })

        showSuccess(
          'MetaMask 연결 성공!',
          `Connected to: ${accounts[0]}\n\nMetaMask가 성공적으로 연결되었습니다.`
        )
      }
    } catch (error) {
      console.error('MetaMask 연결 실패:', error)

      const errorMessage = error instanceof Error ? error.message : String(error)
      const isUserRejection =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('rejected')

      if (isUserRejection) {
        showError('연결 취소됨', '사용자가 MetaMask 연결을 취소했습니다.')
      } else {
        showError('MetaMask 연결 실패', `오류: ${errorMessage}`)
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, metamaskExtension: false }))
    }
  }

  // Cross Extension Wallet 직접 연결
  const handleConnectCrossExtension = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, crossExtension: true }))

      // 먼저 Reown AppKit과 MetaMask Extension 상태 클리어
      try {
        await reownDisconnect()
      } catch (e) {
        // 연결되지 않았을 수 있으므로 에러 무시
      }
      setMetamaskProvider(null)
      setMetamaskAccount(null)
      setMetamaskChainId(null)

      // Extension 연결 실행 (에러 없이 완료되면 = 연결 성공)
      await connectCrossExtensionWallet()

      // 연결 성공 후 상태 즉시 업데이트
      checkExtensionInstalled()

      // ✅ 연결 상태 저장
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('wallet_type', 'cross')

      showSuccess(
        'Cross Extension Wallet 연결 성공!',
        'Cross Extension Wallet이 성공적으로 연결되었습니다.'
      )
    } catch (error) {
      console.error('Cross Extension Wallet 연결 실패:', error)

      // 에러 메시지 분석하여 사용자 취소 여부 확인
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isUserRejection =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('User cancelled') ||
        errorMessage.includes('Connection rejected') ||
        errorMessage.includes('Connection rejected by user') ||
        errorMessage.includes('Modal closed') ||
        errorMessage.includes('rejected') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('denied')

      const isTimeout = errorMessage.includes('Connection timeout')

      if (isUserRejection) {
        showError('연결 취소됨', '사용자가 지갑 연결을 취소했습니다.')
      } else if (isTimeout) {
        showError('연결 시간 초과', '지갑 연결 요청이 시간 초과되었습니다. 다시 시도해주세요.')
      } else if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
        showError(
          '익스텐션 미설치',
          'Cross Extension Wallet이 설치되지 않았습니다. 먼저 익스텐션을 설치해주세요.'
        )
      } else if (errorMessage.includes('customWallets에 설정되지 않았습니다')) {
        showError(
          '설정 오류',
          'CROSSx Wallet이 올바르게 설정되지 않았습니다. 개발자에게 문의해주세요.'
        )
      } else {
        showError('연결 실패', `지갑 연결 중 오류가 발생했습니다: ${errorMessage}`)
      }

      // 연결 실패 후에도 상태 확인
      checkExtensionInstalled()
    } finally {
      setLoadingStates(prev => ({ ...prev, crossExtension: false }))
    }
  }

  // Cross Extension Wallet 설치 상태 확인
  const handleCheckCrossExtension = () => {
    // 즉시 상태 업데이트 후 결과 표시
    checkExtensionInstalled()

    // 약간의 지연 후 최신 상태로 메시지 표시
    setTimeout(() => {
      if (isCrossExtensionInstalled) {
        showSuccess('Cross Extension Wallet 설치됨', 'Cross Extension Wallet이 설치되어 있습니다.')
      } else {
        showError(
          'Cross Extension Wallet 설치되지 않음',
          'Cross Extension Wallet을 먼저 설치해주세요.'
        )
      }
    }, 100)
  }

  // 토픽 정보를 로깅하는 함수
  const logTopicInfo = async () => {
    try {
      const universalProvider = await getUniversalProvider()
      if (universalProvider?.session) {
        // 성공 메시지 표시
        showSuccess(
          'Topic Information Retrieved!',
          `Session Topic: ${universalProvider.session.topic}\nPairing Topic: ${universalProvider.session.pairingTopic}\n\nCheck console for full details.`
        )
      } else {
        // Provider Constructor로 Extension 연결 여부 확인
        const isExtensionProvider = walletProvider?.constructor?.name === 'EIP1193Provider'
        const hasNoSession = !universalProvider?.session

        if (isExtensionProvider && hasNoSession && account?.isConnected) {
          showSuccess(
            'Extension Connection Detected',
            'Connected via browser extension - Universal Provider session not available.\n\nThis is normal behavior for extension connections.'
          )
        } else {
          showError('No Session Found', 'Please connect a wallet first to get topic information.')
        }
      }
    } catch (error) {
      console.error('❌ Error getting topic info:', error)
      showError(
        'Error Getting Topic Info',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  // 연결 상태 변화 감지 및 토픽 로깅
  useEffect(() => {
    if (account?.isConnected) {
      // 연결 후 약간의 지연을 두고 토픽 정보를 가져옴
      setTimeout(() => {
        logTopicInfo()
      }, 1000)
    }
  }, [account?.isConnected])

  async function handleDisconnect() {
    try {
      const activeWallet = getActiveWallet()

      if (activeWallet?.type === 'metamask_extension') {
        // MetaMask Extension 연결 해제
        setMetamaskProvider(null)
        setMetamaskAccount(null)
        setMetamaskChainId(null)

        try {
          await reownDisconnect()
        } catch (e) {
          // 이미 해제되었을 수 있음
        }

        showSuccess('연결 해제 성공', 'MetaMask Extension이 연결 해제되었습니다.')
      } else if (activeWallet?.type === 'metamask_qr') {
        // MetaMask QR Code 연결 해제
        await reownDisconnect()
        showSuccess('연결 해제 성공', 'MetaMask QR Code가 연결 해제되었습니다.')
      } else {
        // CROSSx Wallet 연결 해제
        await disconnect()
        showSuccess('연결 해제 성공', 'CROSSx Wallet이 연결 해제되었습니다.')
      }

      // 모든 상태 클리어
      setMetamaskProvider(null)
      setMetamaskAccount(null)
      setMetamaskChainId(null)

      // ✅ 연결 상태 제거 (자동 재연결 방지)
      localStorage.removeItem('wallet_connected')
      localStorage.removeItem('wallet_type')
      localStorage.removeItem('has_siwx_session')
      localStorage.removeItem('siwx_session')
      localStorage.removeItem('metamask_connection_type')
    } catch (error) {
      console.error('Error during disconnect:', error)
      showError('연결 해제 실패', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  async function handleSwitchNetwork() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? crossMainnet : crossTestnet

    try {
      await switchNetwork(targetNetwork)
      showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError('Switch Network Failed', error.message)
      }
    }
  }

  async function handleSwitchNetworkBsc() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? bscMainnet : bscTestnet

    try {
      await switchNetwork(targetNetwork)
      showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError('Switch Network Failed', error.message)
      }
    }
  }

  async function handleSwitchNetworkKaia() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? kaiaMainnet : kaiaTestnet

    try {
      await switchNetwork(targetNetwork)
      showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError('Switch Network Failed', error.message)
      }
    }
  }

  async function handleSwitchNetworkEther() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? etherMainnet : etherTestnet

    try {
      await switchNetwork(targetNetwork)
      showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError('Switch Network Failed', error.message)
      }
    }
  }
  // used for provider request
  async function handleProviderRequest() {
    if (!account?.isConnected) {
      showError('Error in handleProviderRequest', 'Please connect wallet first.')
      return
    }

    const res = await walletProvider?.request({
      method: 'eth_chainId',
      params: [account.address, 'latest']
    })
    showSuccess('Provider Request Successful!', `response by eth_chainId: ${JSON.stringify(res)}`)
  }

  // used for signing custom message
  async function handleSignMessage() {
    const activeWallet = getActiveWallet()

    if (!activeWallet) {
      showError('Error in handleSignMessage', 'Please connect wallet first.')
      return
    }

    // MetaMask Extension이나 MetaMask QR는 provider가 필요
    if (
      (activeWallet.type === 'metamask_extension' || activeWallet.type === 'metamask_qr') &&
      !activeWallet.provider
    ) {
      showError('Error in handleSignMessage', 'Provider is undefined')
      return
    }

    try {
      const message = `Hello, world! ${Date.now()}`

      if (activeWallet.type === 'metamask_extension') {
        // MetaMask Extension 사용
        const signature = await activeWallet.provider.request({
          method: 'personal_sign',
          params: [message, activeWallet.account]
        })
        showSuccess(
          '🦊 MetaMask Extension 서명 성공!',
          `메시지: ${message}\n서명: ${signature.slice(0, 20)}...${signature.slice(-20)}`
        )
      } else if (activeWallet.type === 'metamask_qr') {
        // MetaMask QR Code: Reown provider 사용
        const provider = activeWallet.provider as UniversalProvider
        const signature = (await provider.request({
          method: 'personal_sign',
          params: [message, activeWallet.account]
        })) as string
        showSuccess(
          '🦊 MetaMask QR 서명 성공!',
          `메시지: ${message}\n서명: ${signature.slice(0, 20)}...${signature.slice(-20)}`
        )
      } else {
        // CROSSx Wallet: SDK 사용
        const signedMessage = await ConnectionController.signMessage({
          message,
          customData: {
            metadata: 'This is metadata for signed message'
          }
        })
        showSuccess('⚡ CROSSx Wallet 서명 성공!', `서명: ${signedMessage}`)
      }
    } catch (error) {
      analyzeAndShowError(error, 'sign')
    }
  }

  // NEW: Generic EIP-712 signing using universal signTypedDataV4 method
  async function handleSignTypedDataV4() {
    if (!account?.isConnected) {
      showError('Error in handleSignTypedDataV4', 'Please connect wallet first.')
      return
    }

    // Get current chain ID for the fallback data
    const currentChainId =
      typeof network?.chainId === 'string' ? parseInt(network.chainId, 10) : network?.chainId || 1

    // ERC20Mint typed data (real-world use case for token minting with permit)
    // NOTE: This is example data. In production:
    // - 'from' is implicit (the signer's address)
    // - 'nonce' should be fetched from the contract
    // - 'deadline' should be current timestamp + expiry time
    const fallbackTypedData = {
      domain: {
        name: '0cd3a59377299deb46d424c0dc5edfc8',
        version: '1',
        chainId: currentChainId,
        verifyingContract: '0x5ad400c3db22641f7f94a1bd36f88ac359b74dae'
      },
      message: {
        token: '0x979a94888aa35ab603ff3ef1a25f942a99a1e7a5',
        amount: '1000000000000000000', // 1 token (18 decimals)
        feeRecipient: '0x56b78f96f028e8302aa8b94dd69299e43d7c58a6',
        feeBPS: '1000', // 10% fee (1000 basis points)
        nonce: '12', // Example value - fetch from contract in production
        deadline: '1765196498' // Example timestamp - use Math.floor(Date.now() / 1000) + expiry in production
      },
      primaryType: 'ERC20Mint',
      types: {
        ERC20Mint: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'feeRecipient', type: 'address' },
          { name: 'feeBPS', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }
    } as unknown as SignTypedDataV4Args

    try {
      let paramsData: SignTypedDataV4Args
      let apiData: SignTypedDataApiResponse | null = null
      let usingFallback = false

      paramsData = fallbackTypedData
      usingFallback = true

      // Use the new universal signTypedDataV4 method
      const signature = await ConnectionController.signTypedDataV4(paramsData, {
        metadata: {
          apiResponse: apiData
            ? {
                hash: (apiData as SignTypedDataApiResponse).data.hash,
                uuid: (apiData as SignTypedDataApiResponse).data.uuid,
                recover: (apiData as SignTypedDataApiResponse).data.recover,
                code: (apiData as SignTypedDataApiResponse).code,
                message: (apiData as SignTypedDataApiResponse).message
              }
            : undefined,
          description: usingFallback
            ? 'ERC20Mint EIP-712 typed data signature (real-world use case)'
            : 'Universal EIP-712 typed data signature',
          timestamp: new Date().toISOString()
        }
      })

      if (!signature) {
        showError('Error in handleSignTypedDataV4', 'Signature is undefined')
        return
      }

      // Show detailed results
      const resultMessage = usingFallback
        ? `🔑 Signature: ${signature}
⚠️ Using Fallback Data (API unavailable)
🔗 Primary Type: ${paramsData.primaryType}
⛓️ Chain ID: ${paramsData.domain.chainId}
📋 Contract: ${paramsData.domain.verifyingContract}

Check console for full details.`
        : `🔑 Signature: ${signature}
📝 Hash: ${apiData!.data.hash}
🆔 UUID: ${apiData!.data.uuid}
🔗 Primary Type: ${paramsData.primaryType}
⛓️ Chain ID: ${paramsData.domain.chainId}
📋 Contract: ${paramsData.domain.verifyingContract}

Check console for full details.`

      showSuccess('Signature Successful!', resultMessage)
    } catch (error) {
      analyzeAndShowError(error, 'sign')
    }
  }

  // used for sending custom transaction
  async function handleSendTransaction() {
    if (!account?.isConnected) {
      showError('Error in handleSendTransaction', 'Please connect wallet first.')
      return
    }

    if (!contractArgs) {
      showError('Error in handleSendTransaction', 'no contract args set')
      return
    }

    const { fromAddress, contractAddress, args, method, abi, chainNamespace } = contractArgs

    try {
      const resTx = await ConnectionController.writeContract({
        fromAddress,
        contractAddress,
        args,
        method,
        abi,
        chainNamespace,
        customData: {
          metadata: {
            activity: 'You are about to send custom transaction to the contract.',
            currentFormat: 'This is a JSON formatted custom data.',
            providedFormat:
              'Plain text(string), HTML(string), JSON(key value object) are supported.',
            txTime: new Date().toISOString(),
            randomValue: uuidv4()
          }
        },
        type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
      })

      showSuccess('Transaction Successful!', `resTx: ${JSON.stringify(resTx)}`)

      // generate new tokenId for next NFT
      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()
      const newArgs = [FROM_ADDRESS as `0x${string}`, tokenId]

      setContractArgs({ ...contractArgs, args: newArgs })
    } catch (error) {
      analyzeAndShowError(error, 'transaction')
    }
  }

  // used for sending CROSS
  async function handleSendNative() {
    const activeWallet = getActiveWallet()

    if (!activeWallet) {
      showError('Error in handleSendNative', 'Please connect wallet first.')
      return
    }

    try {
      if (activeWallet.type === 'metamask_extension') {
        // MetaMask Extension: window.ethereum 사용
        const { ethers } = await import('ethers')
        const amount =
          network.chainId === 1 || network.chainId === 11155111 ? 0.0001 : SEND_CROSS_AMOUNT
        const valueInWei = ethers.parseEther(amount.toString())

        const txHash = await activeWallet.provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: activeWallet.account,
              to: RECEIVER_ADDRESS,
              value: `0x${valueInWei.toString(16)}`,
              data: '0x'
            }
          ]
        })
        showSuccess('🦊 MetaMask Extension 전송 성공!', `트랜잭션 해시: ${txHash}`)
      } else {
        // CROSSx Wallet 또는 MetaMask QR: SDK 사용
        const resTx = await SendController.sendNativeToken({
          data: '0x',
          receiverAddress: RECEIVER_ADDRESS,
          sendTokenAmount:
            network.chainId === 1 || network.chainId === 11155111 ? 0.0001 : SEND_CROSS_AMOUNT,
          decimals: '18',
          customData: {
            metadata:
              'You are about to send 1 CROSS to the receiver address. This is plain text formatted custom data.'
          },
          type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
        })
        showSuccess('⚡ 전송 성공!', `resTx: ${JSON.stringify(resTx)}`)
      }
    } catch (error) {
      analyzeAndShowError(error, 'transaction')
    }
  }

  // used for sending any of game tokens
  async function handleSendERC20Token() {
    const activeWallet = getActiveWallet()

    if (!activeWallet) {
      showError('Error in handleSendERC20Token', 'Please connect wallet first.')
      return
    }

    try {
      if (activeWallet.type === 'metamask_extension') {
        // MetaMask Extension: ethers.js 사용
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(activeWallet.provider)
        const signer = await provider.getSigner()

        // ERC20 컨트랙트 인터페이스
        const erc20Contract = new ethers.Contract(ERC20_ADDRESS, sampleErc20ABI, signer)

        // 토큰 양을 wei로 변환
        const amountInWei = ethers.parseUnits(SEND_ERC20_AMOUNT.toString(), 18)

        // transfer 함수 호출
        if (!erc20Contract['transfer']) {
          throw new Error('ERC20 contract transfer function not found')
        }
        const tx = await erc20Contract['transfer'](RECEIVER_ADDRESS, amountInWei)
        const receipt = await tx.wait()

        showSuccess(
          '🦊 MetaMask ERC20 전송 성공!',
          `Tx Hash: ${receipt.hash}\nAmount: ${SEND_ERC20_AMOUNT} tokens`
        )
        getBalanceOfERC20({ showResult: false })
      } else if (activeWallet.type === 'metamask_qr') {
        // MetaMask QR Code: Reown provider 사용
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(activeWallet.provider as any)
        const signer = await provider.getSigner()

        const erc20Contract = new ethers.Contract(ERC20_ADDRESS, sampleErc20ABI, signer)
        const amountInWei = ethers.parseUnits(SEND_ERC20_AMOUNT.toString(), 18)
        if (!erc20Contract['transfer']) {
          throw new Error('ERC20 contract transfer function not found')
        }
        const tx = await erc20Contract['transfer'](RECEIVER_ADDRESS, amountInWei)
        const receipt = await tx.wait()

        showSuccess(
          '🦊 MetaMask QR ERC20 전송 성공!',
          `Tx Hash: ${receipt.hash}\nAmount: ${SEND_ERC20_AMOUNT} tokens`
        )
        getBalanceOfERC20({ showResult: false })
      } else {
        // Cross SDK
        const resTx = await SendController.sendERC20Token({
          receiverAddress: RECEIVER_ADDRESS,
          contractAddress: ERC20_CAIP_ADDRESS,
          sendTokenAmount: SEND_ERC20_AMOUNT,
          decimals: '18',
          customData: {
            metadata: `<DOCTYPE html><html><head><title>Game Developer can add custom data to the transaction</title></head><body><h1>Game Developer can add custom data to the transaction</h1><p>This is a HTML text formatted custom data.</p></body></html>`
          },
          type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
        })
        showSuccess('⚡ CROSSx Wallet ERC20 전송 성공!', `resTx: ${JSON.stringify(resTx)}`)
        getBalanceOfERC20({ showResult: false })
      }
    } catch (error) {
      analyzeAndShowError(error, 'transaction')
    }
  }

  // used for sending custom transaction (Cross SDK only)
  async function handleSendTransactionWithDynamicFee() {
    if (!account?.isConnected) {
      showError(
        'Error in handleSendTransactionWithDynamicFee',
        'This feature is only available with CROSSx Wallet.'
      )
      return
    }

    if (!contractArgs) {
      showError('Error in handleSendTransactionWithDynamicFee', 'no contract args set')
      return
    }

    const { fromAddress, contractAddress, args, method, abi, chainNamespace } = contractArgs

    try {
      const resTx = await ConnectionController.writeContract({
        fromAddress,
        contractAddress,
        args,
        method,
        abi,
        chainNamespace,
        customData: {
          metadata: {
            activity: 'You are about to send custom transaction to the contract.',
            currentFormat: 'This is a JSON formatted custom data.',
            providedFormat:
              'Plain text(string), HTML(string), JSON(key value object) are supported.',
            txTime: new Date().toISOString(),
            randomValue: uuidv4()
          }
        },
        type: ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
      })

      showSuccess('Transaction Successful!', `resTx: ${JSON.stringify(resTx)}`)

      // generate new tokenId for next NFT
      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()
      const newArgs = [FROM_ADDRESS as `0x${string}`, tokenId]

      setContractArgs({ ...contractArgs, args: newArgs })
    } catch (error) {
      analyzeAndShowError(error, 'transaction')
    }
  }

  // used for sending CROSS (Cross SDK only)
  async function handleSendNativeWithDynamicFee() {
    if (!account?.isConnected) {
      showError(
        'Error in handleSendNativeWithDynamicFee',
        'This feature is only available with CROSSx Wallet.'
      )
      return
    }

    try {
      const resTx = await SendController.sendNativeToken({
        data: '0x',
        receiverAddress: RECEIVER_ADDRESS,
        sendTokenAmount: SEND_CROSS_AMOUNT, // in eth (not wei)
        decimals: '18',
        customData: {
          metadata:
            'You are about to send 1 CROSS to the receiver address. This is plain text formatted custom data.'
        },
        type: ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
      })
      showSuccess('Send Native Successful!', `resTx: ${JSON.stringify(resTx)}`)
    } catch (error) {
      analyzeAndShowError(error, 'transaction')
    }
  }

  // used for sending any of game tokens
  // Cross SDK only
  async function handleSendERC20TokenWithDynamicFee() {
    if (!account?.isConnected) {
      showError(
        'Error in handleSendERC20TokenWithDynamicFee',
        'This feature is only available with CROSSx Wallet.'
      )
      return
    }

    try {
      const resTx = await SendController.sendERC20Token({
        receiverAddress: RECEIVER_ADDRESS,
        contractAddress: ERC20_CAIP_ADDRESS,
        sendTokenAmount: SEND_ERC20_AMOUNT, // in eth (not wei)
        decimals: '18',
        gas: BigInt(147726), // optional (you can set this your calculated gas or skip it )
        maxFee: BigInt(3200000000), // optional (you can set this your calculated maxFee or skip it)
        maxPriorityFee: BigInt(2000000000), // optional (you can set this your calculated maxPriorityFee or skip it)
        customData: {
          metadata: `<DOCTYPE html><html><head><title>Game Developer can add custom data to the transaction</title></head><body><h1>Game Developer can add custom data to the transaction</h1><p>This is a HTML text formatted custom data.</p></body></html>`
        },
        type: ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
      })
      showSuccess('Send ERC20 Token Successful!', `resTx: ${JSON.stringify(resTx)}`)
      getBalanceOfERC20({ showResult: false })
    } catch (error) {
      analyzeAndShowError(error, 'transaction')
    }
  }

  async function getBalanceOfNative() {
    const activeWallet = getActiveWallet()

    if (!activeWallet) {
      showError('Error in getBalanceOfNative', 'Please connect wallet first.')
      return
    }

    try {
      if (activeWallet.type === 'metamask_extension' || activeWallet.type === 'metamask_qr') {
        // MetaMask: ethers.js 사용
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(activeWallet.provider as any)
        const balance = await provider.getBalance(activeWallet.account)
        const balanceInEth = ethers.formatEther(balance)

        showSuccess(
          '🦊 MetaMask Native 잔액 조회 성공!',
          `Balance: ${balanceInEth} ${network.chainId === 1 || network.chainId === 11155111 ? 'ETH' : contractData[network.chainId as keyof typeof contractData]?.coin || 'Native'}`
        )
      } else {
        // Cross SDK
        const balance = account?.balance
        showSuccess('⚡ CROSSx Wallet Native 잔액 조회 성공!', `Balance: ${balance}`)
      }
    } catch (error) {
      console.error('Error in getBalanceOfNative:', error)
      showError('잔액 조회 실패', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  async function getBalanceOfERC20({ showResult = true }: { showResult?: boolean } = {}) {
    const activeWallet = getActiveWallet()

    if (!activeWallet) {
      showError('Error in getBalanceOfERC20', 'Please connect wallet first.')
      return
    }

    const address = contractData[network.chainId as keyof typeof contractData]?.erc20

    if (!address || address === '') {
      showError('Error in getBalanceOfERC20', 'Contract does not exist.')
      return
    }

    try {
      if (activeWallet.type === 'metamask_extension' || activeWallet.type === 'metamask_qr') {
        // MetaMask: ethers.js 사용
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(activeWallet.provider as any)
        const erc20Contract = new ethers.Contract(ERC20_ADDRESS, sampleErc20ABI, provider)

        if (!erc20Contract['balanceOf']) {
          throw new Error('ERC20 contract balanceOf function not found')
        }
        const balance = await erc20Contract['balanceOf'](activeWallet.account)
        const balanceFormatted = ethers.formatUnits(balance, 18)

        if (showResult) {
          showSuccess(
            '🦊 MetaMask ERC20 잔액 조회 성공!',
            `Balance: ${balanceFormatted} tokens\nContract: ${ERC20_ADDRESS}`
          )
        }
      } else {
        // Cross SDK
        const amount = (await ConnectionController.readContract({
          contractAddress: ERC20_ADDRESS,
          method: 'balanceOf',
          abi: sampleErc20ABI,
          args: [FROM_ADDRESS as `0x${string}`]
        })) as string

        const balance = account?.tokenBalance?.map(token => {
          if (token.address === ERC20_ADDRESS.toLowerCase()) {
            return {
              ...token,
              quantity: {
                ...token.quantity,
                numeric: amount
              }
            }
          }
          return token
        })

        if (!balance) {
          return
        }
        await AccountController.updateTokenBalance(balance)
        if (showResult)
          showSuccess(
            '⚡ CROSSx Wallet ERC20 잔액 조회 성공!',
            `updated erc20 balance: ${JSON.stringify(
              account?.tokenBalance?.find(token => token.address === ERC20_ADDRESS.toLowerCase()),
              (key, value) => (typeof value === 'bigint' ? value.toString() : value),
              2
            )}`
          )
      }
    } catch (error) {
      console.error('Error in getBalanceOfERC20:', error)
      showError('ERC20 잔액 조회 실패', error instanceof Error ? error.message : '알 수 없는 오류')
    }
  }

  async function getBalanceOfNFT() {
    const address = contractData[network.chainId as keyof typeof contractData].erc721

    if (address === '') {
      showError('Error in getBalanceOfNFT', 'Contract does not exist.')
      return
    }

    const amount = await ConnectionController.readContract({
      contractAddress: ERC721_ADDRESS,
      method: 'balanceOf',
      abi: sampleErc721ABI,
      args: [FROM_ADDRESS as `0x${string}`]
    })

    showSuccess('Get Balance of NFT Successful!', `erc721 balance: ${amount}`)
  }

  // Cross SDK Balance API only
  async function getBalanceFromWalletWithChainFilter() {
    if (!account?.isConnected) {
      showError(
        'Error in getBalanceFromWalletWithChainFilter',
        'This feature is only available with CROSSx Wallet.'
      )
      return
    }

    const chainFilter = [`0x${network?.chainId?.toString(16)}`] as `0x${string}`[]

    const tokens = await ConnectionController.walletGetAssets({
      account: FROM_ADDRESS,
      chainFilter
    })
    showSuccess(
      'Get Balance from Wallet with ChainFilter Successful!',
      `balance: ${JSON.stringify(tokens, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}`
    )
  }

  // Cross SDK Balance API only
  async function getBalanceFromWalletWithAssetFilter() {
    if (!account?.isConnected) {
      showError(
        'Error in getBalanceFromWalletWithAssetFilter',
        'This feature is only available with CROSSx Wallet.'
      )
      return
    }

    // 현재 체인 ID를 16진수 형태로 변환
    const chainIdHex = `0x${network?.chainId?.toString(16)}` as `0x${string}`

    // assetFilter 구성
    const assetFilter = {
      [chainIdHex as `0x${string}`]: [
        // 네이티브 토큰 (ETH, BNB 등)
        { address: 'native', type: 'native' },
        // MYTC 토큰 주소
        { address: '0x89b743f55fa4f300be1cd86cfb714979c16e4efe', type: 'erc20' },
        // tZENY 토큰 주소
        { address: '0xd4b74588311cab39925697d3f664517283f9ea19', type: 'erc20' }
      ]
    } as AssetFilterType

    try {
      // assetFilter를 사용하여 특정 토큰 잔액 요청
      const tokens = await ConnectionController.walletGetAssets({
        account: FROM_ADDRESS,
        assetFilter: assetFilter
      })

      // bigint를 문자열로 변환하여 JSON으로 출력
      showSuccess(
        'Get Specific Token Balance from Wallet Successful!',
        `Specific tokens balance: ${JSON.stringify(
          tokens,
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
    } catch (error) {
      console.error('Error fetching specific tokens balance:', error)
      showError(
        'Error in getBalanceFromWalletWithAssetFilter',
        `Error: ${(error as Error).message}`
      )
    }
  }

  // 여러 체인의 여러 토큰 잔액을 한번에 요청하는 함수
  // Cross SDK Balance API only
  async function getBalanceFromWalletOnMultipleChains() {
    if (!account?.isConnected) {
      showError(
        'Error in getBalanceFromWalletOnMultipleChains',
        'This feature is only available with CROSSx Wallet.'
      )
      return
    }

    // 여러 체인의 특정 토큰 조회 설정
    const assetFilter = {
      // stage
      '0x956cc': [
        { address: 'native', type: 'native' },
        // MYTC 토큰 주소
        { address: '0x89b743f55fa4f300be1cd86cfb714979c16e4efe', type: 'erc20' },
        // tZENY 토큰 주소
        { address: '0xd4b74588311cab39925697d3f664517283f9ea19', type: 'erc20' }
      ],
      // BSC test
      '0x61': [{ address: 'native', type: 'native' }]
    } as AssetFilterType

    try {
      // 여러 체인의 특정 토큰 잔액 요청
      const multiChainTokens = await ConnectionController.walletGetAssets({
        account: FROM_ADDRESS,
        assetFilter: assetFilter
      })

      showSuccess(
        'Get Multi Chain Balance from Wallet Successful!',
        `Multi-chain tokens balance: ${JSON.stringify(
          multiChainTokens,
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
    } catch (error) {
      console.error('Error fetching multi-chain tokens balance:', error)
      showError(
        'Error in getBalanceFromWalletOnMultipleChains',
        `Error: ${(error as Error).message}`
      )
    }
  }

  // 지정된 토큰 타입만 필터링하여 요청하는 함수
  // Cross SDK Balance API only
  async function getBalanceFromWalletByTokenType() {
    if (!account?.isConnected) {
      showError(
        'Error in getBalanceFromWalletByTokenType',
        'This feature is only available with CROSSx Wallet.'
      )
      return
    }

    const chainIdHex = `0x${network?.chainId?.toString(16)}` as `0x${string}`

    try {
      // assetTypeFilter와 chainFilter 조합으로 요청
      // (특정 체인의 특정 타입 토큰 전체 조회)
      const tokens = await ConnectionController.walletGetAssets({
        account: FROM_ADDRESS,
        chainFilter: [chainIdHex],
        assetTypeFilter: ['NATIVE', 'ERC20'] // ERC20 토큰과 네이티브 토큰만 조회
      })

      showSuccess(
        'Get Balance from Wallet by AssetFilterType Successful!',
        `ERC20 and native tokens: ${JSON.stringify(
          tokens,
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
    } catch (error) {
      console.error('Error fetching tokens by type:', error)
      showError('Error in getBalanceFromWalletByTokenType', `Error: ${(error as Error).message}`)
    }
  }

  useEffect(() => {
    ;(() => {
      if (contractArgs || !FROM_ADDRESS || !network?.caipNetwork?.chainNamespace) return

      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()

      const buildArgs: WriteContractArgs = {
        fromAddress: FROM_ADDRESS,
        contractAddress: ERC721_ADDRESS,
        args: [
          // arguments to pass to the specific method of contract
          FROM_ADDRESS as `0x${string}`, // address of token that will take the NFT
          tokenId // tokenId
        ],
        method: 'mintTo(address, uint256)', // method to call on the contract
        abi: sampleErc721ABI, // abi of the contract
        chainNamespace: network?.caipNetwork?.chainNamespace,
        type: ConstantsUtil.TRANSACTION_TYPE.LEGACY // default type is LEGACY
      }

      setContractArgs(buildArgs)
    })()
  }, [FROM_ADDRESS, network?.caipNetwork?.chainNamespace])

  useEffect(() => {
    if (!account?.isConnected) return

    const accessUniversalProvider = async () => {
      try {
        const activeWallet = getActiveWallet()

        // MetaMask Extension이나 MetaMask QR로 연결된 경우 건너뛰기
        if (activeWallet?.type === 'metamask_extension' || activeWallet?.type === 'metamask_qr') {
          return
        }

        const universalProvider = await getUniversalProvider()

        // UniversalProvider가 없거나 이미 연결된 경우
        if (!universalProvider) {
          return
        }

        if (universalProvider.session) {
          return
        }

        // UniversalProvider 연결 시도
        await universalProvider.connect({
          namespaces: {
            eip155: {
              methods: [
                'eth_sendTransaction',
                'eth_signTransaction',
                'eth_sign',
                'personal_sign',
                'eth_signTypedData'
              ],
              chains: ['eip155:1'],
              events: ['chainChanged', 'accountsChanged'],
              rpcMap: {}
            }
          }
        })

        await universalProvider?.request({
          method: 'eth_requestAccounts',
          params: []
        })
      } catch (error) {
        // Cross Extension으로 연결된 경우 이 에러는 무시
      }
    }

    accessUniversalProvider()
  }, [appKit, account?.isConnected])

  return (
    <div>
      <div className="action-button-list">
        {/* 연결되지 않은 경우에만 연결 버튼들 표시 */}
        {!getActiveWallet() && (
          <>
            <button
              onClick={handleConnectMetaMaskQRCode}
              style={{
                backgroundColor: '#F6851B',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Connect MetaMask (QR Code)
            </button>
            <button
              onClick={handleConnectMetaMaskExtension}
              disabled={loadingStates.metamaskExtension}
              style={{
                backgroundColor: '#F6851B',
                color: 'white',
                cursor: loadingStates.metamaskExtension ? 'not-allowed' : 'pointer',
                opacity: loadingStates.metamaskExtension ? 0.6 : 1
              }}
            >
              {loadingStates.metamaskExtension ? 'Connecting...' : 'Connect MetaMask Extension'}
            </button>
            <button onClick={handleConnect}>Connect CROSSx</button>
            <button onClick={handleConnectWallet}>Connect CROSSx (QR Code)</button>
            <button
              onClick={handleConnectCrossExtension}
              disabled={!isCrossExtensionInstalled || loadingStates.crossExtension}
              style={{
                backgroundColor: isCrossExtensionInstalled ? '#007bff' : '#6c757d',
                color: 'white',
                cursor:
                  isCrossExtensionInstalled && !loadingStates.crossExtension
                    ? 'pointer'
                    : 'not-allowed',
                opacity: isCrossExtensionInstalled && !loadingStates.crossExtension ? 1 : 0.6
              }}
            >
              {loadingStates.crossExtension ? 'Connecting...' : 'Connect Cross Extension'}
            </button>
            <button
              onClick={handleAuthenticateCrossExtension}
              disabled={!isCrossExtensionInstalled || loadingStates.authenticateCrossExtension}
              style={{
                backgroundColor: isCrossExtensionInstalled ? '#10b981' : '#6c757d',
                color: 'white',
                cursor:
                  isCrossExtensionInstalled && !loadingStates.authenticateCrossExtension
                    ? 'pointer'
                    : 'not-allowed',
                opacity:
                  isCrossExtensionInstalled && !loadingStates.authenticateCrossExtension ? 1 : 0.6,
                fontWeight: 'bold'
              }}
              title="Connect Cross Extension + SIWE authentication in one step"
            >
              {loadingStates.authenticateCrossExtension
                ? 'Authenticating...'
                : '🔐 Connect + Auth (Extension)'}
            </button>
            <button
              onClick={handleAuthenticateWalletConnect}
              disabled={loadingStates.authenticateWalletConnect}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                cursor: loadingStates.authenticateWalletConnect ? 'not-allowed' : 'pointer',
                opacity: loadingStates.authenticateWalletConnect ? 0.6 : 1,
                fontWeight: 'bold'
              }}
              title="Connect via WalletConnect (QR/Mobile) + SIWE authentication in one step"
            >
              {loadingStates.authenticateWalletConnect
                ? 'Authenticating...'
                : '🔐 Connect + Auth (QR Code)'}
            </button>
            <button onClick={handleCheckCrossExtension}>
              Check Cross Extension ({isCrossExtensionInstalled ? '✅' : '❌'})
            </button>
          </>
        )}

        {/* 연결된 경우에만 연결 해제 및 네트워크 변경 버튼들 표시 */}
        {getActiveWallet() && (
          <>
            <button
              onClick={handleDisconnect}
              style={{ backgroundColor: '#dc3545', color: 'white' }}
            >
              Disconnect
            </button>
            <button onClick={handleSwitchNetwork}>Switch to Cross</button>
            <button onClick={handleSwitchNetworkBsc}>Switch to BSC</button>
            <button onClick={handleSwitchNetworkKaia}>Switch to Kaia</button>
            <button onClick={handleSwitchNetworkEther}>Switch to Ether</button>
          </>
        )}
      </div>
      <div className="action-button-list" style={{ marginTop: '10px' }}>
        <button onClick={handleSendNative}>
          Send {SEND_CROSS_AMOUNT} {contractData[network.chainId as keyof typeof contractData].coin}
        </button>
        <button onClick={handleSendERC20Token}>Send 1 ERC20</button>
        <button onClick={handleSendTransaction}>Send Custom Transaction</button>
        <button onClick={handleSendNativeWithDynamicFee}>Send 1 CROSS with Dynamic Fee</button>
        <button onClick={handleSendERC20TokenWithDynamicFee}>Send 1 ERC20 with Dynamic Fee</button>
        <button onClick={handleSendTransactionWithDynamicFee}>
          Send Custom Transaction with Dynamic Fee
        </button>
      </div>
      <div className="action-button-list" style={{ marginTop: '10px' }}>
        <button onClick={handleSignMessage}>Sign Message</button>
        <button onClick={handleSignTypedDataV4}>Sign TypedData V4</button>
        <button onClick={handleProviderRequest}>Provider Request</button>
        <button onClick={logTopicInfo}>Get Topic Info</button>
        <button onClick={getSessionStatus} style={{ backgroundColor: '#28a745', color: 'white' }}>
          Get Session Status (Read Only)
        </button>
        <button
          onClick={testManualSessionDeletion}
          style={{ backgroundColor: '#dc3545', color: 'white' }}
        >
          Test Manual Session Deletion
        </button>
      </div>
      <div className="action-button-list" style={{ marginTop: '10px' }}>
        <button onClick={getBalanceOfNative}>Get Balance of CROSS</button>
        <button onClick={() => getBalanceOfERC20()}>Get Balance of ERC20</button>
        <button onClick={getBalanceOfNFT}>Get Balance of NFT</button>
        <button onClick={getBalanceFromWalletWithChainFilter}>
          Get Balance from Wallet with ChainFilter
        </button>
        <button onClick={getBalanceFromWalletWithAssetFilter}>
          Get Specific Token Balance from Wallet
        </button>
        <button onClick={getBalanceFromWalletOnMultipleChains}>
          Get Multi Chain Balance from Wallet
        </button>
        <button onClick={getBalanceFromWalletByTokenType}>
          Get Balance from Wallet by AssetFilterType
        </button>
      </div>
      <ResultModal
        isOpen={isOpen}
        onClose={closeModal}
        title={title}
        content={content}
        type={type}
      />
    </div>
  )
}

export default ActionButtonList
