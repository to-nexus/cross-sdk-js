import { useEffect, useState } from 'react'

import {
  AccountController,
  ConnectionController,
  ConstantsUtil,
  SendController,
  UniversalProvider,
  bscMainnet,
  bscTestnet,
  contractData,
  crossMainnet,
  crossTestnet,
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
import { ethers } from 'ethers'
import { v4 as uuidv4 } from 'uuid'

import { sampleEIP712 } from '../contracts/sample-eip712'
import { sampleErc20ABI } from '../contracts/sample-erc20'
import { sampleErc721ABI } from '../contracts/sample-erc721'
import { useResultModal } from '../hooks/use-result-modal'
import { ResultModal } from './result-modal'

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

console.log(`redirectUrl: ${redirectUrl}`)
// Initialize SDK here
// initCrossSdkWithParams({
//   projectId,
//   redirectUrl,
//   metadata: {
//     name: 'Cross SDK',
//     description: 'Cross SDK for React',
//     url: 'https://to.nexus',
//     icons: ['https://contents.crosstoken.io/wallet/token/images/CROSSx.svg']
//   },
//   themeMode: 'light'
// })
const metadata = {
  name: 'Cross SDK',
  description: 'Cross SDK for React',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/wallet/token/images/CROSSx.svg']
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
  const { connect } = useAppKitWallet()
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
  const SEND_CROSS_AMOUNT = 1

  useEffect(() => {
    console.log('contractArgs', JSON.stringify(contractArgs?.args))
  }, [contractArgs?.args])

  // used for connecting wallet with wallet list
  function handleConnect() {
    console.log('🔄 Connecting wallet...')
    appKit.connect()
  }

  // used for connecting cross wallet directly
  function handleConnectWallet() {
    console.log('🔄 Connecting Cross wallet directly...')
    connect('cross_wallet')
  }

  // 토픽 정보를 로깅하는 함수
  const logTopicInfo = async () => {
    try {
      const universalProvider = await getUniversalProvider()
      if (universalProvider?.session) {
        console.log('📡 Session Topic:', universalProvider.session.topic)
        console.log('🔗 Pairing Topic:', universalProvider.session.pairingTopic)
        console.log('📋 Full Session Info:', universalProvider.session)
        
        // 현재 활성화된 세션들의 토픽도 확인
        if (universalProvider.client?.session) {
          const allSessions = universalProvider.client.session.getAll()
          console.log('📚 All Active Sessions:', allSessions.map(session => ({
            topic: session.topic,
            pairingTopic: session.pairingTopic,
            peer: session.peer?.metadata?.name
          })))
        }

        // 성공 메시지 표시
        showSuccess(
          'Topic Information Retrieved!',
          `Session Topic: ${universalProvider.session.topic}\nPairing Topic: ${universalProvider.session.pairingTopic}\n\nCheck console for full details.`
        )
      } else {
        console.log('❌ No active session found')
        showError('No Session Found', 'Please connect a wallet first to get topic information.')
      }
    } catch (error) {
      console.error('❌ Error getting topic info:', error)
      showError('Error Getting Topic Info', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 연결 상태 변화 감지 및 토픽 로깅
  useEffect(() => {
    if (account?.isConnected) {
      console.log('✅ Wallet connected! Logging topic information...')
      // 연결 후 약간의 지연을 두고 토픽 정보를 가져옴
      setTimeout(() => {
        logTopicInfo()
      }, 1000)
    } else {
      console.log('🔌 Wallet disconnected')
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

  async function handleEtherSignMessage() {
    if (!account?.isConnected) {
      showError('Error in handleEtherSignMessage', 'Please connect wallet first.')
      return
    }

    // 전역 Caver 사용
    if (!window.Caver) {
      showError('Error', 'Caver is not loaded. Please refresh the page.')
      return
    }

    const caver = new window.Caver(
      'https://kaia-testnet.crosstoken.io/fda0d5a47e2d0768e9329444295a3f0681fff365'
    )
    const nonce = await caver.rpc.klay.getTransactionCount(FROM_ADDRESS)
    const tx = caver.transaction.feeDelegatedSmartContractExecution.create({
      nonce: nonce,
      input:
        '0x5fd262de00000000000000000000000000000000000000000000000000000000000956cc000000000000000000000000d4846dddf83278d10b92bf6c169c5951d6f5abb8000000000000000000000000920a31f0e48739c3fbb790d992b0690f7f5c42ea00000000000000000000000000000000000000000000001b1ae4d6e2ef500000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000067969458000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000096b6169612d746573746e657400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      from: FROM_ADDRESS,
      to: caver.utils.toChecksumAddress('0x5C1EB536d3BF86a7dbbAAD8b5dd9f2C66c6a7a0B'),
      gasPrice: '0x5d21dba00',
      gas: '0x1ef3d'
    })

    console.log('tx:', tx)
    const messageToSign = tx.getSenderTxHash()
    console.log('messageToSign:', messageToSign)

    setIsLoading(true)
    try {
      console.log('etherSignMessage 2 ', messageToSign)
      const signedMessage = await ConnectionController.etherSignMessage({
        message: messageToSign,
        address: FROM_ADDRESS
      })
      console.log('signedMessage', signedMessage)
      if (!signedMessage) {
        showError('Error', 'Signature is undefined')
        return
      }

      const recovered = ethers.recoverAddress(messageToSign, signedMessage)
      console.log('recovered', recovered)

      showSuccess(
        'Success',
        `Transaction signed successfully\nsignedMessage ${signedMessage}\nrecovered ${recovered}`
      )
    } catch (error) {
      console.error('Signing error:', error)
      showError(
        'Error in handleEtherSignMessage',
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Generic EIP-712 signing using universal signTypedDataV4 method
  async function handleSignTypedDataV4() {
    if (!account?.isConnected) {
      showError('Error in handleSignTypedDataV4', 'Please connect wallet first.')
      return
    }

    try {
      console.log('Requesting typed data from API...')

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
      console.log('API response:', JSON.stringify(apiData, null, 2))

      if (!apiData.data?.params) {
        throw new Error('Invalid API response: missing params data')
      }

      // Extract only the typedData (second element) from API response params
      const tupleParams = apiData.data.params as [string, SignTypedDataV4Args]
      const paramsData = tupleParams[1]
      console.log(
        'Extracted typedData for signing (address removed):',
        JSON.stringify(paramsData, null, 2)
      )

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

      console.log('Signature result:', signature)

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
      sendTokenAmount: SEND_CROSS_AMOUNT, // in eth (not wei)
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
    console.log(`getBalanceOfERC20 - amount: ${amount}`)

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
      console.log('balance not found')
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
    console.log(`getBalanceFromWallet - chainFilter: ${chainFilter}`)

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
    console.log(`getSpecificTokensBalance - chainId: ${chainIdHex}`)

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

    console.log(`getSpecificTokensBalance - assetFilter:`, FROM_ADDRESS, assetFilter)

    try {
      // assetFilter를 사용하여 특정 토큰 잔액 요청
      const tokens = await ConnectionController.walletGetAssets({
        account: FROM_ADDRESS,
        assetFilter: assetFilter
      })

      console.log(`getSpecificTokensBalance - tokens:`, tokens)
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

    console.log('getMultiChainTokensBalance - assetFilter:', assetFilter)

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
      console.log(`tokenId to create next NFT: ${tokenId}`)

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
      const res = await universalProvider?.request({
        method: 'eth_requestAccounts',
        params: []
      })
      console.log(`eth_requestAccounts res: ${JSON.stringify(res)}`)
    }

    accessUniversalProvider()
  }, [appKit])

  return (
    <div>
      <div className="action-button-list">
        <button onClick={handleConnect}>{account?.isConnected ? 'Connected' : 'Connect'}</button>
        <button onClick={handleConnectWallet}>
          {account?.isConnected ? 'CROSSx Connected' : 'Connect CROSSx'}
        </button>
        <button onClick={handleDisconnect}>Disconnect</button>
        <button onClick={handleSwitchNetwork}>Switch to Cross</button>
        <button onClick={handleSwitchNetworkBsc}>Switch to BSC</button>
        <button onClick={handleSwitchNetworkKaia}>Switch to Kaia</button>
      </div>
      <div className="action-button-list" style={{ marginTop: '10px' }}>
        <button onClick={handleSendNative}>Send 1 CROSS</button>
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
        <button onClick={handleEtherSignMessage}>Sign Message with Ether Sign</button>
        <button onClick={handleSignTypedDataV4}>Sign TypedData V4 (API)</button>
        <button onClick={handleProviderRequest}>Provider Request</button>
        <button onClick={logTopicInfo}>Get Topic Info</button>
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
