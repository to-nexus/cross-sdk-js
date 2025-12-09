import {
  ConnectorUtil,
  bscMainnet,
  bscTestnet,
  createDefaultSIWXConfig,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  initCrossSdkWithParams,
  kaiaMainnet,
  kaiaTestnet,
  roninMainnet,
  roninTestnet,
  useAppKitWallet
} from '@to-nexus/sdk'
import {
  AccountController,
  ChainController,
  ConnectionController,
  ConstantsUtil,
  CoreHelperUtil,
  OptionsController,
  SendController
} from '@to-nexus/sdk'
import EthereumProvider from '@walletconnect/ethereum-provider'
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

const metadata = {
  name: 'Cross JS SDK Sample',
  description: 'Cross SDK for HTML',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

// Your unique project id provided by Cross Team. If you don't have one, please contact us.
const projectId = import.meta.env['VITE_PROJECT_ID'] || '0979fd7c92ec3dbd8e78f433c3e5a523'
// Redirect URL to return to after wallet app interaction
const redirectUrl = window.location.href

// SDK 초기화 with SIWX (이제 SDK가 기본 구현 제공!)
const crossSdk = initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'light',
  mobileLink: ConstantsUtil.getUniversalLink(),
  // ⚠️ 개발/데모용: 클라이언트에서 랜덤 nonce 생성 (보안 취약!)
  // siwx: createDefaultSIWXConfig({
  //   statement: 'Sign in with your wallet to Cross SDK Sample App'
  // })

  // ✅ 프로덕션 권장: 백엔드에서 nonce 생성 및 서명 검증
  siwx: createDefaultSIWXConfig({
    statement: 'Sign in with your wallet to Cross SDK Sample App',

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

        // 데모용: localStorage에 저장 (프로덕션에서는 백엔드에 저장!)
        localStorage.setItem('siwx_session', JSON.stringify(session))
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

        // 데모용: localStorage에서 조회 (단수와 복수 키 모두 확인)

        // 1. 먼저 siwx_session (단수) 확인 - Extension + SIWE에서 저장
        const sessionStr = localStorage.getItem('siwx_session')
        if (sessionStr) {
          const session = JSON.parse(sessionStr)
          if (
            session.data.chainId === chainId &&
            session.data.accountAddress.toLowerCase() === address.toLowerCase()
          ) {
            return [session]
          }
        }

        // 2. siwx_sessions (복수) 확인 - QR code + SIWE에서 저장
        const sessionsStr = localStorage.getItem('siwx_sessions')
        if (sessionsStr) {
          const sessions = JSON.parse(sessionsStr)
          const matchingSessions = sessions.filter(
            session =>
              session.data.chainId === chainId &&
              session.data.accountAddress.toLowerCase() === address.toLowerCase()
          )
          if (matchingSessions.length > 0) {
            return matchingSessions
          }
        }

        return []
      } catch (error) {
        console.error('Failed to get sessions:', error)
        return []
      }
    }
  })
})

const appkitWallet = useAppKitWallet()

// ========================================
// WalletConnect Provider 초기화 (MetaMask QRCode 연결용)
// ========================================
const metamaskProjectId =
  import.meta.env['VITE_METAMASK_PROJECT_ID'] || 'a48aa6e93d89fbc0f047637579e65356'

// WalletConnect Provider 변수 (나중에 초기화)
let walletConnectProvider = null

// WalletConnect configuration ready

// 사용 가능한 네트워크 리스트
const availableNetworks = [
  { id: 'cross-mainnet', name: 'Cross Mainnet', network: crossMainnet },
  { id: 'cross-testnet', name: 'Cross Testnet', network: crossTestnet },
  { id: 'bsc-mainnet', name: 'BSC Mainnet', network: bscMainnet },
  { id: 'bsc-testnet', name: 'BSC Testnet', network: bscTestnet },
  { id: 'kaia-mainnet', name: 'Kaia Mainnet', network: kaiaMainnet },
  { id: 'kaia-testnet', name: 'Kaia Testnet', network: kaiaTestnet },
  { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', network: etherMainnet },
  { id: 'ethereum-testnet', name: 'Ethereum Testnet', network: etherTestnet },
  { id: 'ronin-mainnet', name: 'Ronin Mainnet', network: roninMainnet },
  { id: 'ronin-testnet', name: 'Ronin Testnet', network: roninTestnet }
]

// Contract addresses and constants
let ERC20_ADDRESS = ''
const ERC20_DECIMALS = 18
let ERC721_ADDRESS = ''
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

// MetaMask 상태
let metamaskProvider = null
let metamaskAccount = null
let metamaskChainId = null

// 현재 활성화된 지갑 타입 감지
function getActiveWallet() {
  // MetaMask가 연결되어 있으면
  if (metamaskProvider && metamaskAccount) {
    return {
      type: 'metamask',
      provider: metamaskProvider,
      account: metamaskAccount,
      chainId: metamaskChainId
    }
  }

  // CROSSx Wallet이 연결되어 있으면
  if (accountState?.isConnected && eip155Provider) {
    return {
      type: 'cross',
      provider: eip155Provider,
      account: accountState.address,
      chainId: networkState.chainId
    }
  }

  return null
}

// 세션 관리 관련 변수들
let isPageActive = true
let lastActiveTime = Date.now()

// 세션 상태 확인 함수
async function checkWalletConnectionStatus(shouldCleanup = false) {
  try {
    // UniversalProvider 엔진 존재 여부 확인
    if (eip155Provider?.client?.engine) {
      // Engine의 validateSessionAndGetStatus 함수 호출
      const universalProvider = eip155Provider
      const currentTopic = universalProvider?.session?.topic

      const isActive = await eip155Provider.client.engine.validateSessionAndGetStatus(
        currentTopic,
        shouldCleanup
      )

      return isActive
    }

    // 엔진이 없는 연결(예: 브라우저 확장)에서는 계정 연결 상태로 판단
    return accountState?.isConnected || false
  } catch (error) {
    console.error('Error checking wallet connection status:', error)
    return false
  }
}

// 페이지 포커스 관리
function handlePageFocus() {
  // Page focused - checking session status
  isPageActive = true
  lastActiveTime = Date.now()

  // 세션 상태 확인 (cleanup 수행)
  if (accountState?.isConnected) {
    checkWalletConnectionStatus(true)
      .then(isActive => {
        if (!isActive) {
          console.log('📱 [VANILLA] Session is no longer active, updating UI')
          // 세션이 끊어진 경우 UI 업데이트를 위해 강제로 상태 갱신
          // 실제 disconnect는 SDK 내부에서 처리됨
        }
      })
      .catch(error => {
        console.error('📱 [VANILLA] Error during session check:', error)
      })
  }
}

function handlePageBlur() {
  // Page blurred
  isPageActive = false
}

// 페이지 visibility 이벤트 리스너 설정
function initializeSessionManagement() {
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handlePageFocus()
      } else {
        handlePageBlur()
      }
    })

    window.addEventListener('focus', handlePageFocus)
    window.addEventListener('blur', handlePageBlur)

    // Session management initialized
  }
}

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

  // 현재 연결된 지갑 확인
  const activeWallet = getActiveWallet()

  // 네트워크 리스트 생성
  availableNetworks.forEach(networkInfo => {
    const networkItem = document.createElement('div')

    // 현재 네트워크 확인 (MetaMask와 CROSSx Wallet 구분)
    const currentChainId =
      activeWallet?.type === 'metamask' ? metamaskChainId : networkState?.caipNetwork?.id
    const isCurrentNetwork = currentChainId === networkInfo.network.id

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
          const activeWallet = getActiveWallet()

          if (activeWallet && activeWallet.type === 'metamask') {
            // MetaMask 네트워크 전환
            const chainId = '0x' + networkInfo.network.id.toString(16)

            try {
              await activeWallet.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId }]
              })

              // MetaMask chainId 업데이트
              metamaskChainId = networkInfo.network.id

              showSuccess(
                '🦊 MetaMask 네트워크 전환 성공!',
                `${networkInfo.name}으로 전환되었습니다.`
              )
            } catch (switchError) {
              // 네트워크가 없는 경우 추가 시도
              if (switchError.code === 4902) {
                try {
                  await activeWallet.provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId,
                        chainName: networkInfo.name,
                        rpcUrls: networkInfo.network.rpcUrls?.default?.http || [],
                        nativeCurrency: networkInfo.network.nativeCurrency,
                        blockExplorerUrls: networkInfo.network.blockExplorers?.default?.url
                          ? [networkInfo.network.blockExplorers.default.url]
                          : []
                      }
                    ]
                  })

                  metamaskChainId = networkInfo.network.id

                  showSuccess(
                    '🦊 MetaMask 네트워크 추가 및 전환 성공!',
                    `${networkInfo.name}이 추가되고 전환되었습니다.`
                  )
                } catch (addError) {
                  console.error('Network add failed:', addError)
                  showError('네트워크 추가 실패!', `Error: ${addError.message}`)
                }
              } else {
                throw switchError
              }
            }
          } else {
            // CROSSx Wallet 네트워크 전환
            await crossSdk.switchNetwork(networkInfo.network)
          }

          closeNetworkModal()
        } catch (error) {
          console.error('Network switch failed:', error)
          showError('Network switch failed!', `Error: ${error.message}`)
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

function showResultModal(title, content, type = 'info') {
  // Show result modal
  const modal = document.getElementById('result-modal')
  const container = modal.querySelector('.result-modal-container')
  const iconEl = modal.querySelector('.result-modal-icon')
  const titleEl = modal.querySelector('.result-modal-title')
  const bodyEl = modal.querySelector('.result-modal-body')

  // 타입별 스타일 설정
  container.className = 'result-modal-container'
  switch (type) {
    case 'success':
      container.classList.add('result-modal-success')
      iconEl.textContent = '✅'
      iconEl.style.color = '#10b981'
      break
    case 'error':
      container.classList.add('result-modal-error')
      iconEl.textContent = '❌'
      iconEl.style.color = '#ef4444'
      break
    case 'info':
    default:
      container.classList.add('result-modal-info')
      iconEl.textContent = 'ℹ️'
      iconEl.style.color = '#3b82f6'
      break
  }

  // 내용 설정
  titleEl.textContent = title
  bodyEl.textContent = content

  // 모달 표시
  modal.style.display = 'flex'
  // Modal displayed
}

function showSuccess(title, content) {
  showResultModal(title, content, 'success')
}

function showError(title, content) {
  showResultModal(title, content, 'error')
}

function closeResultModal() {
  const modal = document.getElementById('result-modal')
  modal.style.display = 'none'
}

function setupResultModalEvents() {
  const modal = document.getElementById('result-modal')
  const closeBtn = document.getElementById('result-modal-close')

  // 모달 외부 클릭 시 닫기
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeResultModal()
    }
  })

  // 닫기 버튼 클릭 시 닫기
  closeBtn.addEventListener('click', closeResultModal)
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
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('지갑 미연결', 'CROSSx Wallet 또는 MetaMask를 먼저 연결해주세요.')
    return
  }

  try {
    const message = `Hello, world! ${Date.now()}`

    if (activeWallet.type === 'metamask') {
      // MetaMask 사용
      const signature = await activeWallet.provider.request({
        method: 'personal_sign',
        params: [message, activeWallet.account]
      })
      showSuccess(
        '🦊 MetaMask 서명 성공!',
        `메시지: ${message}\n서명: ${signature.slice(0, 20)}...${signature.slice(-20)}`
      )
    } else {
      // CROSSx Wallet 사용
      const signedMessage = await ConnectionController.signMessage({
        message,
        customData: {
          metadata: 'This is metadata for signed message'
        }
      })
      showSuccess('⚡ CROSSx Wallet 서명 성공!', `서명: ${signedMessage}`)
    }
  } catch (error) {
    console.error('Error signing message:', error)
    showError('서명 실패!', `Error: ${error.message}`)
  }
}

