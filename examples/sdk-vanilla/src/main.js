import { initCrossSdkWithParams, useAppKitWallet } from '@to-nexus/sdk'
import { bscMainnet, bscTestnet, crossMainnet, crossTestnet } from '@to-nexus/sdk'
import {
  AccountController,
  ConnectionController,
  ConstantsUtil,
  SendController
} from '@to-nexus/sdk'
import { Signature, ethers } from 'ethers'
import { v4 as uuidv4 } from 'uuid'

import { sampleEIP712 } from './contracts/sample-eip712'
import { sampleErc20ABI } from './contracts/sample-erc20'
import { sampleErc721ABI } from './contracts/sample-erc721'

/**
 * TypeScript-style type definitions using JSDoc for better code safety
 */

/**
 * @typedef {Object} TypedDataDomain
 * @property {string} name
 * @property {string} version
 * @property {number} chainId
 * @property {string} verifyingContract
 */

/**
 * @typedef {Object} TypedDataField
 * @property {string} name
 * @property {string} type
 */

/**
 * @typedef {Object.<string, TypedDataField[]>} TypedDataTypes
 */

/**
 * @typedef {Object} EIP712TypedData
 * @property {TypedDataDomain} domain
 * @property {TypedDataTypes} types
 * @property {string} primaryType
 * @property {Object} message
 */



/**
 * Type guard function to validate API response structure
 * @param {any} data - Data to validate
 * @returns {boolean} - Whether data matches SignTypedDataApiResponse structure
 */
function isValidSignTypedDataApiResponse(data) {
  return (
    data && 
    typeof data === 'object' &&
    data.data &&
    typeof data.data === 'object' &&
    Array.isArray(data.data.params) &&
    data.data.params.length === 2 &&
    typeof data.data.params[0] === 'string' &&
    typeof data.data.params[1] === 'object' &&
    typeof data.data.hash === 'string' &&
    typeof data.data.uuid === 'string' &&
    typeof data.data.recover === 'string'
  )
}

const metadata = {
  name: 'Cross SDK',
  description: 'Cross SDK for HTML',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/wallet/token/images/CROSSx.svg']
}

// Your unique project id provided by Cross Team. If you don't have one, please contact us.
const projectId = import.meta.env['VITE_PROJECT_ID'] || '0979fd7c92ec3dbd8e78f433c3e5a523'
// Redirect URL to return to after wallet app interaction
const redirectUrl = window.location.href

const crossSdk = initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'light'
})

const appkitWallet = useAppKitWallet()

// 사용 가능한 네트워크 리스트
const availableNetworks = [
  { id: 'cross-mainnet', name: 'Cross Mainnet', network: crossMainnet },
  { id: 'cross-testnet', name: 'Cross Testnet', network: crossTestnet },
  { id: 'bsc-mainnet', name: 'BSC Mainnet', network: bscMainnet },
  { id: 'bsc-testnet', name: 'BSC Testnet', network: bscTestnet }
]

// Contract addresses and constants
const ERC20_ADDRESS = '0xe934057Ac314cD9bA9BC17AE2378959fd39Aa2E3'
const ERC20_DECIMALS = 18
const ERC721_ADDRESS = '0xaD31a95fE6bAc89Bc4Cf84dEfb23ebBCA080c013'
const RECEIVER_ADDRESS = '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379'
const SEND_ERC20_AMOUNT = 1
const SEND_CROSS_AMOUNT = 1

// State objects
let accountState = {}
let networkState = {}
let appKitState = {}
let themeState = { themeMode: 'light', themeVariables: {} }
let events = []
let walletInfo = {}
let eip155Provider = null
let contractArgs = null
let previousCaipAddress = null // 이전 주소를 저장하기 위한 변수

// Helper functions
function getERC20CAIPAddress() {
  return `${networkState.caipNetworkId}:${ERC20_ADDRESS}`
}

function getFROM_ADDRESS() {
  return AccountController.state.address
}

function getSEND_ERC20_AMOUNT_IN_WEI() {
  return ConnectionController.parseUnits(SEND_ERC20_AMOUNT.toString(), ERC20_DECIMALS)
}

