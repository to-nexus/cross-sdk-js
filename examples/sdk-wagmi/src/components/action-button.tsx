import { useCallback, useEffect, useState } from 'react'

import { v4 as uuidv4 } from 'uuid'
import { parseEther, parseUnits } from 'viem'
import { bsc, bscTestnet, mainnet, sepolia } from 'viem/chains'
import {
  useAccount,
  useBalance,
  useConnect,
  useReadContract,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
  useDisconnect as useWagmiDisconnect,
  useWriteContract
} from 'wagmi'

import { sampleErc20ABI } from '../contracts/sample-erc20'
import { sampleErc721ABI } from '../contracts/sample-erc721'
import { useResultModal } from '../hooks/use-result-modal'
import { crossMainnet, crossTestnet, kaia, kaiaTestnet } from '../wagmi-config'
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
    network: bsc
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
    network: kaia
  },
  1: {
    coin: 'ETH',
    erc20: '',
    erc721: '',
    network: mainnet
  },
  11155111: {
    coin: 'ETH',
    erc20: '',
    erc721: '',
    network: sepolia
  }
}

export function ActionButtonList() {
  const { isOpen, title, content, type, showSuccess, showError, closeModal } = useResultModal()
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
  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()
  const { disconnectAsync: wagmiDisconnect } = useWagmiDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { connectors, connectAsync } = useConnect()

  // Cross Extension Wallet 설치 상태 확인
  const checkWagmiCrossExtension = useCallback(() => {
    try {
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

  useEffect(() => {
    checkWagmiCrossExtension()
    const interval = setInterval(checkWagmiCrossExtension, 3000)
    return () => clearInterval(interval)
  }, [checkWagmiCrossExtension])

  // 상수 정의
  const RECEIVER_ADDRESS = '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379'
  const SEND_CROSS_AMOUNT =
    wagmiAccount.chainId === 1 || wagmiAccount.chainId === 11155111 ? 0.0001 : 1

  // 현재 네트워크의 컨트랙트 주소
  const ERC20_ADDRESS = (
    wagmiAccount.chainId
      ? contractData[wagmiAccount.chainId as keyof typeof contractData]?.erc20
      : ''
  ) as `0x${string}`
  const ERC721_ADDRESS = (
    wagmiAccount.chainId
      ? contractData[wagmiAccount.chainId as keyof typeof contractData]?.erc721
      : ''
  ) as `0x${string}`

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

  // ERC20 토큰 잔액 읽기
  const { data: wagmiErc20Balance, refetch: refetchErc20Balance } = useReadContract({
    address: ERC20_ADDRESS,
    abi: sampleErc20ABI,
    functionName: 'balanceOf',
    args: wagmiAccount.address ? [wagmiAccount.address] : undefined,
    query: {
      enabled: !!wagmiAccount.address && !!ERC20_ADDRESS && ERC20_ADDRESS !== '0x'
    }
  })

  // ERC721 NFT 잔액 읽기
  const { data: wagmiNftBalance, refetch: refetchNftBalance } = useReadContract({
    address: ERC721_ADDRESS,
    abi: sampleErc721ABI,
    functionName: 'balanceOf',
    args: wagmiAccount.address ? [wagmiAccount.address] : undefined,
    query: {
      enabled: !!wagmiAccount.address && !!ERC721_ADDRESS && ERC721_ADDRESS !== '0x'
    }
  })

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

      const currentCoin = wagmiAccount.chainId
        ? contractData[wagmiAccount.chainId as keyof typeof contractData]?.coin
        : 'TOKEN'
      showSuccess(
        'Wagmi Send Native Token Successful!',
        `Transaction Hash: ${hash}\nTo: ${RECEIVER_ADDRESS}\nValue: ${SEND_CROSS_AMOUNT} ${currentCoin}`
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

    const address = wagmiAccount.chainId
      ? contractData[wagmiAccount.chainId as keyof typeof contractData]?.erc721
      : ''

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

    const address = wagmiAccount.chainId
      ? contractData[wagmiAccount.chainId as keyof typeof contractData]?.erc721
      : ''

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

  return (
    <div>
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
          {wagmiAccount.chainId
            ? contractData[wagmiAccount.chainId as keyof typeof contractData]?.coin
            : 'TOKEN'}
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