// Universal EIP-712 signing using server-provided typed data
async function handleSignTypedDataV4() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('지갑 미연결', 'CROSSx Wallet 또는 MetaMask를 먼저 연결해주세요.')
    return
  }

  // Get current chain ID for the fallback data
  const currentChainId =
    activeWallet.type === 'metamask'
      ? activeWallet.chainId
      : typeof networkState.chainId === 'string'
        ? parseInt(networkState.chainId, 10)
        : networkState.chainId || 1

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
  }

  try {
    let paramsData
    let apiData = null
    let usingFallback = false

    try {
      console.log('Requesting typed data from Cross Ramp API...')
      const FROM_ADDRESS = activeWallet.account

      // Get typed data from API
      const response = await fetch(
        'https://dev-cross-ramp-api.crosstoken.io/api/v1/erc20/message/user',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            account: FROM_ADDRESS,
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

      apiData = await response.json()
      console.log('API response:', JSON.stringify(apiData, null, 2))

      if (!apiData.data?.params) {
        throw new Error('Invalid API response: missing params data')
      }

      // Extract only the typedData (second element) from API response params
      paramsData = apiData.data.params[1]
      console.log('Extracted typedData for signing:', JSON.stringify(paramsData, null, 2))
    } catch (apiError) {
      console.warn('API request failed, using fallback data:', apiError)
      paramsData = fallbackTypedData
      usingFallback = true
    }

    let signature

    if (activeWallet.type === 'metamask') {
      // MetaMask 사용 - eth_signTypedData_v4 메서드 사용
      // MetaMask signing

      // EIP-712 형식으로 변환
      const typedData = {
        domain: paramsData.domain,
        types: paramsData.types,
        primaryType: paramsData.primaryType,
        message: paramsData.message
      }

      signature = await activeWallet.provider.request({
        method: 'eth_signTypedData_v4',
        params: [activeWallet.account, JSON.stringify(typedData)]
      })

      // Signature completed
    } else {
      // CROSSx Wallet 사용 - ConnectionController.signTypedDataV4 사용
      // CROSSx Wallet signing

      signature = await ConnectionController.signTypedDataV4(paramsData, {
        metadata: apiData
          ? {
              apiResponse: {
                hash: apiData.data.hash,
                uuid: apiData.data.uuid,
                recover: apiData.data.recover
              },
              description: 'Universal EIP-712 typed data signature',
              timestamp: new Date().toISOString()
            }
          : {
              description: 'Universal EIP-712 typed data signature (using fallback data)',
              timestamp: new Date().toISOString()
            }
      })

      // Signature completed
    }

    if (!signature) {
      showError('Signature is undefined')
      return
    }

    // Signature completed

    // Show detailed results
    const walletIcon = activeWallet.type === 'metamask' ? '🦊' : '⚡'
    const walletName = activeWallet.type === 'metamask' ? 'MetaMask' : 'CROSSx Wallet'
    const message = usingFallback
      ? `${walletIcon} ${walletName} Signature: ${signature.slice(0, 20)}...${signature.slice(-20)}\n⚠️ Using Fallback Data (API unavailable)`
      : `${walletIcon} ${walletName} Signature: ${signature.slice(0, 20)}...${signature.slice(-20)}`

    showSuccess('서명 성공!', message)
  } catch (error) {
    console.error('Error in handleSignTypedDataV4:', error)
    showError('Signature failed!', `Error: ${error.message}`)
  }
}

// Cross SDK only
async function handleProviderRequest() {
  if (!accountState.isConnected) {
    showError('This feature is only available with CROSSx Wallet.')
    return
  }

  try {
    const res = await eip155Provider?.request({
      method: 'eth_chainId',
      params: [accountState.address, 'latest']
    })
    showSuccess('Provider request successful!', `Response: ${JSON.stringify(res)}`)
  } catch (error) {
    console.error('Error in provider request:', error)
    showError('Provider request failed!', `Error: ${error.message}`)
  }
}