// 네트워크 선택 팝업 생성 함수
function createNetworkModal() {
  const modal = document.getElementById('network-modal')
  const networkList = document.getElementById('network-list')

  // 기존 네트워크 리스트 초기화
  networkList.innerHTML = ''

  // 네트워크 리스트 생성
  availableNetworks.forEach(networkInfo => {
    const networkItem = document.createElement('div')
    const isCurrentNetwork = networkState?.caipNetwork?.id === networkInfo.network.id

    networkItem.className = `network-item ${isCurrentNetwork ? 'current' : ''}`

    const networkName = document.createElement('span')
    networkName.className = 'network-name'
    networkName.textContent = networkInfo.name

    const statusIndicator = document.createElement('span')
    statusIndicator.className = `network-status ${isCurrentNetwork ? 'current' : 'selectable'}`
    statusIndicator.textContent = isCurrentNetwork ? '✓ Current' : 'Select'

    networkItem.appendChild(networkName)
    networkItem.appendChild(statusIndicator)

    networkItem.onclick = async () => {
      if (!isCurrentNetwork) {
        try {
          await crossSdk.switchNetwork(networkInfo.network)
          closeNetworkModal()
        } catch (error) {
          console.error('Network switch failed:', error)
          alert('Network switch failed.')
        }
      }
    }

    networkList.appendChild(networkItem)
  })

  // 모달 표시
  modal.classList.add('show')
}

// 네트워크 모달 닫기 함수
function closeNetworkModal() {
  const modal = document.getElementById('network-modal')
  modal.classList.remove('show')
}

// 모달 이벤트 리스너 설정
function setupNetworkModalEvents() {
  const modal = document.getElementById('network-modal')
  const closeBtn = document.getElementById('network-modal-close')

  // 모달 외부 클릭 시 닫기
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeNetworkModal()
    }
  })

  // 닫기 버튼 클릭 시 닫기
  closeBtn.addEventListener('click', closeNetworkModal)
}

// Helper function to update theme
const updateTheme = mode => {
  document.documentElement.setAttribute('data-theme', mode)
  document.body.className = mode

  // Update logo based on theme
  const nexusLogo = document.getElementById('nexus-logo')
  if (nexusLogo) {
    nexusLogo.src = mode === 'dark' ? './nexus-logo-white.png' : './nexus-logo.png'
  }
}

// Action functions
async function handleSignMessage() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  try {
    const signedMessage = await ConnectionController.signMessage({
      message: `Hello, world! ${Date.now()}`,
      customData: {
        metadata: 'This is metadata for signed message'
      }
    })
    alert(`signedMessage: ${signedMessage}`)
  } catch (error) {
    console.error('Error signing message:', error)
    alert('Failed to sign message')
  }
}

// DEPRECATED: Legacy EIP-712 method for ERC-2612 permit signatures only
async function handleSignDeprecatedPermit() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  try {
    const PERMIT_CONTRACT_ADDRESS = '0x7aa0c7864455cf7a967409c158ae4cd41a2c5585'
    const PERMIT_SPENDER_ADDRESS = '0xC87D72172cd8839DdB26a7478025883af783571e'
    const PERMIT_VALUE = 1000000000000000000n
    const FROM_ADDRESS = getFROM_ADDRESS()

    const bnbRpcUrl = 'https://bsc-testnet.crosstoken.io/110ea3628b77f244e5dbab16790d81bba874b962'
    const provider = new ethers.JsonRpcProvider(bnbRpcUrl)
    const contract = new ethers.Contract(PERMIT_CONTRACT_ADDRESS, sampleEIP712, provider)
    const name = contract['name'] ? await contract['name']() : ''
    const nonce = contract['nonce'] ? await contract['nonce'](FROM_ADDRESS) : 0
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60 // after 1 hour

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

    const signature = Signature.from(resSignedEIP712)
    alert(`v: ${signature?.v}, r: ${signature?.r}, s: ${signature?.s}`)
  } catch (error) {
    console.error('Error signing EIP712:', error)
    alert('Failed to sign EIP712')
  }
}

// NEW: Generic EIP-712 signing using universal signTypedDataV4 method
async function handleSignTypedDataV4() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  try {
    console.log('Requesting typed data from API...')
    const FROM_ADDRESS = getFROM_ADDRESS()
    
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

    /**
     * @typedef {Object} SignTypedDataApiResponse
     * @property {Object} data
              * @property {[string, EIP712TypedData]} data.params - Typed params [address, EIP712TypedData]
     * @property {string} data.hash
     * @property {string} data.uuid
     * @property {string} data.recover
     */
    
    /** @type {SignTypedDataApiResponse} */
    const apiData = await response.json()
    console.log('API response:', JSON.stringify(apiData, null, 2))

    if (!isValidSignTypedDataApiResponse(apiData)) {
      throw new Error('Invalid API response: does not match expected SignTypedDataApiResponse structure')
    }

    // Extract only the typedData (second element) from API response params
    /** @type {EIP712TypedData} */
    const paramsData = apiData.data.params[1]
    console.log('Extracted params for signing:', JSON.stringify(paramsData, null, 2))

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
    alert(`✅ Signature successful!

🔑 Signature: ${signature}
📝 Hash: ${apiData.data.hash}
🆔 UUID: ${apiData.data.uuid}
🔗 Primary Type: ${paramsData[1].primaryType}
⛓️ Chain ID: ${paramsData[1].domain.chainId}
📋 Contract: ${paramsData[1].domain.verifyingContract}

Check console for full details.`)

  } catch (error) {
    console.error('Error in handleSignTypedDataV4:', error)
    alert(`❌ Error: ${error.message}`)
  }
}

