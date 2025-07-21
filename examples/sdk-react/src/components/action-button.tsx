import { use, useEffect, useState } from 'react'

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
  getUniversalProvider,
  initCrossSdk,
  initCrossSdkWithParams,
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitWallet,
  useDisconnect
} from '@to-nexus/sdk/react'
import type { 
  AssetFilterType, 
  WriteContractArgs,
  SignTypedDataV4Args,
  TypedDataDomain,
  TypedDataTypes
} from '@to-nexus/sdk/react'
import { Signature, ethers } from 'ethers'
import { v4 as uuidv4 } from 'uuid'

// API Response types for EIP-712 signing
interface SignTypedDataApiResponse {
  data: {
    params: [string, SignTypedDataV4Args] // Server still sends [address, typedData] tuple
    hash: string
    uuid: string
    recover: string
  }
}

import { sampleEIP712 } from '../contracts/sample-eip712'
import { sampleErc20ABI } from '../contracts/sample-erc20'
import { sampleErc721ABI } from '../contracts/sample-erc721'

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
initCrossSdk(projectId, redirectUrl, metadata, 'dark', crossMainnet)

export function ActionButtonList() {
  const appKit = useAppKit()
  const account = useAppKitAccount()
  const network = useAppKitNetwork()
  const { disconnect } = useDisconnect()
  const { switchNetwork } = useAppKitNetwork()
  const [contractArgs, setContractArgs] = useState<WriteContractArgs | null>(null)
  const { walletProvider } = useAppKitProvider<UniversalProvider>('eip155')
  const { connect } = useAppKitWallet()
  // erc20 token contract address
  const ERC20_ADDRESS = '0xe934057Ac314cD9bA9BC17AE2378959fd39Aa2E3'
  // define decimals of erc20 token (ERC20 standard is 18)
  const ERC20_DECIMALS = 18
  // erc20 token contract address in caip format - eip155:{chainId}:{address}
  const ERC20_CAIP_ADDRESS = `${network.caipNetworkId}:${ERC20_ADDRESS}`
  // erc721 token contract address
  const ERC721_ADDRESS = '0xaD31a95fE6bAc89Bc4Cf84dEfb23ebBCA080c013'
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
    console.log('contractArgs', JSON.stringify(contractArgs?.args, ))
  }, [contractArgs?.args])

  // used for connecting wallet with wallet list
  function handleConnect() {
    appKit.connect()
  }

  // used for connecting cross wallet directly
  function handleConnectWallet() {
    connect('cross_wallet')
  }

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
    alert(`Current network: ${targetNetwork.caipNetworkId}`)
  }

  function handleSwitchNetworkBsc() {
    const targetNetwork =
      import.meta.env['VITE_NODE_ENV'] === 'production' ? bscMainnet : bscTestnet

    switchNetwork(targetNetwork)
    alert(`Current network: ${targetNetwork.caipNetworkId}`)
  }

  // used for provider request
  async function handleProviderRequest() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    const res = await walletProvider?.request({
      method: 'eth_chainId',
      params: [account.address, 'latest']
    })
    alert(`response by eth_chainId: ${JSON.stringify(res)}`)
  }

  // used for signing custom message
  async function handleSignMessage() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    const signedMessage = await ConnectionController.signMessage({
      message: `Hello, world! ${Date.now()}`,
      customData: {
        metadata: 'This is metadata for signed message'
      }
    })
    alert(`signedMessage: ${signedMessage}`)
  }

  // DEPRECATED: Legacy EIP-712 method for ERC-2612 permit signatures only
  async function handleSignDeprecatedPermit() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    const PERMIT_CONTRACT_ADDRESS = '0x7aa0c7864455cf7a967409c158ae4cd41a2c5585'
    const PERMIT_SPENDER_ADDRESS = '0xC87D72172cd8839DdB26a7478025883af783571e'
    const PERMIT_VALUE = 1000000000000000000n
    const PERMIT_ABI = sampleEIP712

    const bnbRpcUrl = 'https://bsc-testnet.crosstoken.io/110ea3628b77f244e5dbab16790d81bba874b962'
    const provider = new ethers.JsonRpcProvider(bnbRpcUrl)
    const contract = new ethers.Contract(PERMIT_CONTRACT_ADDRESS, PERMIT_ABI, provider)
    const name = contract['name'] ? await contract['name']() : ''
    const nonce = contract['nonce'] ? await contract['nonce'](FROM_ADDRESS) : 0
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60 // after 1 hour
    console.log(`handleSignEIP712 - name: ${name}, nonce: ${nonce}`)

    const resSignedEIP712 = await ConnectionController.signEIP712({
      contractAddress: PERMIT_CONTRACT_ADDRESS,
      fromAddress: FROM_ADDRESS,
      spenderAddress: PERMIT_SPENDER_ADDRESS,
      value: PERMIT_VALUE,
      chainNamespace: 'eip155',
      chainId: '97',
      name,
      nonce,
      deadline,
      customData: {
        metadata: 'This is metadata for signed EIP712'
      }
    })

    if (!resSignedEIP712) {
      alert('resSignedEIP712 is undefined')
      return
    }

    console.log(`resSignedEIP712: ${resSignedEIP712}`)
    const signature = Signature.from(resSignedEIP712)
    alert(`v: ${signature?.v}, r: ${signature?.r}, s: ${signature?.s}`)
  }

  // NEW: Generic EIP-712 signing using universal signTypedDataV4 method
  async function handleSignTypedDataV4() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    try {
      console.log('Requesting typed data from API...')
      
      // Example: Get typed data from API (can be any source)
      const response = await fetch('https://dev-cross-ramp-api.crosstoken.io/api/v1/erc20/message/user', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: FROM_ADDRESS, // Use actual connected wallet address
          amount: "1",
          direction: true,
          pair_id: 1,
          project_id: "nexus-ramp-v1"
        })
      })

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
      console.log('Extracted typedData for signing (address removed):', JSON.stringify(paramsData, null, 2))

      // Use the new universal signTypedDataV4 method
      const signature = await ConnectionController.signTypedDataV4(paramsData, {
        metadata: {
          apiResponse: {
            hash: apiData.data.hash,
            uuid: apiData.data.uuid,
            recover: apiData.data.recover
          },
          description: 'Universal EIP-712 typed data signature',
          timestamp: new Date().toISOString()
        }
      })

      if (!signature) {
        alert('Signature is undefined')
        return
      }

      console.log('Signature result:', signature)
      
      // Show detailed results
      alert(`
✅ Signature successful!

🔑 Signature: ${signature}
📝 Hash: ${apiData.data.hash}
🆔 UUID: ${apiData.data.uuid}
🔗 Primary Type: ${paramsData.primaryType}
⛓️ Chain ID: ${paramsData.domain.chainId}
📋 Contract: ${paramsData.domain.verifyingContract}

Check console for full details.
      `.trim())

    } catch (error) {
      console.error('Error in handleSignTypedDataV4:', error)
      alert(`❌ Error: ${(error as Error).message}`)
    }
  }

  // NEW: Client-side generated EIP-712 typed data example
  async function handleSignTypedDataV4Manual() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    try {
      console.log('Creating typed data using exact server structure...')

      // Using exact server data structure with EIP712Domain removed
      const domain: TypedDataDomain = {
        chainId: 612044,
        name: "MockService", 
        verifyingContract: "0xa55d9fff44bf394bdb42b0a20d7fcb2090e424d2",
        version: "1"
      }

      // ✅ EIP712Domain type removed from server data - let wallet handle it automatically  
      const types = {
        "ERC20Mint": [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      } as Record<string, any>

      const message = {
        amount: 1,
        deadline: 1753082356,
        nonce: 0,
        token: "0x61cc7192cce705cf289dd099094883fbd626c3ee"
      }

      // ⚠️ Using any to bypass EIP712Domain requirement - wallet will handle domain types automatically
      const typedData = {
        domain,
        types,
        primaryType: 'ERC20Mint',
        message
      } as unknown as SignTypedDataV4Args

      console.log(`Manual test typed data (EIP712Domain removed): ${JSON.stringify(typedData, null, 2)}`)

      // Use the universal signTypedDataV4 method (no need for address - provider will determine)
      const signature = await ConnectionController.signTypedDataV4(typedData, {
        metadata: {
          generatedBy: 'client',
          description: 'Client-generated EIP-712 typed data signature',
          tokenName: domain.name,
          approvalAmount: message.amount,
          timestamp: new Date().toISOString()
        }
      })

      if (!signature) {
        alert('Signature is undefined')
        return
      }

      console.log('Signature result:', signature)
      
      // Show detailed results
      alert(`✅ Client-side signature successful!

🔑 Signature: ${signature}
🏭 Service: ${domain.name}
🪙 Token: ${message.token}
💰 Amount: ${message.amount}
⏰ Deadline: ${new Date(message.deadline * 1000).toLocaleString()}
🔢 Nonce: ${message.nonce}
⛓️ Chain ID: ${domain.chainId}

`)

    } catch (error) {
      console.error('Error in handleSignTypedDataV4Manual:', error)
      alert(`❌ Error: ${(error as Error).message}`)
    }
  }



  // used for sending custom transaction
  async function handleSendTransaction() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    if (!contractArgs) {
      alert('no contract args set')
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

    alert(`resTx: ${JSON.stringify(resTx)}`)

    // generate new tokenId for next NFT
    const uuidHex = uuidv4().replace(/-/g, '')
    const tokenId = BigInt(`0x${uuidHex}`).toString()
    const newArgs = [FROM_ADDRESS as `0x${string}`, tokenId]

    setContractArgs({ ...contractArgs, args: newArgs })
  }

  // used for sending CROSS
  async function handleSendNative() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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
    alert(`resTx: ${JSON.stringify(resTx)}`)
  }

  // used for sending any of game tokens
  async function handleSendERC20Token() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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
    alert(`resTx: ${JSON.stringify(resTx)}`)
    getBalanceOfERC20({ showResult: false })
  }

  // used for sending custom transaction
  async function handleSendTransactionWithDynamicFee() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    if (!contractArgs) {
      alert('no contract args set')
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

    alert(`resTx: ${JSON.stringify(resTx)}`)

    // generate new tokenId for next NFT
    const uuidHex = uuidv4().replace(/-/g, '')
    const tokenId = BigInt(`0x${uuidHex}`).toString()
    const newArgs = [FROM_ADDRESS as `0x${string}`, tokenId]

    setContractArgs({ ...contractArgs, args: newArgs })
  }

  // used for sending CROSS
  async function handleSendNativeWithDynamicFee() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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
    alert(`resTx: ${JSON.stringify(resTx)}`)
  }

  // used for sending any of game tokens
  async function handleSendERC20TokenWithDynamicFee() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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
    alert(`resTx: ${JSON.stringify(resTx)}`)
    getBalanceOfERC20({ showResult: false })
  }

  async function getBalanceOfNative() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    const balance = account?.balance
    alert(`CROSS balance: ${balance}`)
  }

  async function getBalanceOfERC20({ showResult = true }: { showResult?: boolean } = {}) {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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
      alert(
        `updated erc20 balance: ${JSON.stringify(
          account?.tokenBalance?.find(token => token.address === ERC20_ADDRESS.toLowerCase()),
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
  }

  async function getBalanceOfNFT() {
    const amount = await ConnectionController.readContract({
      contractAddress: ERC721_ADDRESS,
      method: 'balanceOf',
      abi: sampleErc721ABI,
      args: [FROM_ADDRESS as `0x${string}`]
    })

    alert(`erc721 balance: ${amount}`)
  }

  async function getBalanceFromWalletWithChainFilter() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    const chainFilter = [`0x${network?.chainId?.toString(16)}`] as `0x${string}`[]
    console.log(`getBalanceFromWallet - chainFilter: ${chainFilter}`)

    const tokens = await ConnectionController.walletGetAssets({
      account: FROM_ADDRESS,
      chainFilter
    })
    alert(
      `balance: ${JSON.stringify(tokens, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}`
    )
  }

  async function getBalanceFromWalletWithAssetFilter() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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

    console.log(`getSpecificTokensBalance - assetFilter:`, assetFilter)

    try {
      // assetFilter를 사용하여 특정 토큰 잔액 요청
      const tokens = await ConnectionController.walletGetAssets({
        account: FROM_ADDRESS,
        assetFilter: assetFilter
      })

      // bigint를 문자열로 변환하여 JSON으로 출력
      alert(
        `Specific tokens balance: ${JSON.stringify(
          tokens,
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
    } catch (error) {
      console.error('Error fetching specific tokens balance:', error)
      alert(`Error: ${(error as Error).message}`)
    }
  }

  // 여러 체인의 여러 토큰 잔액을 한번에 요청하는 함수
  async function getBalanceFromWalletOnMultipleChains() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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

      alert(
        `Multi-chain tokens balance: ${JSON.stringify(
          multiChainTokens,
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
    } catch (error) {
      console.error('Error fetching multi-chain tokens balance:', error)
      alert(`Error: ${(error as Error).message}`)
    }
  }

  // 지정된 토큰 타입만 필터링하여 요청하는 함수
  async function getBalanceFromWalletByTokenType() {
    if (!account?.isConnected) {
      alert('Please connect wallet first.')
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

      alert(
        `ERC20 and native tokens: ${JSON.stringify(
          tokens,
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
    } catch (error) {
      console.error('Error fetching tokens by type:', error)
      alert(`Error: ${(error as Error).message}`)
    }
  }

  useEffect(() => {
    (() => {
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
        <button onClick={handleSignDeprecatedPermit}>ERC-2612 Permit (Deprecated)</button>
        <button onClick={handleSignTypedDataV4}>Sign TypedData V4 (Universal)</button>
        <button onClick={handleSignTypedDataV4Manual}>Sign TypedData V4 (Manual)</button>
        <button onClick={handleProviderRequest}>Provider Request</button>
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
    </div>
  )
}

export default ActionButtonList