async function handleSendTransaction() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  if (!contractArgs) {
    showError('no contract args set')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 트랜잭션 (NFT Mint)
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const signer = await ethersProvider.getSigner()

      const { contractAddress, args, abi } = contractArgs

      const contract = new ethers.Contract(contractAddress, abi, signer)

      // mintTo 함수 호출
      const tx = await contract.mintTo(...args)
      await tx.wait()

      showSuccess(
        '🦊 MetaMask Transaction successful!',
        `Transaction Hash: ${tx.hash}\nContract: ${contractAddress}\nToken ID: ${args[1]}`
      )

      // generate new tokenId for next NFT
      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()
      const newArgs = [activeWallet.account, tokenId]

      contractArgs = { ...contractArgs, args: newArgs }
    } else {
      // Cross SDK를 사용한 트랜잭션
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
            providedFormat:
              'Plain text(string), HTML(string), JSON(key value object) are supported.',
            txTime: new Date().toISOString(),
            randomValue: uuidv4()
          }
        },
        type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
      })

      showSuccess('⚡ Cross Transaction successful!', `Response: ${JSON.stringify(resTx)}`)

      // generate new tokenId for next NFT
      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()
      const newArgs = [getFROM_ADDRESS(), tokenId]

      contractArgs = { ...contractArgs, args: newArgs }
    }
  } catch (error) {
    console.error('Error sending transaction:', error)
    showError('Transaction failed!', `Error: ${error.message}`)
  }
}

async function handleSendNative() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 Native Token 전송
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const signer = await ethersProvider.getSigner()

      const amount =
        activeWallet.chainId === 1 || activeWallet.chainId === 11155111
          ? '0.0001'
          : SEND_CROSS_AMOUNT.toString()

      const tx = await signer.sendTransaction({
        to: RECEIVER_ADDRESS,
        value: ethers.parseEther(amount)
      })

      await tx.wait()

      showSuccess(
        '🦊 MetaMask Native token send successful!',
        `Transaction Hash: ${tx.hash}\nAmount: ${amount}\nTo: ${RECEIVER_ADDRESS}`
      )
    } else {
      // Cross SDK를 사용한 Native Token 전송
      const resTx = await SendController.sendNativeToken({
        data: '0x',
        receiverAddress: RECEIVER_ADDRESS,
        sendTokenAmount:
          networkState.chainId === 1 || networkState.chainId === 11155111
            ? 0.0001
            : SEND_CROSS_AMOUNT, // in eth (not wei)
        decimals: '18',
        customData: {
          metadata:
            'You are about to send 1 CROSS to the receiver address. This is plain text formatted custom data.'
        },
        type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
      })
      showSuccess('⚡ Cross Native token send successful!', `Response: ${JSON.stringify(resTx)}`)
    }
  } catch (error) {
    console.error('Error sending native token:', error)
    showError('Native token send failed!', `Error: ${error.message}`)
  }
}

async function handleSendERC20Token() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 ERC20 Token 전송
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const signer = await ethersProvider.getSigner()

      if (!ERC20_ADDRESS || ERC20_ADDRESS === '0x') {
        showError('ERC20 contract does not exist on this network.')
        return
      }

      // ERC20 ABI (transfer 함수만 필요)
      const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)']

      const contract = new ethers.Contract(ERC20_ADDRESS, erc20Abi, signer)

      const amount = ethers.parseUnits(SEND_ERC20_AMOUNT.toString(), 18)

      const tx = await contract.transfer(RECEIVER_ADDRESS, amount)
      await tx.wait()

      showSuccess(
        '🦊 MetaMask ERC20 token send successful!',
        `Transaction Hash: ${tx.hash}\nAmount: ${SEND_ERC20_AMOUNT}\nTo: ${RECEIVER_ADDRESS}\nContract: ${ERC20_ADDRESS}`
      )

      getBalanceOfERC20({ showResult: false })
    } else {
      // Cross SDK를 사용한 ERC20 Token 전송
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
      showSuccess('⚡ Cross ERC20 token send successful!', `Response: ${JSON.stringify(resTx)}`)
      getBalanceOfERC20({ showResult: false })
    }
  } catch (error) {
    console.error('Error sending ERC20 token:', error)
    showError('ERC20 token send failed!', `Error: ${error.message}`)
  }
}

async function handleSendTransactionWithDynamicFee() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  if (!contractArgs) {
    showError('no contract args set')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 트랜잭션 (NFT Mint)
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const signer = await ethersProvider.getSigner()

      const { contractAddress, args, abi } = contractArgs

      const contract = new ethers.Contract(contractAddress, abi, signer)

      // mintTo 함수 호출
      const tx = await contract.mintTo(...args)
      await tx.wait()

      showSuccess(
        '🦊 MetaMask Transaction successful!',
        `Transaction Hash: ${tx.hash}\nContract: ${contractAddress}\nToken ID: ${args[1]}`
      )

      // generate new tokenId for next NFT
      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()
      const newArgs = [activeWallet.account, tokenId]

      contractArgs = { ...contractArgs, args: newArgs }
    } else {
      // Cross SDK를 사용한 트랜잭션
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
            providedFormat:
              'Plain text(string), HTML(string), JSON(key value object) are supported.',
            txTime: new Date().toISOString(),
            randomValue: uuidv4()
          }
        },
        type: ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
      })

      showSuccess('⚡ Cross Transaction successful!', `Response: ${JSON.stringify(resTx)}`)

      // generate new tokenId for next NFT
      const uuidHex = uuidv4().replace(/-/g, '')
      const tokenId = BigInt(`0x${uuidHex}`).toString()
      const newArgs = [getFROM_ADDRESS(), tokenId]

      contractArgs = { ...contractArgs, args: newArgs }
    }
  } catch (error) {
    console.error('Error sending transaction with dynamic fee:', error)
    showError('Transaction with dynamic fee failed!', `Error: ${error.message}`)
  }
}

async function handleSendNativeWithDynamicFee() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 Native Token 전송 (Dynamic Fee)
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const signer = await ethersProvider.getSigner()

      const tx = await signer.sendTransaction({
        to: RECEIVER_ADDRESS,
        value: ethers.parseEther(SEND_CROSS_AMOUNT.toString())
      })

      await tx.wait()

      showSuccess(
        '🦊 MetaMask Native token send with dynamic fee successful!',
        `Transaction Hash: ${tx.hash}\nAmount: ${SEND_CROSS_AMOUNT}\nTo: ${RECEIVER_ADDRESS}`
      )
    } else {
      // Cross SDK를 사용한 Native Token 전송
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
      showSuccess(
        '⚡ Cross Native token send with dynamic fee successful!',
        `Response: ${JSON.stringify(resTx)}`
      )
    }
  } catch (error) {
    console.error('Error sending native token with dynamic fee:', error)
    showError('Native token send with dynamic fee failed!', `Error: ${error.message}`)
  }
}

async function handleSendERC20TokenWithDynamicFee() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 ERC20 Token 전송 (Dynamic Fee)
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const signer = await ethersProvider.getSigner()

      if (!ERC20_ADDRESS || ERC20_ADDRESS === '0x') {
        showError('ERC20 contract does not exist on this network.')
        return
      }

      // ERC20 ABI (transfer 함수만 필요)
      const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)']

      const contract = new ethers.Contract(ERC20_ADDRESS, erc20Abi, signer)

      const amount = ethers.parseUnits(SEND_ERC20_AMOUNT.toString(), 18)

      const tx = await contract.transfer(RECEIVER_ADDRESS, amount)
      await tx.wait()

      showSuccess(
        '🦊 MetaMask ERC20 token send with dynamic fee successful!',
        `Transaction Hash: ${tx.hash}\nAmount: ${SEND_ERC20_AMOUNT}\nTo: ${RECEIVER_ADDRESS}\nContract: ${ERC20_ADDRESS}`
      )

      getBalanceOfERC20({ showResult: false })
    } else {
      // Cross SDK를 사용한 ERC20 Token 전송
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
      showSuccess(
        '⚡ Cross ERC20 token send with dynamic fee successful!',
        `Response: ${JSON.stringify(resTx)}`
      )
      getBalanceOfERC20({ showResult: false })
    }
  } catch (error) {
    console.error('Error sending ERC20 token with dynamic fee:', error)
    showError('ERC20 token send with dynamic fee failed!', `Error: ${error.message}`)
  }
}

