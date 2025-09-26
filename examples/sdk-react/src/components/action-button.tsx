import { useEffect, useState } from 'react'

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
  const {
    connect,
    connectCrossWallet,
    connectCrossExtensionWallet,
    isInstalledCrossExtensionWallet,
    isPending: isWalletPending
  } = useAppKitWallet()
  const { isOpen, title, content, type, showSuccess, showError, closeModal } = useResultModal()
  const [isLoading, setIsLoading] = useState(false)

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

  // 훅에서 직접 익스텐션 설치 여부 확인
  const isExtensionInstalled = isInstalledCrossExtensionWallet()

  useEffect(() => {
    // contractArgs change tracking
  }, [contractArgs?.args])

  // 세션 관리 로직 (SDK에서 이벤트 리스너 제거 후 DApp에서 직접 관리)
  useEffect(() => {
    // 페이지 가시성 변경 시(탭 전환 포함) 세션 상태를 강제로 재검증합니다.
    // document.hidden === false 경우에만 호출하여 불필요한 연산을 줄입니다.
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // 탭 활성화 시: 엔진에 cleanup 포함 강제 점검을 요청
        const isSessionActive = await checkWalletConnectionStatus(true)
        // 필요하다면 isSessionActive 결과에 따라 UI/스토어를 업데이트하세요.
        console.log('📱 [ACTION-BUTTON] isSessionActive:    ' + isSessionActive)
      }
    }

    // 브라우저 포커스 획득 시 세션을 재검증합니다.
    // 모달이 열려있는 경우(isOpen)에는 중복 호출을 피합니다.
    const handlePageFocus = async () => {
      if (!isOpen) {
        const isSessionActive = await checkWalletConnectionStatus(true)
        // isSessionActive를 사용해 재연결 유도, 알림 노출 등 후속 처리 가능
        console.log('📱 [ACTION-BUTTON] isSessionActive:', isSessionActive)
      }
    }

    // 포커스 해제 시에는 현재 별도 동작을 하지 않습니다. 필요 시 리소스 정리 등을 추가하세요.
    const handlePageBlur = () => {}

    // 지갑 연결 상태를 확인하는 도우미 함수입니다.
    // shouldCleanup=true 이면 엔진 내부에서 세션 정리 후 상태를 확인합니다.
    const checkWalletConnectionStatus = async (shouldCleanup: boolean): Promise<boolean> => {
      try {
        // UniversalProvider 엔진 존재 여부 확인 (확장 프로그램 연결 등에서는 세션이 없을 수 있음)
        if (walletProvider?.client?.engine) {
          // Engine의 간단한 세션 활성 상태 확인 함수 사용
          let isActive = false
          try {
            const universalProvider = await getUniversalProvider()
            const currentTopic = universalProvider?.session?.topic

            // Engine의 validateSessionAndGetStatus 함수로 단순화
            isActive = await (walletProvider.client.engine as any).validateSessionAndGetStatus(
              currentTopic,
              shouldCleanup
            )
          } catch (error) {
            console.error('Error checking session active status:', error)
            // 에러 발생 시 비활성 상태로 처리
            isActive = false
          }

          // 확장 프로그램(EIP1193Provider) 연결의 경우 Universal Provider 세션이 없을 수 있으므로
          // 계정이 연결되어 있으면 활성로 간주
          const isExtensionProvider = walletProvider?.constructor?.name === 'EIP1193Provider'
          if (!isActive && isExtensionProvider && account?.isConnected) {
            isActive = true
          }

          return isActive
        }
        // 엔진이 없는 연결(예: 브라우저 확장)에서는 false를 반환합니다.
        return false
      } catch (error) {
        // 엔진 예외 발생 시 false로 처리하고, 필요 시 오류 로깅/알림을 추가하세요.
        return false
      }
    }

    // 이벤트 리스너 등록: 페이지 가시성/포커스/블러
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handlePageFocus)
    window.addEventListener('blur', handlePageBlur)

    // AppKit이 브리지한 세션 끊김 이벤트를 구독합니다.
    // 이 이벤트가 발생하면 연결 상태 UI 초기화, 재연결 유도, 캐시 삭제 등을 수행하세요.
    const handleSessionDisconnected = (event: CustomEvent) => {
      console.log('📱 [ACTION-BUTTON] AppKit session disconnected event received:', event.detail)
    }

    window.addEventListener(
      'appkit_session_disconnected',
      handleSessionDisconnected as EventListener
    )

    // 언마운트 시 이벤트 리스너 해제
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

  // 수동으로 세션 상태를 조회하는 (읽기 전용) 함수입니다.
  // UI 디버깅 버튼과 같이 사용하여 현재 세션의 건강 상태를 점검합니다.
  const getSessionStatus = async () => {
    if (!walletProvider?.client?.engine) {
      // 엔진이 없다면 Universal Provider 기반 세션이 없을 수 있으므로 안내 메시지를 노출합니다.
      showError('Engine not available', 'Engine is not initialized')
      return
    }

    try {
      // 엔진의 getSessionStatus는 요약된 세션 정보를 반환합니다.
      const result = await (walletProvider.client.engine as any).getSessionStatus()

      if (result.error) {
        showError('Session Check Failed', `Error: ${result.error}`)
        return
      }

      if (result.total === 0) {
        // 총 세션 0으로 보고되더라도 실제 세션이 있을 수 있어 직접 재확인합니다.
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

      // 각 세션의 상태를 간략한 텍스트로 가공하여 사용자에게 표시합니다.
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

  // 세션을 수동으로 삭제하는 테스트 함수입니다.
  // 운영 코드에서는 특정 조건(에러 누적, 지연 복구 실패 등)에서만 호출하도록 설계하세요.
  const testManualSessionDeletion = async () => {
    try {
      if (!walletProvider?.client?.engine) {
        showError('Engine not available', 'Universal Provider engine is not available')
        return
      }

      // 현재 보유 중인 세션 목록을 조회합니다.
      const sessions = walletProvider.client.session.getAll()

      if (sessions.length === 0) {
        showError('No Sessions', 'No active sessions found')
        return
      }

      // 첫 번째 세션을 예시로 삭제합니다. 실제에서는 사용자 선택/정책에 따라 토픽을 지정하세요.
      const sessionToDelete = sessions[0]

      await (walletProvider.client.engine as any).deleteSession({
        topic: sessionToDelete?.topic,
        emitEvent: true // true면 appkit 측에서 관련 이벤트를 브로드캐스트할 수 있습니다.
      })

      // 삭제 후 재조회하여 결과를 사용자에게 안내합니다.
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

  // CROSS Wallet QR 코드 연결 핸들러 (모바일에서는 딥링크)
  const handleConnectCrossWallet = async () => {
    try {
      await connectCrossWallet()
    } catch (error) {
      console.error('CROSS Wallet QR 연결 실패:', error)
      showError('연결 실패', `CROSS Wallet QR 연결에 실패했습니다: ${error}`)
    }
  }

  // CROSS Wallet 익스텐션 직접 연결 핸들러
  const handleConnectCrossExtension = async () => {
    try {
      if (!isExtensionInstalled) {
        showError('익스텐션 미설치', 'CROSS Wallet 익스텐션이 설치되지 않았습니다.')
        return
      }

      await connectCrossExtensionWallet()
      showSuccess('익스텐션 연결 성공', 'CROSS Wallet 익스텐션이 연결되었습니다.')
    } catch (error) {
      console.error('CROSS Wallet 익스텐션 연결 실패:', error)
      showError('연결 실패', `CROSS Wallet 익스텐션 연결에 실패했습니다: ${error}`)
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
      const universalProvider = await getUniversalProvider()
      await universalProvider?.request({
        method: 'eth_requestAccounts',
        params: []
      })
    }

    accessUniversalProvider()
  }, [appKit])

  return (
    <div>
      {/* 연결 관리 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
          🔗 연결 관리 (Connection Management)
        </h3>
        {/* 연결되지 않은 상태: 연결 버튼들 표시 */}
        {!account?.isConnected && (
          <>
            <div className="action-button-list">
              <button onClick={handleConnect} disabled={isLoading}>
                Connect
              </button>
              <button onClick={handleConnectWallet} disabled={isLoading}>
                Connect CROSSx
              </button>
            </div>
            <div className="action-button-list" style={{ marginTop: '10px' }}>
              <button onClick={handleConnectCrossWallet} disabled={isWalletPending}>
                {isWalletPending ? 'Connecting...' : 'Connect CROSS Wallet (QR)'}
              </button>
              <button
                onClick={handleConnectCrossExtension}
                disabled={isWalletPending || !isExtensionInstalled}
                style={{
                  backgroundColor: !isExtensionInstalled ? '#9E9E9E' : '',
                  color: !isExtensionInstalled ? 'white' : ''
                }}
              >
                {isWalletPending
                  ? 'Connecting...'
                  : `Connect Extension${!isExtensionInstalled ? ' (Not Installed)' : ''}`}
              </button>
            </div>
          </>
        )}

        {/* 연결된 상태: Disconnect 버튼만 표시 */}
        {account?.isConnected && (
          <div className="action-button-list">
            <button
              onClick={handleDisconnect}
              style={{ backgroundColor: '#dc3545', color: 'white' }}
            >
              Disconnect
            </button>
          </div>
        )}
        <div className="action-button-list" style={{ marginTop: '10px' }}>
          <button onClick={getSessionStatus} style={{ backgroundColor: '#28a745', color: 'white' }}>
            Get Session Status (Read Only)
          </button>
          <button
            onClick={testManualSessionDeletion}
            style={{ backgroundColor: '#dc3545', color: 'white' }}
          >
            Test Manual Session Deletion
          </button>
          <button onClick={logTopicInfo}>Get Topic Info</button>
        </div>
      </div>

      {/* 체인 관리 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
          ⛓️ 체인 관리 (Chain Management)
        </h3>
        <div className="action-button-list">
          <button onClick={handleSwitchNetwork}>Switch to Cross</button>
          <button onClick={handleSwitchNetworkBsc}>Switch to BSC</button>
          <button onClick={handleSwitchNetworkKaia}>Switch to Kaia</button>
          <button onClick={handleSwitchNetworkEther}>Switch to Ether</button>
        </div>
        <div className="action-button-list" style={{ marginTop: '10px' }}>
          <div
            style={{
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '5px',
              fontSize: '14px',
              color: '#666'
            }}
          >
            현재 체인: <strong>{network.caipNetwork?.name || 'Unknown'}</strong> (Chain ID:{' '}
            {network.chainId})
          </div>
        </div>
      </div>

      {/* 전송 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
          💸 전송 (Send Transactions)
        </h3>
        <div className="action-button-list">
          <button onClick={handleSendNative}>
            Send {SEND_CROSS_AMOUNT}{' '}
            {contractData[network.chainId as keyof typeof contractData].coin}
          </button>
          <button onClick={handleSendERC20Token}>Send 1 ERC20</button>
          <button onClick={handleSendTransaction}>Send Custom Transaction</button>
        </div>
        <div className="action-button-list" style={{ marginTop: '10px' }}>
          <button onClick={handleSendNativeWithDynamicFee}>Send 1 CROSS with Dynamic Fee</button>
          <button onClick={handleSendERC20TokenWithDynamicFee}>
            Send 1 ERC20 with Dynamic Fee
          </button>
          <button onClick={handleSendTransactionWithDynamicFee}>
            Send Custom Transaction with Dynamic Fee
          </button>
        </div>
      </div>

      {/* 서명 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
          ✍️ 서명 (Sign & Provider)
        </h3>
        <div className="action-button-list">
          <button onClick={handleSignMessage}>Sign Message</button>
          <button onClick={handleSignTypedDataV4}>Sign TypedData V4 (API)</button>
          <button onClick={handleProviderRequest}>Provider Request</button>
        </div>
      </div>

      {/* 잔액 조회 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
          💰 잔액 조회 (Balance Inquiry)
        </h3>
        <div className="action-button-list">
          <button onClick={getBalanceOfNative}>Get Balance of CROSS</button>
          <button onClick={() => getBalanceOfERC20()}>Get Balance of ERC20</button>
          <button onClick={getBalanceOfNFT}>Get Balance of NFT</button>
        </div>
        <div className="action-button-list" style={{ marginTop: '10px' }}>
          <button onClick={getBalanceFromWalletWithChainFilter}>
            Get Balance from Wallet with ChainFilter
          </button>
          <button onClick={getBalanceFromWalletWithAssetFilter}>
            Get Specific Token Balance from Wallet
          </button>
        </div>
        <div className="action-button-list" style={{ marginTop: '10px' }}>
          <button onClick={getBalanceFromWalletOnMultipleChains}>
            Get Multi Chain Balance from Wallet
          </button>
          <button onClick={getBalanceFromWalletByTokenType}>
            Get Balance from Wallet by AssetFilterType
          </button>
        </div>
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
