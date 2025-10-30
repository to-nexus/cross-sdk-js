import { useCallback, useEffect, useState } from 'react'

import {
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  kaiaMainnet,
  kaiaTestnet
} from '@to-nexus/appkit/networks'
import { useAppKitWallet } from '@to-nexus/appkit/react'
import { v4 as uuidv4 } from 'uuid'
import { parseEther, parseUnits } from 'viem'
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

export function ActionButtonList() {
  const { isOpen, title, content, type, showSuccess, showError, closeModal } = useResultModal()
  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const { connect, connectCrossExtensionWallet, isInstalledCrossExtensionWallet } =
    useAppKitWallet()

  // Wagmi hooks
  const wagmiAccount = useAccount()
  const {
    data: wagmiBalance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    error: balanceError
  } = useBalance({
    address: wagmiAccount.address,
    chainId: wagmiAccount.chainId,
    query: {
      enabled: !!wagmiAccount.address && !!wagmiAccount.chainId
    }
  })
  const { signMessageAsync } = useSignMessage()
  const { signTypedDataAsync } = useSignTypedData()
  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()
  const { disconnectAsync: wagmiDisconnect } = useWagmiDisconnect()
  const { switchChainAsync } = useSwitchChain()

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
      console.log('🔍 Balance Query State:', {
        wagmiBalance,
        isBalanceLoading,
        isBalanceError,
        balanceError: balanceError?.message,
        address: wagmiAccount.address,
        chainId: wagmiAccount.chainId
      })

      // 최신 balance 데이터를 가져옴
      const result = await refetchBalance()
      console.log('📥 Refetch Result:', {
        data: result.data,
        isError: result.isError,
        error: result.error?.message
      })

      const balanceInfo = result.data
        ? `${result.data.formatted} ${result.data.symbol}`
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
      // EIP-712 typed data 예제 - Simple Ping structure
      const domain = {
        name: 'Example',
        version: '1',
        chainId: wagmiAccount.chainId,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as `0x${string}`
      }

      const types = {
        Ping: [{ name: 'contents', type: 'string' }]
      }

      const message = {
        contents: 'hello from Wagmi'
      }

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Ping',
        message
      })

      showSuccess(
        'Wagmi Sign Typed Data Successful!',
        `Signature: ${signature.slice(0, 20)}...${signature.slice(-20)}\n\nMessage: "${message.contents}"`
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
              onClick={() => connectCrossExtensionWallet()}
              disabled={!isCrossExtensionInstalled}
              style={{
                backgroundColor: isCrossExtensionInstalled ? '#28a745' : '#6c757d',
                color: 'white',
                cursor: isCrossExtensionInstalled ? 'pointer' : 'not-allowed'
              }}
            >
              `Wagmi: Connect Cross Extension ${isCrossExtensionInstalled ? '✅' : '❌'}`
            </button>

            <button onClick={() => connect('cross_wallet')}>`Wagmi: Connect CROSSx Wallet`</button>
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