async function getBalanceOfNative() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 잔액 조회
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const balance = await ethersProvider.getBalance(activeWallet.account)
      const balanceInEther = ethers.formatEther(balance)

      showSuccess(
        '🦊 MetaMask Native token balance!',
        `Balance: ${parseFloat(balanceInEther).toFixed(4)} ETH`
      )
    } else {
      // Cross SDK를 사용한 잔액 조회
      const balance = accountState?.balance
      showSuccess('⚡ Cross Native token balance!', `Balance: ${balance}`)
    }
  } catch (error) {
    console.error('Error getting native balance:', error)
    showError('Failed to get native balance', `Error: ${error.message}`)
  }
}

async function getBalanceOfERC20({ showResult = true } = {}) {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 ERC20 잔액 조회
      if (!ERC20_ADDRESS || ERC20_ADDRESS === '0x') {
        if (showResult) {
          showError('ERC20 contract does not exist on this network.')
        }
        return
      }

      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)

      // ERC20 ABI (balanceOf 함수만 필요)
      const erc20Abi = ['function balanceOf(address owner) view returns (uint256)']

      const contract = new ethers.Contract(ERC20_ADDRESS, erc20Abi, ethersProvider)

      const balance = await contract.balanceOf(activeWallet.account)
      const balanceFormatted = ethers.formatUnits(balance, 18)

      if (showResult) {
        showSuccess(
          '🦊 MetaMask ERC20 balance!',
          `Balance: ${parseFloat(balanceFormatted).toFixed(4)}\nContract: ${ERC20_ADDRESS}`
        )
      }
    } else {
      // Cross SDK를 사용한 ERC20 잔액 조회
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
        showSuccess(
          '⚡ Cross ERC20 balance updated!',
          `Updated erc20 balance: ${JSON.stringify(
            accountState?.tokenBalance?.find(
              token => token.address === ERC20_ADDRESS.toLowerCase()
            ),
            (key, value) => (typeof value === 'bigint' ? value.toString() : value),
            2
          )}`
        )
    }
  } catch (error) {
    console.error('Error getting ERC20 balance:', error)
    if (showResult) {
      showError('Failed to get ERC20 balance', `Error: ${error.message}`)
    }
  }
}

async function getBalanceOfNFT() {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('Please connect wallet first.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask를 사용한 NFT 잔액 조회
      if (!ERC721_ADDRESS || ERC721_ADDRESS === '0x') {
        showError('NFT contract does not exist on this network.')
        return
      }

      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)

      // ERC721 ABI (balanceOf 함수만 필요)
      const erc721Abi = ['function balanceOf(address owner) view returns (uint256)']

      const contract = new ethers.Contract(ERC721_ADDRESS, erc721Abi, ethersProvider)

      const balance = await contract.balanceOf(activeWallet.account)

      showSuccess(
        '🦊 MetaMask NFT balance!',
        `Balance: ${balance.toString()}\nContract: ${ERC721_ADDRESS}`
      )
    } else {
      // Cross SDK를 사용한 NFT 잔액 조회
      const amount = await ConnectionController.readContract({
        contractAddress: ERC721_ADDRESS,
        method: 'balanceOf',
        abi: sampleErc721ABI,
        args: [getFROM_ADDRESS()]
      })

      showSuccess('⚡ Cross NFT balance!', `Balance: ${amount}`)
    }
  } catch (error) {
    console.error('Error getting NFT balance:', error)
    showError('Failed to get NFT balance', `Error: ${error.message}`)
  }
}

// 세션 상태 확인 함수 (읽기 전용)
async function getSessionStatus() {
  try {
    if (!eip155Provider?.client?.engine) {
      showError('Session Status Error', 'Engine not available')
      return
    }

    const status = await eip155Provider.client.engine.getSessionStatus()

    showSuccess(
      'Session Status (Read Only)',
      `Total: ${status.total}, Healthy: ${status.healthy}, Disconnected: ${status.disconnected}\n\nSessions:\n${JSON.stringify(status.sessions, null, 2)}`
    )
  } catch (error) {
    console.error('Error getting session status:', error)
    showError('Session Status Error', `Error: ${error.message}`)
  }
}

// 수동 세션 삭제 테스트 함수
async function testManualSessionDeletion() {
  try {
    if (!eip155Provider?.client?.engine) {
      showError('Session Deletion Error', 'Engine not available')
      return
    }

    // 현재 세션들 가져오기
    const sessions = eip155Provider.client.session.getAll()

    if (sessions.length === 0) {
      showError('No Sessions', 'No active sessions to delete')
      return
    }

    // 첫 번째 세션 삭제 (테스트용)
    const sessionToDelete = sessions[0]
    await eip155Provider.client.engine.deleteSession({
      topic: sessionToDelete.topic,
      emitEvent: true // 이벤트를 발생시켜 UI 업데이트 트리거
    })

    showSuccess(
      'Session Deleted',
      `Manually deleted session: ${sessionToDelete.topic.substring(0, 8)}...\n\nRemaining sessions: ${sessions.length - 1}`
    )
  } catch (error) {
    console.error('Error deleting session:', error)
    showError('Session Deletion Error', `Error: ${error.message}`)
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

  // CROSSx Wallet 연결 시 지갑 표시 업데이트
  if (state.isConnected) {
    updateWalletIndicator()
  }

  // 버튼 가시성 업데이트
  updateButtonVisibility(accountState.isConnected)

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
  document.getElementById('coin-amount').textContent =
    networkState.chainId === 1 || networkState.chainId === 11155111
      ? '0.0001 ETH'
      : '1 ' + contractData[networkState?.chainId]?.coin || 'CROSS'
  document.getElementById('networkState').textContent = JSON.stringify(state, null, 2)
  document.getElementById('switch-network').textContent = networkState.caipNetwork.name
  ERC20_ADDRESS = contractData[networkState?.caipNetwork?.id]?.erc20 || ''
  ERC721_ADDRESS = contractData[networkState?.caipNetwork?.id]?.erc721 || ''
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

// 연결된 지갑 타입을 버튼에 표시하는 함수 (주황색 버튼은 UI 변경 없음)
function updateWalletIndicator() {
  // 주황색 버튼들은 지갑 타입에 관계없이 원래 UI 유지
  // 이 함수는 필요시 다른 용도로 확장 가능
}

// 버튼 표시/숨김을 관리하는 함수
function updateButtonVisibility(isConnected) {
  // 어떤 지갑이라도 연결되어 있는지 확인
  const activeWallet = getActiveWallet()
  const anyWalletConnected = !!activeWallet

  // 연결 관련 버튼들 (Connect + Auth 버튼들 포함)
  const connectButtons = [
    document.getElementById('connect-wallet'),
    document.getElementById('connect-cross-extension'),
    document.getElementById('connect-metamask-qrcode'),
    document.getElementById('connect-metamask-extension'),
    document.getElementById('authenticate-cross-extension'),
    document.getElementById('authenticate-walletconnect'),
    document.getElementById('check-cross-extension')
  ]

  // 연결 해제 버튼
  const disconnectButton = document.getElementById('disconnect-wallet')

  // 네트워크 변경 버튼
  const switchNetworkButton = document.getElementById('switch-network')

  if (anyWalletConnected) {
    // 연결됨: 연결 버튼들 숨기고, disconnect 버튼 표시
    connectButtons.forEach(button => {
      if (button) {
        button.style.display = 'none'
      }
    })

    if (disconnectButton) {
      disconnectButton.style.display = 'inline-block'
    }

    if (switchNetworkButton) {
      switchNetworkButton.style.display = 'inline-block'
      // switch-network 버튼은 그대로 유지
    }
  } else {
    // 연결 안됨: 연결 버튼들 표시하고, disconnect 버튼 숨김
    connectButtons.forEach(button => {
      if (button) {
        button.style.display = 'inline-block'
      }
    })

    if (disconnectButton) {
      disconnectButton.style.display = 'none'
    }

    if (switchNetworkButton) {
      switchNetworkButton.style.display = 'inline-block'
      // switch-network 버튼은 그대로 유지
    }
  }
}

// Button event listeners
const connectWallet = document.getElementById('connect-wallet')
connectWallet.addEventListener('click', async () => {
  if (accountState.isConnected) {
    await appkitWallet.disconnect()
  } else {
    await appkitWallet.connect('cross_wallet')
    // ✅ 연결 상태 저장
    localStorage.setItem('wallet_connected', 'true')
    localStorage.setItem('wallet_type', 'cross')
  }
})

// Cross Extension Wallet 직접 연결 버튼
const connectCrossExtension = document.getElementById('connect-cross-extension')
connectCrossExtension.addEventListener('click', async () => {
  try {
    const result = await ConnectorUtil.connectCrossExtensionWallet()

    // ✅ 연결 상태 저장
    localStorage.setItem('wallet_connected', 'true')
    localStorage.setItem('wallet_type', 'cross')

    // Extension connected
    alert('Cross Extension Wallet 연결 성공!')
  } catch (error) {
    console.error('Cross Extension Wallet 연결 실패:', error)

    // 에러 메시지 분석하여 사용자 취소 여부 확인
    const errorMessage = error?.message || String(error)
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
      alert('연결 취소됨: 사용자가 지갑 연결을 취소했습니다.')
    } else if (isTimeout) {
      alert('연결 시간 초과: 지갑 연결 요청이 시간 초과되었습니다. 다시 시도해주세요.')
    } else if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
      alert(
        '익스텐션 미설치: Cross Extension Wallet이 설치되지 않았습니다. 먼저 익스텐션을 설치해주세요.'
      )
    } else if (errorMessage.includes('customWallets에 설정되지 않았습니다')) {
      alert('설정 오류: CROSSx Wallet이 올바르게 설정되지 않았습니다. 개발자에게 문의해주세요.')
    } else {
      alert(`연결 실패: 지갑 연결 중 오류가 발생했습니다 - ${errorMessage}`)
    }
  }
})