async function handleProviderRequest() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  try {
    const res = await eip155Provider?.request({
      method: 'eth_chainId',
      params: [accountState.address, 'latest']
    })
    alert(`response by eth_chainId: ${JSON.stringify(res)}`)
  } catch (error) {
    console.error('Error in provider request:', error)
    alert('Failed to make provider request')
  }
}

async function handleSendTransaction() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  if (!contractArgs) {
    alert('no contract args set')
    return
  }

  try {
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
    const newArgs = [getFROM_ADDRESS(), tokenId]

    contractArgs = { ...contractArgs, args: newArgs }
  } catch (error) {
    console.error('Error sending transaction:', error)
    alert('Failed to send transaction')
  }
}

async function handleSendNative() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
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
      type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
    })
    alert(`resTx: ${JSON.stringify(resTx)}`)
  } catch (error) {
    console.error('Error sending native token:', error)
    alert('Failed to send native token')
  }
}

async function handleSendERC20Token() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  try {
    const resTx = await SendController.sendERC20Token({
      receiverAddress: RECEIVER_ADDRESS,
      contractAddress: getERC20CAIPAddress(),
      sendTokenAmount: SEND_ERC20_AMOUNT, // in eth (not wei)
      decimals: '18',
      customData: {
        metadata: `<DOCTYPE html><html><head><title>Game Developer can add custom data to the transaction</title></head><body><h1>Game Developer can add custom data to the transaction</h1><p>This is a HTML text formatted custom data.</p></body></html>`
      },
      type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
    })
    alert(`resTx: ${JSON.stringify(resTx)}`)
    getBalanceOfERC20({ showResult: false })
  } catch (error) {
    console.error('Error sending ERC20 token:', error)
    alert('Failed to send ERC20 token')
  }
}

async function handleSendTransactionWithDynamicFee() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  if (!contractArgs) {
    alert('no contract args set')
    return
  }

  try {
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
    const newArgs = [getFROM_ADDRESS(), tokenId]

    contractArgs = { ...contractArgs, args: newArgs }
  } catch (error) {
    console.error('Error sending transaction with dynamic fee:', error)
    alert('Failed to send transaction with dynamic fee')
  }
}

async function handleSendNativeWithDynamicFee() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
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
    alert(`resTx: ${JSON.stringify(resTx)}`)
  } catch (error) {
    console.error('Error sending native token with dynamic fee:', error)
    alert('Failed to send native token with dynamic fee')
  }
}

