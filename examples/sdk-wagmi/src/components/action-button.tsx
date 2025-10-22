import { useCallback, useEffect, useState } from 'react'

import {
  AccountController,
  ConnectionController,
  ConstantsUtil,
  SendController,
  UniversalProvider,
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  getUniversalProvider,
  initCrossSdk,
  kaiaMainnet,
  kaiaTestnet,
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitWallet,
  useDisconnect
} from '@to-nexus/sdk/react'
import type { AssetFilterType, SignTypedDataV4Args, WriteContractArgs } from '@to-nexus/sdk/react'
import { v4 as uuidv4 } from 'uuid'
import { parseEther, parseUnits } from 'viem'
import {
  useAccount,
  useBalance,
  useConnect,
  useEstimateGas,
  useReadContract,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
  useDisconnect as useWagmiDisconnect,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi'

import { sampleErc20ABI } from '../contracts/sample-erc20'
import { sampleErc721ABI } from '../contracts/sample-erc721'
import { useResultModal } from '../hooks/use-result-modal'
import { NetworkSelectorModal } from './network-selector-modal'
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

// Initialize SDK here
// initCrossSdkWithParams({
//   projectId,
//   redirectUrl,
//   metadata: {
//     name: 'Cross JS SDK Sample',
//     description: 'Cross SDK for React',
//     url: 'https://to.nexus',
//     icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
//   },
//   themeMode: 'light'
// })
const metadata = {
  name: 'Cross JS SDK Sample',
  description: 'Cross SDK for React',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

initCrossSdk(projectId, redirectUrl, metadata, 'dark')

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
  const { connect, connectCrossExtensionWallet, isInstalledCrossExtensionWallet } =
    useAppKitWallet()
  const { isOpen, title, content, type, showSuccess, showError, closeModal } = useResultModal()
  const [isLoading, setIsLoading] = useState(false)
  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const [isWagmiLoading, setIsWagmiLoading] = useState(false)
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)

  // Wagmi hooks
  const wagmiAccount = useAccount()
  const { data: wagmiBalance } = useBalance({
    address: wagmiAccount.address
  })
  const { signMessageAsync } = useSignMessage()
  const { signTypedDataAsync } = useSignTypedData()
  const { sendTransactionAsync, data: txHash } = useSendTransaction()
  const { data: txReceipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash
  })
  const { writeContractAsync } = useWriteContract()
  const { disconnectAsync: wagmiDisconnect } = useWagmiDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { connectors, connectAsync } = useConnect()

  // Cross Extension Wallet 설치 상태 확인 함수 (sdk-react와 동일)
  const checkWagmiCrossExtension = useCallback(() => {
    try {
      // ✅ window.crossWallet을 직접 확인 (SDK 함수 대신)
      const crossWallet = (window as any).crossWallet
      const hasCrossWallet = !!crossWallet

      // 또는 ethereum.providers에서 확인
      const ethereum = (window as any).ethereum
      const hasCrossInProviders = ethereum?.providers?.some(
        (p: any) => p.isCrossWallet || p.isCross || p.isCrossExtension
      )

      const installed = hasCrossWallet || hasCrossInProviders
      setIsCrossExtensionInstalled(installed)

      // 디버깅: Cross Extension 상태 출력
      if (installed) {
        console.log('✅ Cross Extension installed and detected')
        console.log('  - window.crossWallet:', !!crossWallet)
        console.log('  - in providers:', hasCrossInProviders)
      } else {
        console.log('❌ Cross Extension NOT detected')
        console.log('  - window.crossWallet:', !!crossWallet)
        console.log('  - ethereum.providers:', ethereum?.providers?.length || 0)
      }

      // SDK 함수도 확인
      try {
        const sdkDetected = isInstalledCrossExtensionWallet()
        console.log('  - SDK isInstalledCrossExtensionWallet():', sdkDetected)
      } catch (e) {
        console.log('  - SDK detection error:', e)
      }
    } catch (error) {
      console.error('Wagmi: Extension 설치 상태 확인 중 오류:', error)
      setIsCrossExtensionInstalled(false)
    }
  }, [isInstalledCrossExtensionWallet])

  // Cross Extension Wallet 설치 상태 확인
  useEffect(() => {
    checkWagmiCrossExtension()
    const interval = setInterval(checkWagmiCrossExtension, 3000)
    return () => clearInterval(interval)
  }, [checkWagmiCrossExtension])

  // 디버깅용: Cross Extension 감지 테스트 함수를 전역으로 노출
  useEffect(() => {
    ;(window as any).testCrossExtension = () => {
      console.log('=== Cross Extension Detection Test ===')
      console.log('1. window.ethereum:', (window as any).ethereum)
      console.log('2. window.ethereum.providers:', (window as any).ethereum?.providers)
      console.log(
        '3. Providers detail:',
        (window as any).ethereum?.providers?.map((p: any) => ({
          isCrossWallet: p.isCrossWallet,
          isCross: p.isCross,
          isMetaMask: p.isMetaMask,
          constructor: p.constructor?.name
        }))
      )
      console.log('4. window.crossExtension:', (window as any).crossExtension)
      console.log('5. window.cross:', (window as any).cross)
      console.log(
        '6. All window keys with "cross":',
        Object.keys(window).filter(k => k.toLowerCase().includes('cross'))
      )
      console.log('7. SDK detects Cross Extension:', isInstalledCrossExtensionWallet())
      console.log(
        '8. Available Wagmi connectors:',
        connectors.map(c => ({ id: c.id, name: c.name }))
      )
    }
    console.log(
      '💡 Tip: Run "window.testCrossExtension()" in console to test Cross Extension detection'
    )

    return () => {
      delete (window as any).testCrossExtension
    }
  }, [connectors, isInstalledCrossExtensionWallet])

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

  // 지원 네트워크 목록
  const supportedNetworks = [
    { chainId: 612044, name: 'Cross Testnet' },
    { chainId: 612055, name: 'Cross Mainnet' },
    { chainId: 1, name: 'Ethereum' },
    { chainId: 11155111, name: 'Sepolia' },
    { chainId: 56, name: 'BSC' },
    { chainId: 97, name: 'BSC Testnet' },
    { chainId: 8217, name: 'Kaia' },
    { chainId: 1001, name: 'Kaia Testnet' }
  ]

  // ERC20 토큰 잔액 읽기 (Wagmi)
  const { data: wagmiErc20Balance, refetch: refetchErc20Balance } = useReadContract({
    address: ERC20_ADDRESS,
    abi: sampleErc20ABI,
    functionName: 'balanceOf',
    args: wagmiAccount.address ? [wagmiAccount.address] : undefined,
    query: {
      enabled: !!wagmiAccount.address && !!ERC20_ADDRESS
    }
  })

  // ERC721 NFT 잔액 읽기 (Wagmi)
  const { data: wagmiNftBalance, refetch: refetchNftBalance } = useReadContract({
    address: ERC721_ADDRESS,
    abi: sampleErc721ABI,
    functionName: 'balanceOf',
    args: wagmiAccount.address ? [wagmiAccount.address] : undefined,
    query: {
      enabled: !!wagmiAccount.address && !!ERC721_ADDRESS && ERC721_ADDRESS !== '0x'
    }
  })

  useEffect(() => {
    // contractArgs change tracking
  }, [contractArgs?.args])

  // Cross Extension Wallet 설치 상태 확인 함수를 메모이제이션
  const checkExtensionInstalled = useCallback(() => {
    try {
      // ✅ window.crossWallet을 직접 확인
      const crossWallet = (window as any).crossWallet
      const ethereum = (window as any).ethereum
      const hasCrossInProviders = ethereum?.providers?.some(
        (p: any) => p.isCrossWallet || p.isCross || p.isCrossExtension
      )

      const installed = !!crossWallet || hasCrossInProviders
      setIsCrossExtensionInstalled(installed)
    } catch (error) {
      console.error('Extension 설치 상태 확인 중 오류:', error)
      setIsCrossExtensionInstalled(false)
    }
  }, [])

  // Cross Extension Wallet 설치 상태 확인
  useEffect(() => {
    // 초기 확인
    checkExtensionInstalled()

    // 3초마다 확인 (익스텐션이 설치/제거될 수 있음)
    const interval = setInterval(checkExtensionInstalled, 3000)

    return () => clearInterval(interval)
  }, [checkExtensionInstalled])

  // 세션 관리 로직 (SDK에서 이벤트 리스너 제거 후 DApp에서 직접 관리)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // 탭 활성화 시: 엔진에 cleanup 포함 강제 점검을 요청
        const isSessionActive = await checkWalletConnectionStatus(true)
        // 필요하다면 isSessionActive 결과에 따라 UI/스토어를 업데이트하세요.
        console.log('📱 [ACTION-BUTTON] isSessionActive:    ' + isSessionActive)
      }
    }

    const handlePageFocus = async () => {
      if (!isOpen) {
        const isSessionActive = await checkWalletConnectionStatus(true)
        // isSessionActive를 사용해 재연결 유도, 알림 노출 등 후속 처리 가능
        console.log('📱 [ACTION-BUTTON] isSessionActive:', isSessionActive)
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
      console.log('📱 [ACTION-BUTTON] AppKit session disconnected event received:', event.detail)
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
  function handleConnect() {
    appKit.connect()
  }

  // used for connecting CROSS wallet directly
  function handleConnectWallet() {
    connect('cross_wallet')
  }

  // Cross Extension Wallet 직접 연결
  const handleConnectCrossExtension = async () => {
    try {
      setIsLoading(true)

      // 연결 시작 전 현재 연결 상태 저장
      const wasConnectedBefore = account?.isConnected
      const addressBefore = account?.address

      console.log('🚀 Cross Extension Wallet 연결 시도 시작')
      console.log('연결 전 상태:', { wasConnectedBefore, addressBefore })

      const result = await connectCrossExtensionWallet()

      console.log('🎉 connectCrossExtensionWallet 완료:', result)

      // 연결 성공 후 실제로 새로운 연결이 이루어졌는지 확인
      // 짧은 지연 후 상태 재확인
      await new Promise(resolve => setTimeout(resolve, 500))

      const isNowConnected = account?.isConnected
      const addressAfter = account?.address

      console.log('연결 후 상태:', { isNowConnected, addressAfter })

      // 실제로 연결 상태가 변경되었는지 확인
      if (!isNowConnected || (wasConnectedBefore && addressBefore === addressAfter)) {
        throw new Error('Connection verification failed - no state change detected')
      }

      // 연결 성공 후 상태 즉시 업데이트
      checkExtensionInstalled()

      showSuccess(
        'Cross Extension Wallet 연결 성공!',
        'Cross Extension Wallet이 성공적으로 연결되었습니다.'
      )
      console.log('✅ Cross Extension Wallet 연결 성공')
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
          'Cross Wallet이 올바르게 설정되지 않았습니다. 개발자에게 문의해주세요.'
        )
      } else {
        showError('연결 실패', `지갑 연결 중 오류가 발생했습니다: ${errorMessage}`)
      }

      // 연결 실패 후에도 상태 확인
      checkExtensionInstalled()
    } finally {
      setIsLoading(false)
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
      await disconnect()
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  function handleSwitchNetwork() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? crossMainnet : crossTestnet
    switchNetwork(targetNetwork)
    showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
  }

  function handleSwitchNetworkBsc() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? bscMainnet : bscTestnet

    switchNetwork(targetNetwork)
    showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
  }

  function handleSwitchNetworkKaia() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? kaiaMainnet : kaiaTestnet
    switchNetwork(targetNetwork)
    showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
  }
  function handleSwitchNetworkEther() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? etherMainnet : etherTestnet
    switchNetwork(targetNetwork)
    showSuccess('Switch Network Successful!', `Current network: ${targetNetwork.caipNetworkId}`)
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
    if (!account?.isConnected) {
      showError('Error in handleSignMessage', 'Please connect wallet first.')
      return
    }

    const signedMessage = await ConnectionController.signMessage({
      message: `Hello, world! ${Date.now()}`,
      customData: {
        metadata: 'This is metadata for signed message'
      }
    })
    showSuccess('Sign Message Successful!', `signedMessage: ${signedMessage}`)
  }

  // NEW: Generic EIP-712 signing using universal signTypedDataV4 method
  async function handleSignTypedDataV4() {
    if (!account?.isConnected) {
      showError('Error in handleSignTypedDataV4', 'Please connect wallet first.')
      return
    }

    try {
      // Example: Get typed data from API (can be any source)
      const response = await fetch(
        'https://dev-cross-ramp-api.crosstoken.io/api/v1/erc20/message/user',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            account: FROM_ADDRESS, // Use actual connected wallet address
            amount: '1',
            direction: true,
            pair_id: 1,
            project_id: 'nexus-ramp-v1'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`)
      }

      const apiData: SignTypedDataApiResponse = await response.json()

      if (!apiData.data?.params) {
        throw new Error('Invalid API response: missing params data')
      }

      // Extract only the typedData (second element) from API response params
      const tupleParams = apiData.data.params as [string, SignTypedDataV4Args]
      const paramsData = tupleParams[1]

      // Use the new universal signTypedDataV4 method
      const signature = await ConnectionController.signTypedDataV4(paramsData, {
        metadata: {
          apiResponse: {
            hash: apiData.data.hash,
            uuid: apiData.data.uuid,
            recover: apiData.data.recover,
            code: apiData.code,
            message: apiData.message
          },
          description: 'Universal EIP-712 typed data signature',
          timestamp: new Date().toISOString()
        }
      })

      if (!signature) {
        showError('Error in handleSignTypedDataV4', 'Signature is undefined')
        return
      }

      // Show detailed results
      showSuccess(
        'Signature Successful!',
        `🔑 Signature: ${signature}
📝 Hash: ${apiData.data.hash}
🆔 UUID: ${apiData.data.uuid}
🔗 Primary Type: ${paramsData.primaryType}
⛓️ Chain ID: ${paramsData.domain.chainId}
📋 Contract: ${paramsData.domain.verifyingContract}

Check console for full details.`
      )
    } catch (error) {
      console.error('Error in handleSignTypedDataV4:', error)
      showError('Error in handleSignTypedDataV4', `❌ Error: ${(error as Error).message}`)
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
          providedFormat: 'Plain text(string), HTML(string), JSON(key value object) are supported.',
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
  }

  // used for sending CROSS
  async function handleSendNative() {
    if (!account?.isConnected) {
      showError('Error in handleSendNative', 'Please connect wallet first.')
      return
    }

    const resTx = await SendController.sendNativeToken({
      data: '0x',
      receiverAddress: RECEIVER_ADDRESS,
      sendTokenAmount:
        network.chainId === 1 || network.chainId === 11155111 ? 0.0001 : SEND_CROSS_AMOUNT, // in eth (not wei)
      decimals: '18',
      customData: {
        metadata:
          'You are about to send 1 CROSS to the receiver address. This is plain text formatted custom data.'
      },
      type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
    })
    showSuccess('Send Native Successful!', `resTx: ${JSON.stringify(resTx)}`)
  }

  // used for sending any of game tokens
  async function handleSendERC20Token() {
    if (!account?.isConnected) {
      showError('Error in handleSendERC20Token', 'Please connect wallet first.')
      return
    }

    const resTx = await SendController.sendERC20Token({
      receiverAddress: RECEIVER_ADDRESS,
      contractAddress: ERC20_CAIP_ADDRESS,
      sendTokenAmount: SEND_ERC20_AMOUNT, // in eth (not wei)
      decimals: '18',
      customData: {
        metadata: `<DOCTYPE html><html><head><title>Game Developer can add custom data to the transaction</title></head><body><h1>Game Developer can add custom data to the transaction</h1><p>This is a HTML text formatted custom data.</p></body></html>`
      },
      type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
    })
    showSuccess('Send ERC20 Token Successful!', `resTx: ${JSON.stringify(resTx)}`)
    getBalanceOfERC20({ showResult: false })
  }

  // used for sending custom transaction
  async function handleSendTransactionWithDynamicFee() {
    if (!account?.isConnected) {
      showError('Error in handleSendTransactionWithDynamicFee', 'Please connect wallet first.')
      return
    }

    if (!contractArgs) {
      showError('Error in handleSendTransactionWithDynamicFee', 'no contract args set')
      return
    }

    const { fromAddress, contractAddress, args, method, abi, chainNamespace } = contractArgs

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
          providedFormat: 'Plain text(string), HTML(string), JSON(key value object) are supported.',
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
  }

  // used for sending CROSS
  async function handleSendNativeWithDynamicFee() {
    if (!account?.isConnected) {
      showError('Error in handleSendNativeWithDynamicFee', 'Please connect wallet first.')
      return
    }

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
  }

  // used for sending any of game tokens
  async function handleSendERC20TokenWithDynamicFee() {
    if (!account?.isConnected) {
      showError('Error in handleSendERC20TokenWithDynamicFee', 'Please connect wallet first.')
      return
    }

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
  }

  async function getBalanceOfNative() {
    if (!account?.isConnected) {
      showError('Error in getBalanceOfNative', 'Please connect wallet first.')
      return
    }

    const balance = account?.balance
    showSuccess('Get Balance of Native Successful!', `CROSS balance: ${balance}`)
  }

  async function getBalanceOfERC20({ showResult = true }: { showResult?: boolean } = {}) {
    if (!account?.isConnected) {
      showError('Error in getBalanceOfERC20', 'Please connect wallet first.')
      return
    }

    const address = contractData[network.chainId as keyof typeof contractData].erc20

    if (address === '') {
      showError('Error in getBalanceOfERC20', 'Contract does not exist.')
      return
    }

    const amount = (await ConnectionController.readContract({
      contractAddress: ERC20_ADDRESS,
      method: 'balanceOf',
      abi: sampleErc20ABI,
      args: [FROM_ADDRESS as `0x${string}`]
    })) as string

    const balance = account?.tokenBalance?.map(token => {
      if (token.address === ERC20_ADDRESS.toLowerCase()) {
        // ERC20_ADDRESS is checksum address, so convert to lowercase
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
        'Get Balance of ERC20 Successful!',
        `updated erc20 balance: ${JSON.stringify(
          account?.tokenBalance?.find(token => token.address === ERC20_ADDRESS.toLowerCase()),
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
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

  async function getBalanceFromWalletWithChainFilter() {
    if (!account?.isConnected) {
      showError('Error in getBalanceFromWalletWithChainFilter', 'Please connect wallet first.')
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

  async function getBalanceFromWalletWithAssetFilter() {
    if (!account?.isConnected) {
      showError('Error in getBalanceFromWalletWithAssetFilter', 'Please connect wallet first.')
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
  async function getBalanceFromWalletOnMultipleChains() {
    if (!account?.isConnected) {
      showError('Error in getBalanceFromWalletOnMultipleChains', 'Please connect wallet first.')
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
  async function getBalanceFromWalletByTokenType() {
    if (!account?.isConnected) {
      showError('Error in getBalanceFromWalletByTokenType', 'Please connect wallet first.')
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

  // ============ Wagmi 관련 함수들 ============

  // Wagmi를 사용한 잔액 조회
  async function handleWagmiGetBalance() {
    if (!wagmiAccount.address) {
      showError('Error in Wagmi Get Balance', 'Please connect wallet first.')
      return
    }

    try {
      const balanceInfo = wagmiBalance
        ? `${wagmiBalance.formatted} ${wagmiBalance.symbol}`
        : 'No balance data'

      showSuccess(
        'Wagmi Get Balance Successful!',
        `Address: ${wagmiAccount.address}\nBalance: ${balanceInfo}\nChain ID: ${wagmiAccount.chainId}`
      )
    } catch (error) {
      console.error('Error getting balance with Wagmi:', error)
      showError('Error in Wagmi Get Balance', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi를 사용한 메시지 서명
  async function handleWagmiSignMessage() {
    if (!wagmiAccount.address) {
      showError('Error in Wagmi Sign Message', 'Please connect wallet first.')
      return
    }

    try {
      const message = 'Hello from Wagmi!'
      const signature = await signMessageAsync({ message })

      showSuccess('Wagmi Sign Message Successful!', `Message: ${message}\nSignature: ${signature}`)
    } catch (error) {
      console.error('Error signing message with Wagmi:', error)
      showError('Error in Wagmi Sign Message', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi를 사용한 트랜잭션 전송
  async function handleWagmiSendTransaction() {
    if (!wagmiAccount.address) {
      showError('Error in Wagmi Send Transaction', 'Please connect wallet first.')
      return
    }

    try {
      const hash = await sendTransactionAsync({
        to: RECEIVER_ADDRESS,
        value: parseEther('0.001')
      })

      showSuccess(
        'Wagmi Send Transaction Successful!',
        `Transaction Hash: ${hash}\nTo: ${RECEIVER_ADDRESS}\nValue: 0.001 ETH`
      )
    } catch (error) {
      console.error('Error sending transaction with Wagmi:', error)
      showError('Error in Wagmi Send Transaction', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi를 사용한 체인 전환
  async function handleWagmiSwitchChain(chainId: number) {
    if (!wagmiAccount.address) {
      showError('Error in Wagmi Switch Chain', 'Please connect wallet first.')
      return
    }

    try {
      await switchChainAsync({ chainId })

      showSuccess('Wagmi Switch Chain Successful!', `Switched to Chain ID: ${chainId}`)
    } catch (error) {
      console.error('Error switching chain with Wagmi:', error)
      showError('Error in Wagmi Switch Chain', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi를 사용한 연결 해제
  async function handleWagmiDisconnect() {
    try {
      await wagmiDisconnect()

      showSuccess('Wagmi Disconnect Successful!', 'Wallet disconnected successfully')
    } catch (error) {
      console.error('Error disconnecting with Wagmi:', error)
      showError('Error in Wagmi Disconnect', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi: Sign Typed Data V4 (EIP-712)
  async function handleWagmiSignTypedData() {
    if (!wagmiAccount.isConnected) {
      showError('Error in Wagmi Sign Typed Data', 'Please connect wallet first.')
      return
    }

    try {
      // EIP-712 typed data 예제
      const domain = {
        name: 'Cross Wagmi Example',
        version: '1',
        chainId: wagmiAccount.chainId,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as `0x${string}`
      }

      const types = {
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' }
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' }
        ]
      }

      const message = {
        from: {
          name: 'Alice',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
        },
        to: {
          name: 'Bob',
          wallet: wagmiAccount.address
        },
        contents: 'Hello from Wagmi!'
      }

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Mail',
        message
      })

      showSuccess(
        'Wagmi Sign Typed Data Successful!',
        `Signature: ${signature.slice(0, 20)}...${signature.slice(-20)}\n\nMessage: "${message.contents}"\nFrom: ${message.from.name}\nTo: ${message.to.name}`
      )
    } catch (error) {
      console.error('Error signing typed data with Wagmi:', error)
      showError('Error in Wagmi Sign Typed Data', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi: Get ERC20 Balance
  async function handleWagmiGetErc20Balance() {
    if (!wagmiAccount.isConnected) {
      showError('Error in Wagmi Get ERC20 Balance', 'Please connect wallet first.')
      return
    }

    try {
      await refetchErc20Balance()

      if (wagmiErc20Balance !== undefined) {
        const balance = Number(wagmiErc20Balance) / 10 ** 18
        showSuccess(
          'Wagmi Get ERC20 Balance Successful!',
          `ERC20 Balance: ${balance.toFixed(4)} tokens\nContract: ${ERC20_ADDRESS}`
        )
      } else {
        showError('Error in Wagmi Get ERC20 Balance', 'Failed to fetch balance')
      }
    } catch (error) {
      console.error('Error getting ERC20 balance with Wagmi:', error)
      showError('Error in Wagmi Get ERC20 Balance', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi: Send ERC20 Token
  async function handleWagmiSendErc20() {
    if (!wagmiAccount.isConnected) {
      showError('Error in Wagmi Send ERC20', 'Please connect wallet first.')
      return
    }

    try {
      const amount = parseUnits('1', 18) // 1 token
      const toAddress = RECEIVER_ADDRESS

      const hash = await writeContractAsync({
        address: ERC20_ADDRESS,
        abi: sampleErc20ABI,
        functionName: 'transfer',
        args: [toAddress, amount]
      })

      showSuccess(
        'Wagmi Send ERC20 Successful!',
        `Transaction Hash: ${hash}\nAmount: 1 token\nTo: ${toAddress}`
      )
    } catch (error) {
      console.error('Error sending ERC20 with Wagmi:', error)
      showError('Error in Wagmi Send ERC20', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi: Send Native Token (네트워크별 적절한 양)
  async function handleWagmiSendNative() {
    if (!wagmiAccount.address) {
      showError('Error in Wagmi Send Native', 'Please connect wallet first.')
      return
    }

    try {
      const hash = await sendTransactionAsync({
        to: RECEIVER_ADDRESS,
        value: parseEther(SEND_CROSS_AMOUNT.toString())
      })

      showSuccess(
        'Wagmi Send Native Token Successful!',
        `Transaction Hash: ${hash}\nTo: ${RECEIVER_ADDRESS}\nValue: ${SEND_CROSS_AMOUNT} ${contractData[network.chainId as keyof typeof contractData].coin}`
      )
    } catch (error) {
      console.error('Error sending native token with Wagmi:', error)
      showError('Error in Wagmi Send Native', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi: Get NFT Balance
  async function handleWagmiGetNftBalance() {
    if (!wagmiAccount.isConnected) {
      showError('Error in Wagmi Get NFT Balance', 'Please connect wallet first.')
      return
    }

    const address = contractData[network.chainId as keyof typeof contractData].erc721

    if (address === '') {
      showError('Error in Wagmi Get NFT Balance', 'Contract does not exist on this network.')
      return
    }

    try {
      await refetchNftBalance()

      if (wagmiNftBalance !== undefined) {
        showSuccess(
          'Wagmi Get NFT Balance Successful!',
          `NFT Balance: ${wagmiNftBalance.toString()}\nContract: ${ERC721_ADDRESS}`
        )
      } else {
        showError('Error in Wagmi Get NFT Balance', 'Failed to fetch NFT balance')
      }
    } catch (error) {
      console.error('Error getting NFT balance with Wagmi:', error)
      showError('Error in Wagmi Get NFT Balance', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi: Mint NFT (Custom Contract Write 예제)
  async function handleWagmiMintNft() {
    if (!wagmiAccount.isConnected) {
      showError('Error in Wagmi Mint NFT', 'Please connect wallet first.')
      return
    }

    const address = contractData[network.chainId as keyof typeof contractData].erc721

    if (address === '') {
      showError('Error in Wagmi Mint NFT', 'Contract does not exist on this network.')
      return
    }

    try {
      // Generate unique token ID
      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()

      const hash = await writeContractAsync({
        address: ERC721_ADDRESS,
        abi: sampleErc721ABI,
        functionName: 'mintTo',
        args: [wagmiAccount.address as `0x${string}`, BigInt(tokenId)]
      })

      showSuccess(
        'Wagmi Mint NFT Successful!',
        `Transaction Hash: ${hash}\nToken ID: ${tokenId}\nTo: ${wagmiAccount.address}`
      )
    } catch (error) {
      console.error('Error minting NFT with Wagmi:', error)
      showError('Error in Wagmi Mint NFT', `Error: ${(error as Error).message}`)
    }
  }

  // Wagmi를 사용한 지갑 연결
  async function handleWagmiConnect(connectorId?: string) {
    // 중복 요청 방지
    if (isWagmiLoading) {
      console.log('⚠️ Connection already in progress, ignoring duplicate request')
      return
    }

    try {
      setIsWagmiLoading(true)

      // Cross Extension은 별도 함수로 처리 (Wagmi connector 사용)
      if (connectorId === 'cross-extension') {
        await handleWagmiConnectCrossExtension()
        return
      }

      const connector = connectorId ? connectors.find(c => c.id === connectorId) : connectors[0]

      if (!connector) {
        showError('Error in Wagmi Connect', 'No connector available')
        return
      }

      console.log(`🔌 Connecting with ${connector.name}...`)
      const result = await connectAsync({ connector })

      showSuccess(
        'Wagmi Connect Successful!',
        `Connected to: ${result.accounts[0]}\nChain ID: ${result.chainId}`
      )
    } catch (error) {
      console.error('Error connecting with Wagmi:', error)
      const errorMessage = (error as Error).message

      // 사용자가 취소한 경우
      if (
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('rejected')
      ) {
        showError('연결 취소됨', '사용자가 지갑 연결을 취소했습니다.')
      } else if (errorMessage.includes('already pending')) {
        showError(
          '이미 연결 요청 진행 중',
          '이전 연결 요청을 완료하거나 취소한 후 다시 시도해주세요.'
        )
      } else {
        showError('Error in Wagmi Connect', `Error: ${errorMessage}`)
      }
    } finally {
      // Cross Extension이 아닌 경우에만 로딩 해제 (Cross Extension은 자체적으로 관리)
      if (connectorId !== 'cross-extension') {
        setIsWagmiLoading(false)
      }
    }
  }

  // Wagmi용 Cross Extension 연결 (Wagmi connector 사용)
  async function handleWagmiConnectCrossExtension() {
    try {
      setIsWagmiLoading(true)

      console.log('🚀 Wagmi: Cross Extension Wallet 연결 시도 시작')
      console.log(
        'Available connectors:',
        connectors.map(c => ({ id: c.id, name: c.name }))
      )

      // Cross Extension connector 찾기
      const crossConnector = connectors.find(c => c.id === 'cross-extension')

      if (!crossConnector) {
        console.error('❌ Cross Extension connector not found in connectors list')
        throw new Error(
          'Cross Extension connector not found. Please install Cross Extension Wallet.'
        )
      }

      console.log('✅ Found Cross Extension connector:', crossConnector)

      // Wagmi connector로 연결
      console.log('🔌 Connecting with Wagmi connector...')
      const result = await connectAsync({ connector: crossConnector })

      console.log('🎉 Wagmi: Cross Extension 연결 완료:', result)
      console.log('Wagmi Account State:', {
        isConnected: wagmiAccount.isConnected,
        address: wagmiAccount.address,
        chainId: wagmiAccount.chainId
      })

      // 연결 성공 후 상태 업데이트
      checkWagmiCrossExtension()

      showSuccess(
        'Wagmi: Cross Extension Wallet 연결 성공!',
        `Connected to: ${result.accounts[0]}\nChain ID: ${result.chainId}`
      )
      console.log('✅ Wagmi: Cross Extension Wallet 연결 성공')
    } catch (error) {
      console.error('❌ Wagmi: Cross Extension Wallet 연결 실패:', error)

      const errorMessage = error instanceof Error ? error.message : String(error)
      const isUserRejection =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('rejected') ||
        errorMessage.includes('cancelled')

      if (isUserRejection) {
        showError('Wagmi: 연결 취소됨', '사용자가 지갑 연결을 취소했습니다.')
      } else if (
        errorMessage.includes('not found') ||
        errorMessage.includes('not installed') ||
        errorMessage.includes('not detected')
      ) {
        showError(
          'Wagmi: Cross Extension 미설치 또는 미감지',
          'Cross Extension Wallet이 설치되지 않았거나 감지되지 않았습니다.\n\n1. Cross Extension Wallet을 설치했는지 확인\n2. 브라우저를 새로고침 (Cmd+Shift+R)\n3. 콘솔 로그를 확인하여 감지 상태 확인'
        )
      } else if (errorMessage.includes('already pending')) {
        showError(
          '이미 연결 요청 진행 중',
          '이전 연결 요청을 완료하거나 취소한 후 다시 시도해주세요.'
        )
      } else {
        showError('Wagmi: 연결 실패', `지갑 연결 중 오류가 발생했습니다:\n${errorMessage}`)
      }

      checkWagmiCrossExtension()
    } finally {
      setIsWagmiLoading(false)
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
        const universalProvider = await getUniversalProvider()

        // UniversalProvider가 있고 연결되어 있는지 확인
        if (universalProvider && universalProvider.session) {
          await universalProvider.request({
            method: 'eth_requestAccounts',
            params: []
          })
        }
      } catch (error) {
        // Cross Extension이나 다른 방식으로 연결된 경우 UniversalProvider가 없을 수 있음
        console.log('UniversalProvider access skipped:', error)
      }
    }

    accessUniversalProvider()
  }, [account?.isConnected]) // ✅ appKit 제거 (사용하지 않음)

  return (
    <div>
      <div className="action-button-list">
        {/* 연결되지 않은 경우에만 연결 버튼들 표시 */}
        {!account?.isConnected && (
          <>
            <button onClick={handleConnect}>Connect</button>
            <button onClick={handleConnectWallet}>Connect CROSSx</button>
            <button
              onClick={handleConnectCrossExtension}
              disabled={!isCrossExtensionInstalled || isLoading}
              style={{
                backgroundColor: isCrossExtensionInstalled ? '#007bff' : '#6c757d',
                color: 'white',
                cursor: isCrossExtensionInstalled && !isLoading ? 'pointer' : 'not-allowed',
                opacity: isCrossExtensionInstalled && !isLoading ? 1 : 0.6
              }}
            >
              {isLoading ? 'Connecting...' : 'Connect Cross Extension'}
            </button>
            <button onClick={handleCheckCrossExtension}>
              Check Cross Extension ({isCrossExtensionInstalled ? '✅' : '❌'})
            </button>
          </>
        )}

        {/* 연결된 경우에만 연결 해제 및 네트워크 변경 버튼들 표시 */}
        {account?.isConnected && (
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
        <button onClick={handleSignTypedDataV4}>Sign TypedData V4 (API)</button>
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
      <div
        className="action-button-list"
        style={{ marginTop: '10px', borderTop: '2px solid #007bff', paddingTop: '10px' }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
          Wagmi Functions{' '}
          {wagmiAccount.isConnected &&
            `(Connected: ${wagmiAccount.address?.slice(0, 6)}...${wagmiAccount.address?.slice(-4)})`}
        </h3>
        {!wagmiAccount.isConnected && (
          <>
            {/* Cross Extension 전용 버튼 */}
            <button
              onClick={() => handleWagmiConnect('cross-extension')}
              disabled={!isCrossExtensionInstalled || isWagmiLoading}
              style={{
                backgroundColor: isCrossExtensionInstalled ? '#28a745' : '#6c757d',
                color: 'white',
                cursor: isCrossExtensionInstalled && !isWagmiLoading ? 'pointer' : 'not-allowed',
                opacity: isCrossExtensionInstalled && !isWagmiLoading ? 1 : 0.6
              }}
            >
              {isWagmiLoading
                ? 'Connecting...'
                : `Wagmi: Connect Cross Extension ${isCrossExtensionInstalled ? '✅' : '❌'}`}
            </button>

            {/* 기타 Connectors */}
            {connectors
              .filter(connector => connector.id !== 'cross-extension')
              .map(connector => {
                const isReady = connector['ready'] !== false
                return (
                  <button
                    key={connector.id}
                    onClick={() => handleWagmiConnect(connector.id)}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      opacity: isReady && !isWagmiLoading ? 1 : 0.5
                    }}
                    disabled={!isReady || isWagmiLoading}
                  >
                    {isWagmiLoading ? 'Connecting...' : `Wagmi: Connect ${connector.name}`}
                  </button>
                )
              })}
          </>
        )}
        {/* 네트워크 변경 */}
        <button
          onClick={() => setIsNetworkModalOpen(true)}
          style={{ backgroundColor: '#6f42c1', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Switch Network
        </button>

        {/* 잔액 조회 */}
        <button
          onClick={handleWagmiGetBalance}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Get Balance
        </button>
        <button
          onClick={handleWagmiGetErc20Balance}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Get ERC20 Balance
        </button>
        <button
          onClick={handleWagmiGetNftBalance}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Get NFT Balance
        </button>

        {/* 서명 */}
        <button
          onClick={handleWagmiSignMessage}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Sign Message
        </button>
        <button
          onClick={handleWagmiSignTypedData}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Sign Typed Data V4
        </button>

        {/* 전송 */}
        <button
          onClick={handleWagmiSendNative}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Send {SEND_CROSS_AMOUNT}{' '}
          {contractData[network.chainId as keyof typeof contractData].coin}
        </button>
        <button
          onClick={handleWagmiSendErc20}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Send 1 ERC20 Token
        </button>
        <button
          onClick={handleWagmiMintNft}
          style={{ backgroundColor: '#0056b3', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Mint NFT (Custom Transaction)
        </button>

        {/* 연결 해제 */}
        <button
          onClick={handleWagmiDisconnect}
          style={{ backgroundColor: '#dc3545', color: 'white' }}
          disabled={!wagmiAccount.isConnected}
        >
          Wagmi: Disconnect
        </button>
      </div>

      {/* 네트워크 선택 모달 */}
      <NetworkSelectorModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        onSelectNetwork={handleWagmiSwitchChain}
        networks={supportedNetworks}
        currentChainId={wagmiAccount.chainId}
      />

      {/* 결과 모달 */}
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