// MetaMask QRCode 연결 버튼
const connectMetaMaskQRCode = document.getElementById('connect-metamask-qrcode')
connectMetaMaskQRCode.addEventListener('click', async () => {
  try {
    // MetaMask QR Code connection

    // WalletConnect Provider 초기화 및 연결
    if (!walletConnectProvider) {
      walletConnectProvider = await EthereumProvider.init({
        projectId: metamaskProjectId,
        chains: [1], // Ethereum Mainnet
        optionalChains: [
          11155111, // Sepolia
          crossMainnet.id, // Cross Mainnet
          crossTestnet.id, // Cross Testnet
          bscMainnet.id, // BSC Mainnet
          bscTestnet.id, // BSC Testnet
          kaiaMainnet.id, // Kaia Mainnet
          kaiaTestnet.id // Kaia Testnet
        ],
        // 커스텀 네트워크의 RPC URL 명시적으로 지정 (WalletConnect가 지원하지 않는 네트워크)
        rpcMap: {
          [crossMainnet.id]: crossMainnet.rpcUrls.default.http[0],
          [crossTestnet.id]: crossTestnet.rpcUrls.default.http[0],
          [kaiaMainnet.id]: kaiaMainnet.rpcUrls.default.http[0],
          [kaiaTestnet.id]: kaiaTestnet.rpcUrls.default.http[0]
        },
        showQrModal: true, // QR 코드 모달 표시
        qrModalOptions: {
          themeMode: 'light',
          themeVariables: {
            '--wcm-accent-color': '#F6851B'
          }
        },
        metadata: {
          name: 'Cross JS SDK Sample',
          description: 'Cross SDK for HTML with MetaMask support',
          url: 'https://to.nexus',
          icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
        }
      })
    }

    // 연결 시도
    const accounts = await walletConnectProvider.enable()

    if (accounts && accounts.length > 0) {
      // MetaMask 전역 상태에 WalletConnect 정보 저장
      metamaskProvider = walletConnectProvider
      metamaskAccount = accounts[0]

      // 네트워크 정보 가져오기
      const chainId = await walletConnectProvider.request({ method: 'eth_chainId' })
      metamaskChainId = parseInt(chainId)

      // QR Code 연결 타입 저장 (자동 재연결 시 Extension과 구분하기 위해)
      localStorage.setItem('metamask_connection_type', 'qrcode')

      // ethers provider 생성
      const ethersProvider = new ethers.BrowserProvider(walletConnectProvider)
      const balance = await ethersProvider.getBalance(metamaskAccount)
      const balanceInEther = ethers.formatEther(balance)

      alert(
        `MetaMask QR Code 연결 성공!\n\n` +
          `주소: ${metamaskAccount.slice(0, 10)}...${metamaskAccount.slice(-8)}\n` +
          `Chain ID: ${metamaskChainId}\n` +
          `잔액: ${parseFloat(balanceInEther).toFixed(4)}\n\n` +
          `이제 MetaMask 버튼들을 사용할 수 있습니다.`
      )

      // 버튼 상태 업데이트
      updateButtonVisibility(true)

      // Switch Network 버튼 텍스트 업데이트
      const switchNetworkButton = document.getElementById('switch-network')
      if (switchNetworkButton) {
        const networkName =
          availableNetworks.find(n => n.network.id === metamaskChainId)?.name ||
          `Chain ${metamaskChainId}`
        switchNetworkButton.textContent = networkName
      }

      // WalletConnect 이벤트 리스너 추가
      walletConnectProvider.on('chainChanged', newChainId => {
        const newChainIdNumber = parseInt(newChainId)
        metamaskChainId = newChainIdNumber
        // Network changed

        const networkName =
          availableNetworks.find(n => n.network.id === newChainIdNumber)?.name ||
          `Chain ${newChainIdNumber}`
        if (switchNetworkButton) {
          switchNetworkButton.textContent = networkName
        }
      })

      walletConnectProvider.on('accountsChanged', newAccounts => {
        if (newAccounts.length === 0) {
          // 연결 해제됨
          metamaskProvider = null
          metamaskAccount = null
          metamaskChainId = null
          walletConnectProvider = null
          localStorage.removeItem('metamask_connection_type')
          updateButtonVisibility(false)
          // Disconnected
        } else {
          metamaskAccount = newAccounts[0]
          // Account changed
        }
      })

      walletConnectProvider.on('disconnect', () => {
        console.log('🦊 MetaMask 연결 해제됨')
        metamaskProvider = null
        metamaskAccount = null
        metamaskChainId = null
        walletConnectProvider = null
        localStorage.removeItem('metamask_connection_type')
        updateButtonVisibility(false)
      })
    }
  } catch (error) {
    console.error('Error connecting MetaMask QR Code:', error)

    if (error.message.includes('User rejected')) {
      alert('연결이 취소되었습니다.')
    } else {
      alert(`연결 실패: ${error.message}`)
    }
  }
})