async function handleSendERC20TokenWithDynamicFee() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  try {
    const resTx = await SendController.sendERC20Token({
      receiverAddress: RECEIVER_ADDRESS,
      contractAddress: getERC20CAIPAddress(),
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
  } catch (error) {
    console.error('Error sending ERC20 token with dynamic fee:', error)
    alert('Failed to send ERC20 token with dynamic fee')
  }
}

async function getBalanceOfNative() {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  const balance = accountState?.balance
  alert(`CROSS balance: ${balance}`)
}

async function getBalanceOfERC20({ showResult = true } = {}) {
  if (!accountState.isConnected) {
    alert('Please connect wallet first.')
    return
  }

  try {
    const amount = await ConnectionController.readContract({
      contractAddress: ERC20_ADDRESS,
      method: 'balanceOf',
      abi: sampleErc20ABI,
      args: [getFROM_ADDRESS()]
    })

    const balance = accountState?.tokenBalance?.map(token => {
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
      console.log('balance not found')
      return
    }
    await AccountController.updateTokenBalance(balance)
    if (showResult)
      alert(
        `updated erc20 balance: ${JSON.stringify(
          accountState?.tokenBalance?.find(token => token.address === ERC20_ADDRESS.toLowerCase()),
          (key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        )}`
      )
  } catch (error) {
    console.error('Error getting ERC20 balance:', error)
    alert('Failed to get ERC20 balance')
  }
}

async function getBalanceOfNFT() {
  try {
    const amount = await ConnectionController.readContract({
      contractAddress: ERC721_ADDRESS,
      method: 'balanceOf',
      abi: sampleErc721ABI,
      args: [getFROM_ADDRESS()]
    })

    alert(`erc721 balance: ${amount}`)
  } catch (error) {
    console.error('Error getting NFT balance:', error)
    alert('Failed to get NFT balance')
  }
}

// Subscribe to state changes
crossSdk.subscribeAccount(state => {
  accountState = state
  document.getElementById('accountState').textContent = JSON.stringify(
    accountState,
    (key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2
  )
  // connect-wallet 버튼 텍스트 업데이트
  document.getElementById('connect-wallet').textContent = accountState.isConnected
    ? 'Connected'
    : 'Connect Wallet'

  // 주소가 변경되었을 때만 토큰 잔액을 가져옵니다
  if (accountState.caipAddress && accountState.caipAddress !== previousCaipAddress) {
    previousCaipAddress = accountState.caipAddress
    const fetchTokenBalance = async () => {
      try {
        await AccountController.fetchTokenBalance()
        console.log('Token balance fetched successfully for new address:', accountState.caipAddress)
      } catch (error) {
        console.error('Error fetching token balance:', error)
      }
    }
    fetchTokenBalance()
  }
})

crossSdk.subscribeNetwork(state => {
  networkState = state
  document.getElementById('networkState').textContent = JSON.stringify(state, null, 2)
  document.getElementById('switch-network').textContent = networkState.caipNetwork.name
})

crossSdk.subscribeState(state => {
  appKitState = state
  document.getElementById('appKitState').textContent = JSON.stringify(state, null, 2)
})

crossSdk.subscribeTheme(state => {
  themeState = state
  updateTheme(state.themeMode)
})

crossSdk.subscribeEvents(state => {
  events = state
  document.getElementById('events').textContent = JSON.stringify(state, null, 2)
})

crossSdk.subscribeWalletInfo(state => {
  walletInfo = state
  document.getElementById('walletInfo').textContent = JSON.stringify(state, null, 2)
})

crossSdk.subscribeProviders(state => {
  eip155Provider = state['eip155']
})

// Button event listeners
const connectWallet = document.getElementById('connect-wallet')
connectWallet.addEventListener('click', async () => {
  if (accountState.isConnected) {
    await appkitWallet.disconnect()
  } else {
    await appkitWallet.connect('cross_wallet')
  }
})

document.getElementById('toggle-theme')?.addEventListener('click', () => {
  const newTheme = themeState.themeMode === 'dark' ? 'light' : 'dark'
  crossSdk.setThemeMode(newTheme)
  themeState = { ...themeState, themeMode: newTheme }
  updateTheme(newTheme)
})

const switchNetwork = document.getElementById('switch-network')

switchNetwork.addEventListener('click', () => {
  createNetworkModal()
})

// Action button event listeners
document.getElementById('sign-message')?.addEventListener('click', handleSignMessage)
document.getElementById('sign-deprecated-permit')?.addEventListener('click', handleSignDeprecatedPermit)
document.getElementById('sign-typed-data-v4')?.addEventListener('click', handleSignTypedDataV4)
document.getElementById('provider-request')?.addEventListener('click', handleProviderRequest)

document.getElementById('send-native')?.addEventListener('click', handleSendNative)
document.getElementById('send-erc20')?.addEventListener('click', handleSendERC20Token)
document.getElementById('send-transaction')?.addEventListener('click', handleSendTransaction)
document
  .getElementById('send-native-dynamic')
  ?.addEventListener('click', handleSendNativeWithDynamicFee)
document
  .getElementById('send-erc20-dynamic')
  ?.addEventListener('click', handleSendERC20TokenWithDynamicFee)
document
  .getElementById('send-transaction-dynamic')
  ?.addEventListener('click', handleSendTransactionWithDynamicFee)

document.getElementById('get-balance-native')?.addEventListener('click', getBalanceOfNative)
document.getElementById('get-balance-erc20')?.addEventListener('click', () => getBalanceOfERC20())
document.getElementById('get-balance-nft')?.addEventListener('click', getBalanceOfNFT)

// Initialize contract args when account and network are ready
function initializeContractArgs() {
  if (contractArgs || !getFROM_ADDRESS() || !networkState?.caipNetwork?.chainNamespace) return

  const uuidHex = uuidv4().replace(/-/g, '')
  const tokenId = BigInt(`0x${uuidHex}`).toString()

  contractArgs = {
    fromAddress: getFROM_ADDRESS(),
    contractAddress: ERC721_ADDRESS,
    args: [
      getFROM_ADDRESS(), // address of token that will take the NFT
      tokenId
    ],
    method: 'mintTo(address, uint256)', // method to call on the contract
    abi: sampleErc721ABI, // abi of the contract
    chainNamespace: networkState?.caipNetwork?.chainNamespace,
    type: ConstantsUtil.TRANSACTION_TYPE.LEGACY // default type is LEGACY
  }
}

// Set initial theme and UI state
updateTheme(themeState.themeMode)

// 모달 이벤트 설정
setupNetworkModalEvents()

// Initialize contract args when state changes
crossSdk.subscribeAccount(() => {
  setTimeout(initializeContractArgs, 100)
})

crossSdk.subscribeNetwork(() => {
  setTimeout(initializeContractArgs, 100)
})