// MetaMask Extension 연결 버튼
const connectMetaMaskExtension = document.getElementById('connect-metamask-extension')
connectMetaMaskExtension.addEventListener('click', async () => {
  try {
    // MetaMask 설치 확인
    if (typeof window.ethereum === 'undefined') {
      alert(
        'MetaMask Extension이 설치되어 있지 않습니다.\n\nhttps://metamask.io 에서 MetaMask를 설치해주세요.'
      )
      return
    }

    // MetaMask provider 찾기 (여러 지갑이 설치된 경우)
    const findMetaMaskProvider = () => {
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        return window.ethereum.providers.find(
          provider => provider.isMetaMask && !provider.isCrossWallet
        )
      }
      if (window.ethereum.isMetaMask && !window.ethereum.isCrossWallet) {
        return window.ethereum
      }
      return null
    }

    const provider = findMetaMaskProvider()

    if (!provider) {
      alert(
        'MetaMask Extension을 찾을 수 없습니다.\n\n' +
          '1. MetaMask Extension을 활성화해주세요\n' +
          '2. 다른 지갑 Extension을 비활성화하고 새로고침해주세요'
      )
      return
    }

    // MetaMask Extension connection

    // MetaMask 연결 요청
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    })

    if (accounts && accounts.length > 0) {
      // Extension connected

      // 전역 상태에 MetaMask 정보 저장
      metamaskProvider = provider
      metamaskAccount = accounts[0]

      // ethers provider 생성
      const ethersProvider = new ethers.BrowserProvider(provider)

      // 네트워크 정보 가져오기
      const network = await ethersProvider.getNetwork()
      const chainId = Number(network.chainId)
      metamaskChainId = chainId

      // 잔액 조회
      const balance = await ethersProvider.getBalance(accounts[0])
      const balanceInEther = ethers.formatEther(balance)

      // Extension 연결 타입 저장 (자동 재연결 시 QR Code와 구분하기 위해)
      localStorage.setItem('metamask_connection_type', 'extension')

      alert(
        `MetaMask Extension 연결 성공!\n\n` +
          `주소: ${accounts[0].slice(0, 10)}...${accounts[0].slice(-8)}\n` +
          `Chain ID: ${chainId}\n` +
          `잔액: ${parseFloat(balanceInEther).toFixed(4)} ETH\n\n` +
          `이제 MetaMask 전용 버튼들을 사용할 수 있습니다.`
      )

      // 지갑 연결 표시 및 버튼 가시성 업데이트
      updateWalletIndicator()
      updateButtonVisibility(true)

      // Switch Network 버튼 텍스트 업데이트
      const switchNetworkButton = document.getElementById('switch-network')
      if (switchNetworkButton) {
        const networkName =
          availableNetworks.find(n => n.network.id === chainId)?.name || `Chain ${chainId}`
        switchNetworkButton.textContent = networkName
      }

      // 이벤트 리스너 중복 방지
      provider.removeAllListeners?.('accountsChanged')
      provider.removeAllListeners?.('chainChanged')

      // MetaMask 네트워크 변경 이벤트 리스너 추가
      provider.on('chainChanged', newChainId => {
        const newChainIdNumber = parseInt(newChainId, 16)
        metamaskChainId = newChainIdNumber

        // Network changed

        // Switch Network 버튼 텍스트 업데이트
        const networkName =
          availableNetworks.find(n => n.network.id === newChainIdNumber)?.name ||
          `Chain ${newChainIdNumber}`
        if (switchNetworkButton) {
          switchNetworkButton.textContent = networkName
        }
      })

      // MetaMask 계정 변경 이벤트 리스너 추가
      provider.on('accountsChanged', newAccounts => {
        if (newAccounts.length === 0) {
          // 연결 해제됨
          // Disconnected
          metamaskProvider = null
          metamaskAccount = null
          metamaskChainId = null
          updateButtonVisibility(false)
        } else {
          // 계정 변경됨
          metamaskAccount = newAccounts[0]
          // Account changed
        }
      })

      // ✅ 연결 상태 저장
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('wallet_type', 'metamask')

      // 상태 업데이트
      console.log('📊 MetaMask 연결 상태:', {
        address: accounts[0],
        chainId,
        balance: balanceInEther
      })
    }
  } catch (error) {
    console.error('MetaMask Extension 연결 실패:', error)

    const errorMessage = error?.message || String(error)
    const isUserRejection =
      errorMessage.includes('User rejected') ||
      errorMessage.includes('User denied') ||
      errorMessage.includes('rejected the request')

    if (isUserRejection) {
      alert('연결 취소됨: 사용자가 MetaMask 연결을 취소했습니다.')
    } else {
      alert(`연결 실패: ${errorMessage}`)
    }
  }
})

// Cross Extension 연결 + SIWE 인증 통합 버튼
const authenticateCrossExtension = document.getElementById('authenticate-cross-extension')
authenticateCrossExtension.addEventListener('click', async () => {
  // 버튼 상태 저장 및 비활성화
  const originalText = authenticateCrossExtension.textContent
  authenticateCrossExtension.disabled = true
  authenticateCrossExtension.textContent = 'Authenticating...'
  authenticateCrossExtension.style.opacity = '0.6'
  authenticateCrossExtension.style.cursor = 'not-allowed'

  // Cross Extension authentication started
  try {
    // ✅ SDK의 authenticateCrossExtensionWallet() 사용 (플래그 관리 포함!)
    const result = await ConnectorUtil.authenticateCrossExtensionWallet()

    if (result && result.authenticated && result.sessions && result.sessions.length > 0) {
      const session = result.sessions[0]
      const signature = session.signature
      const address = session.data.accountAddress
      const chainId = session.data.chainId
      const expiresAt = session.data.expirationTime

      // ✅ 연결 및 인증 상태 저장 (세션 포함)
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('wallet_type', 'cross')
      localStorage.setItem('has_siwx_session', 'true')

      console.log('💾 Session saved successfully')

      // 성공 모달 표시
      showSuccess(
        '🎉 SIWE 인증 성공!',
        `Cross Extension이 연결되고 SIWE 인증이 완료되었습니다!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📍 Address:\n${address}\n\n` +
          `🔗 Chain ID:\n${chainId}\n\n` +
          `✍️ Signature:\n${signature.substring(0, 20)}...${signature.substring(signature.length - 20)}\n\n` +
          `📅 Expires:\n${expiresAt || 'N/A'}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`
      )
    } else {
      showSuccess('연결 성공', 'Cross Extension이 연결되었습니다.')
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error)

    const errorMessage = error?.message || String(error)
    let title = '❌ Authentication Failed'
    let content = errorMessage

    if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
      title = '❌ User Rejected'
      content = 'You rejected the authentication request.'
    } else if (errorMessage.includes('Extension Not Installed')) {
      title = '❌ Extension Not Installed'
      content = 'Cross Extension Wallet is not installed. Please install it first.'
    } else if (errorMessage.includes('SIWE not configured')) {
      title = '❌ SIWE Not Configured'
      content = 'SIWE is not properly configured. Contact the developer.'
    }

    showError(title, content)
  } finally {
    // 버튼 상태 복구
    authenticateCrossExtension.disabled = false
    authenticateCrossExtension.textContent = originalText
    authenticateCrossExtension.style.opacity = '1'
    authenticateCrossExtension.style.cursor = 'pointer'
  }
})

// WalletConnect (QR Code) 연결 + SIWE 인증 통합 버튼
const authenticateWalletConnect = document.getElementById('authenticate-walletconnect')
authenticateWalletConnect.addEventListener('click', async () => {
  // 버튼 상태 저장 및 비활성화
  const originalText = authenticateWalletConnect.textContent
  authenticateWalletConnect.disabled = true
  authenticateWalletConnect.textContent = 'Authenticating...'
  authenticateWalletConnect.style.opacity = '0.6'
  authenticateWalletConnect.style.cursor = 'not-allowed'

  // WalletConnect authentication started
  try {
    // crossSdk.authenticateWalletConnect() 호출
    const result = await crossSdk.authenticateWalletConnect()

    if (result && typeof result === 'object' && 'authenticated' in result) {
      if (result.authenticated && result.sessions && result.sessions.length > 0) {
        const session = result.sessions[0]
        if (!session) {
          throw new Error('Session information not available')
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

        // 성공 모달 표시
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
    console.error('❌ Authentication failed:', error)

    const errorMessage = error?.message || String(error)
    let title = '❌ Authentication Failed'
    let content = errorMessage

    if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
      title = '❌ User Rejected'
      content = 'You rejected the authentication request.'
    }

    showError(title, content)
  } finally {
    // 버튼 상태 복구
    authenticateWalletConnect.disabled = false
    authenticateWalletConnect.textContent = originalText
    authenticateWalletConnect.style.opacity = '1'
    authenticateWalletConnect.style.cursor = 'pointer'
  }
})

// Cross Extension Wallet 설치 확인 버튼
const checkCrossExtension = document.getElementById('check-cross-extension')
checkCrossExtension.addEventListener('click', () => {
  const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
  // Extension status checked
  alert(`Cross Extension Wallet ${isInstalled ? '설치됨' : '설치되지 않음'}`)
})

// ============ MetaMask 전용 액션 핸들러들 ============

// MetaMask Sign Message
document.getElementById('metamask-sign-message')?.addEventListener('click', async () => {
  if (!metamaskProvider || !metamaskAccount) {
    alert('먼저 MetaMask Extension을 연결해주세요.')
    return
  }

  try {
    const message = `Hello from MetaMask! ${Date.now()}`

    const signature = await metamaskProvider.request({
      method: 'personal_sign',
      params: [message, metamaskAccount]
    })

    // Signature successful
    alert(
      `MetaMask 서명 성공!\n\n` +
        `메시지: ${message}\n` +
        `서명: ${signature.slice(0, 20)}...${signature.slice(-20)}`
    )
  } catch (error) {
    console.error('❌ MetaMask 서명 실패:', error)
    alert(`서명 실패: ${error.message}`)
  }
})

// MetaMask Send Transaction
document.getElementById('metamask-send-transaction')?.addEventListener('click', async () => {
  if (!metamaskProvider || !metamaskAccount) {
    alert('먼저 MetaMask Extension을 연결해주세요.')
    return
  }

  try {
    const txHash = await metamaskProvider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: metamaskAccount,
          to: RECEIVER_ADDRESS,
          value: ethers.parseEther('0.001').toString(16), // 0.001 ETH
          gas: '0x5208' // 21000
        }
      ]
    })

    // Transaction sent
    alert(
      `MetaMask 트랜잭션 전송 성공!\n\n` +
        `Transaction Hash: ${txHash}\n` +
        `To: ${RECEIVER_ADDRESS}\n` +
        `Value: 0.001 ETH`
    )
  } catch (error) {
    console.error('❌ MetaMask 트랜잭션 실패:', error)

    const errorMessage = error?.message || String(error)
    const isUserRejection =
      errorMessage.includes('User rejected') || errorMessage.includes('User denied')

    if (isUserRejection) {
      alert('트랜잭션 취소됨: 사용자가 트랜잭션을 취소했습니다.')
    } else {
      alert(`트랜잭션 실패: ${errorMessage}`)
    }
  }
})

// MetaMask Get Balance
document.getElementById('metamask-get-balance')?.addEventListener('click', async () => {
  if (!metamaskProvider || !metamaskAccount) {
    alert('먼저 MetaMask Extension을 연결해주세요.')
    return
  }

  try {
    const ethersProvider = new ethers.BrowserProvider(metamaskProvider)
    const balance = await ethersProvider.getBalance(metamaskAccount)
    const balanceInEther = ethers.formatEther(balance)

    // Balance retrieved
    alert(
      `MetaMask 잔액 조회 성공!\n\n` +
        `주소: ${metamaskAccount.slice(0, 10)}...${metamaskAccount.slice(-8)}\n` +
        `잔액: ${parseFloat(balanceInEther).toFixed(6)} ETH\n` +
        `Chain ID: ${metamaskChainId}`
    )
  } catch (error) {
    console.error('❌ MetaMask 잔액 조회 실패:', error)
    alert(`잔액 조회 실패: ${error.message}`)
  }
})

// ============ 통합 액션 핸들러들 (자동 지갑 감지) ============

// 통합 Send Transaction
document.getElementById('send-transaction-unified')?.addEventListener('click', async () => {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('지갑 미연결', 'CROSSx Wallet 또는 MetaMask를 먼저 연결해주세요.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask 사용
      const txHash = await activeWallet.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: activeWallet.account,
            to: RECEIVER_ADDRESS,
            value: '0x' + ethers.parseEther('0.001').toString(16), // 0.001 ETH
            gas: '0x5208' // 21000
          }
        ]
      })

      showSuccess(
        '🦊 MetaMask 트랜잭션 성공!',
        `Tx Hash: ${txHash}\nTo: ${RECEIVER_ADDRESS}\nValue: 0.001 ETH`
      )
    } else {
      // CROSSx Wallet 사용
      const result = await SendController.sendTransaction({
        to: RECEIVER_ADDRESS,
        value: ConnectionController.parseUnits('0.01', 18),
        data: '0x'
      })

      showSuccess('⚡ CROSSx Wallet 트랜잭션 성공!', `Tx Hash: ${result}\nTo: ${RECEIVER_ADDRESS}`)
    }
  } catch (error) {
    console.error('Transaction error:', error)
    showError('트랜잭션 실패!', `Error: ${error.message}`)
  }
})

// 통합 Get Balance
document.getElementById('get-balance-unified')?.addEventListener('click', async () => {
  const activeWallet = getActiveWallet()

  if (!activeWallet) {
    showError('지갑 미연결', 'CROSSx Wallet 또는 MetaMask를 먼저 연결해주세요.')
    return
  }

  try {
    if (activeWallet.type === 'metamask') {
      // MetaMask 사용
      const ethersProvider = new ethers.BrowserProvider(activeWallet.provider)
      const balance = await ethersProvider.getBalance(activeWallet.account)
      const balanceInEther = ethers.formatEther(balance)

      showSuccess(
        '🦊 MetaMask 잔액 조회 성공!',
        `주소: ${activeWallet.account.slice(0, 10)}...${activeWallet.account.slice(-8)}\n` +
          `잔액: ${parseFloat(balanceInEther).toFixed(6)} ETH\n` +
          `Chain ID: ${activeWallet.chainId}`
      )
    } else {
      // CROSSx Wallet 사용
      const balance = await ConnectionController.getBalance(activeWallet.account)
      const coin = contractData[activeWallet.chainId]?.coin || 'TOKEN'

      showSuccess(
        '⚡ CROSSx Wallet 잔액 조회 성공!',
        `주소: ${activeWallet.account}\n잔액: ${balance} ${coin}`
      )
    }
  } catch (error) {
    console.error('Balance error:', error)
    showError('잔액 조회 실패!', `Error: ${error.message}`)
  }
})

document.getElementById('toggle-theme')?.addEventListener('click', () => {
  const newTheme = themeState.themeMode === 'dark' ? 'light' : 'dark'
  crossSdk.setThemeMode(newTheme)
  themeState = { ...themeState, themeMode: newTheme }
  updateTheme(newTheme)
})

// Disconnect 버튼 이벤트 리스너
const disconnectWallet = document.getElementById('disconnect-wallet')
disconnectWallet.addEventListener('click', async () => {
  try {
    const activeWallet = getActiveWallet()

    if (!activeWallet) {
      console.log('연결된 지갑이 없습니다.')
      return
    }

    if (activeWallet.type === 'metamask') {
      // MetaMask 연결 해제
      // Disconnecting MetaMask

      // WalletConnect Provider가 있으면 disconnect 호출
      if (walletConnectProvider) {
        await walletConnectProvider.disconnect()
        walletConnectProvider = null
      }

      // MetaMask 전역 상태 초기화
      metamaskProvider = null
      metamaskAccount = null
      metamaskChainId = null

      // ✅ 연결 상태 제거 (자동 재연결 방지)
      localStorage.removeItem('wallet_connected')
      localStorage.removeItem('wallet_type')
      localStorage.removeItem('metamask_connection_type')

      // 버튼 상태 업데이트
      updateWalletIndicator()
      updateButtonVisibility(false)

      // MetaMask disconnected
      alert('MetaMask 연결이 해제되었습니다.')
    } else {
      // Cross SDK 연결 해제
      // Disconnecting CROSSx Wallet
      await appkitWallet.disconnect()

      // ✅ 연결 상태 제거 (자동 재연결 방지)
      localStorage.removeItem('wallet_connected')
      localStorage.removeItem('wallet_type')
      localStorage.removeItem('has_siwx_session')
      localStorage.removeItem('siwx_session')

      // CROSSx Wallet disconnected
    }
  } catch (error) {
    console.error('지갑 연결 해제 실패:', error)
    alert(`연결 해제 실패: ${error.message}`)
  }
})

const switchNetwork = document.getElementById('switch-network')

switchNetwork.addEventListener('click', () => {
  createNetworkModal()
})

// Action button event listeners
document.getElementById('sign-message')?.addEventListener('click', handleSignMessage)
document.getElementById('sign-typed-data-v4')?.addEventListener('click', handleSignTypedDataV4)
document.getElementById('provider-request')?.addEventListener('click', handleProviderRequest)
document.getElementById('coin-amount').textContent =
  networkState.chainId === 1 || networkState.chainId === 11155111
    ? '0.0001 ETH'
    : '1 ' + contractData[networkState?.chainId]?.coin || 'CROSS'

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

// 세션 관리 버튼 이벤트 리스너
document.getElementById('get-session-status')?.addEventListener('click', getSessionStatus)
document
  .getElementById('test-manual-session-deletion')
  ?.addEventListener('click', testManualSessionDeletion)

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
setupResultModalEvents()

// 세션 관리 초기화
initializeSessionManagement()

// MetaMask QR Code (WalletConnect) 자동 재연결
async function autoReconnectMetaMaskQRCode() {
  try {
    const connectionType = localStorage.getItem('metamask_connection_type')
    if (connectionType !== 'qrcode') {
      return // QR Code 연결이 아니면 건너뛰기
    }

    // Auto-reconnect session restoration attempt

    // WalletConnect Provider 초기화 (기존 세션 자동 복원)
    walletConnectProvider = await EthereumProvider.init({
      projectId: metamaskProjectId,
      chains: [1],
      optionalChains: [
        11155111,
        crossMainnet.id,
        crossTestnet.id,
        bscMainnet.id,
        bscTestnet.id,
        kaiaMainnet.id,
        kaiaTestnet.id
      ],
      rpcMap: {
        [crossMainnet.id]: crossMainnet.rpcUrls.default.http[0],
        [crossTestnet.id]: crossTestnet.rpcUrls.default.http[0],
        [kaiaMainnet.id]: kaiaMainnet.rpcUrls.default.http[0],
        [kaiaTestnet.id]: kaiaTestnet.rpcUrls.default.http[0]
      },
      showQrModal: false // 자동 재연결이므로 QR 모달 표시 안함
    })

    // 기존 세션이 있는지 확인
    if (!walletConnectProvider.session) {
      console.log('⏭️ 기존 WalletConnect 세션 없음')
      localStorage.removeItem('metamask_connection_type')
      return
    }

    // 세션이 있으면 계정 정보 가져오기
    const accounts = walletConnectProvider.accounts
    const chainId = await walletConnectProvider.request({ method: 'eth_chainId' })

    if (accounts && accounts.length > 0) {
      metamaskProvider = walletConnectProvider
      metamaskAccount = accounts[0]
      // chainId는 이미 16진수 문자열 (예: "0x95444")이므로 parseInt()만 사용
      metamaskChainId = parseInt(chainId)

      // Auto-reconnect chain verified

      // 이벤트 리스너 설정
      walletConnectProvider.on('chainChanged', newChainId => {
        const newChainIdNumber = parseInt(newChainId)
        metamaskChainId = newChainIdNumber
        // Network changed

        const switchNetworkButton = document.getElementById('switch-network')
        const networkName =
          availableNetworks.find(n => n.network.id === newChainIdNumber)?.name ||
          `Chain ${newChainIdNumber}`
        if (switchNetworkButton) {
          switchNetworkButton.textContent = networkName
        }
      })

      walletConnectProvider.on('accountsChanged', newAccounts => {
        if (newAccounts.length === 0) {
          metamaskProvider = null
          metamaskAccount = null
          metamaskChainId = null
          walletConnectProvider = null
          localStorage.removeItem('metamask_connection_type')
          updateButtonVisibility(false)
          // Disconnected
        } else {
          metamaskAccount = newAccounts[0]
          // Account changed
        }
      })

      walletConnectProvider.on('disconnect', () => {
        console.log('🦊 MetaMask 연결 해제됨')
        metamaskProvider = null
        metamaskAccount = null
        metamaskChainId = null
        walletConnectProvider = null
        localStorage.removeItem('metamask_connection_type')
        updateButtonVisibility(false)
      })

      // UI 업데이트
      updateButtonVisibility(true)
      const switchNetworkButton = document.getElementById('switch-network')
      if (switchNetworkButton) {
        const networkName =
          availableNetworks.find(n => n.network.id === metamaskChainId)?.name ||
          `Chain ${metamaskChainId}`
        switchNetworkButton.textContent = networkName
      }

      // Auto-reconnect successful
    }
  } catch (error) {
    // Auto-reconnect failed (ignored)
    localStorage.removeItem('metamask_connection_type')
  }
}

// MetaMask Extension 자동 재연결 (페이지 로드 시)
async function autoReconnectMetaMask() {
  try {
    // QR Code로 연결된 경우 Extension 자동 재연결 건너뛰기
    const connectionType = localStorage.getItem('metamask_connection_type')
    if (connectionType === 'qrcode') {
      console.log('⏭️ QR Code 연결 감지, Extension 자동 재연결 건너뛰기')
      return
    }

    if (typeof window.ethereum === 'undefined') return

    // MetaMask provider 찾기
    const findMetaMaskProvider = () => {
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        return window.ethereum.providers.find(
          provider => provider.isMetaMask && !provider.isCrossWallet
        )
      }
      if (window.ethereum.isMetaMask && !window.ethereum.isCrossWallet) {
        return window.ethereum
      }
      return null
    }

    // ✅ 이전 연결 상태 확인
    const wasConnected = localStorage.getItem('wallet_connected') === 'true'
    const walletType = localStorage.getItem('wallet_type')

    if (!wasConnected || walletType !== 'metamask') {
      console.log('⏭️ Skipping auto-reconnect - not previously connected as MetaMask')
      return
    }

    const provider = findMetaMaskProvider()
    if (!provider) {
      console.log('⏭️ MetaMask provider not found')
      return
    }

    // eth_accounts는 이미 연결된 계정만 반환 (사용자 승인 불필요)
    const accounts = await provider.request({ method: 'eth_accounts' })

    if (accounts && accounts.length > 0) {
      // Auto-reconnecting extension

      // 전역 상태에 MetaMask 정보 저장
      metamaskProvider = provider
      metamaskAccount = accounts[0]

      // ethers provider 생성
      const ethersProvider = new ethers.BrowserProvider(provider)

      // 네트워크 정보 가져오기
      const network = await ethersProvider.getNetwork()
      const chainId = Number(network.chainId)
      metamaskChainId = chainId

      // 이벤트 리스너 중복 방지
      provider.removeAllListeners?.('accountsChanged')
      provider.removeAllListeners?.('chainChanged')

      // MetaMask 네트워크 변경 이벤트 리스너 추가
      provider.on('chainChanged', newChainId => {
        const newChainIdNumber = parseInt(newChainId, 16)
        metamaskChainId = newChainIdNumber
        // Network changed

        // Switch Network 버튼 텍스트 업데이트
        const switchNetworkButton = document.getElementById('switch-network')
        const networkName =
          availableNetworks.find(n => n.network.id === newChainIdNumber)?.name ||
          `Chain ${newChainIdNumber}`
        if (switchNetworkButton) {
          switchNetworkButton.textContent = networkName
        }
      })

      // MetaMask 계정 변경 이벤트 리스너 추가
      provider.on('accountsChanged', newAccounts => {
        // Account changed
        if (newAccounts.length > 0) {
          metamaskAccount = newAccounts[0]
        } else {
          metamaskAccount = null
          metamaskProvider = null
          metamaskChainId = null
          localStorage.removeItem('metamask_connection_type')
          updateButtonVisibility(false)
        }
        updateWalletIndicator()
      })

      // UI 업데이트
      updateWalletIndicator()
      updateButtonVisibility(true)

      // Switch Network 버튼 텍스트 업데이트
      const switchNetworkButton = document.getElementById('switch-network')
      if (switchNetworkButton) {
        const networkName =
          availableNetworks.find(n => n.network.id === chainId)?.name || `Chain ${chainId}`
        switchNetworkButton.textContent = networkName
      }

      // Extension 연결 타입 저장
      localStorage.setItem('metamask_connection_type', 'extension')

      // Extension auto-reconnect successful
    }
  } catch (error) {
    // Extension auto-reconnect failed (ignored)
  }
}

// Initialize contract args when state changes
crossSdk.subscribeAccount(() => {
  setTimeout(initializeContractArgs, 100)
})

// 페이지 로드 시 초기 버튼 상태 설정 및 MetaMask 자동 재연결
window.addEventListener('DOMContentLoaded', () => {
  // 초기에는 연결되지 않은 상태로 버튼 설정
  updateButtonVisibility(false)

  // MetaMask 자동 재연결 시도
  setTimeout(async () => {
    // 연결 타입에 따라 적절한 재연결 함수 실행
    const connectionType = localStorage.getItem('metamask_connection_type')
    if (connectionType === 'qrcode') {
      await autoReconnectMetaMaskQRCode()
    } else if (connectionType === 'extension') {
      await autoReconnectMetaMask()
    }
  }, 500) // DOM이 완전히 로드된 후 실행
})

crossSdk.subscribeNetwork(() => {
  setTimeout(initializeContractArgs, 100)
})
