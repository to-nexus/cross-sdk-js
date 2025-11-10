/**
 * Cross SDK CDN Sample Application
 * Vanilla JavaScript sample using Cross SDK via CDN
 */
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
// ethers import from CDN
import { ethers } from 'https://cdn.skypack.dev/ethers@5.7.2'
import { v4 as uuidv4 } from 'https://cdn.skypack.dev/uuid@9.0.0'

// SDK 로딩을 기다리는 함수
function waitForSDK() {
  return new Promise(resolve => {
    if (window.CrossSdk) {
      resolve(window.CrossSdk)
    } else {
      const checkSDK = () => {
        if (window.CrossSdk) {
          resolve(window.CrossSdk)
        } else {
          setTimeout(checkSDK, 100)
        }
      }
      checkSDK()
    }
  })
}

// SDK 로딩 후 초기화
async function initializeApp() {
  try {
    console.log('Waiting for SDK to load...')
    const CrossSdk = await waitForSDK()
    console.log('SDK loaded successfully:', CrossSdk)

    // CDN SDK에서 필요한 함수들을 import
    const {
      initCrossSdkWithParams,
      useAppKitWallet,
      crossMainnet,
      crossTestnet,
      bscMainnet,
      bscTestnet,
      kaiaMainnet,
      kaiaTestnet,
      etherMainnet,
      etherTestnet,
      AccountController,
      ConnectionController,
      ConstantsUtil,
      SendController,
      sdkVersion
    } = CrossSdk

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

    const metadata = {
      name: 'Cross SDK',
      description: 'Cross SDK for HTML',
      url: 'https://to.nexus',
      icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
    }

    // Your unique project id provided by Cross Team. If you don't have one, please contact us.
    const projectId = '0979fd7c92ec3dbd8e78f433c3e5a523'
    // Redirect URL to return to after wallet app interaction
    const redirectUrl = window.location.href

    // SDK 초기화 with SIWX (이제 SDK가 기본 구현 제공!)
    const crossSdk = initCrossSdkWithParams({
      projectId,
      redirectUrl,
      metadata,
      themeMode: 'light',
      defaultNetwork: crossTestnet,
      // ⚠️ 개발/데모용: 클라이언트에서 랜덤 nonce 생성 (보안 취약!)
      // siwx: window.CrossSdk.createDefaultSIWXConfig({
      //   statement: 'Sign in with your wallet to Cross SDK Sample App'
      // })

      // ✅ 프로덕션 권장: 백엔드에서 nonce 생성 및 서명 검증
      siwx: window.CrossSdk.createDefaultSIWXConfig({
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
              Math.random().toString(36).substring(2, 15) +
              Math.random().toString(36).substring(2, 15)
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
            console.log('✅ SIWX Session (save to backend in production):', {
              address: session.data.accountAddress,
              chainId: session.data.chainId,
              nonce: session.data.nonce,
              signature: session.signature.substring(0, 20) + '...',
              expiresAt: session.data.expirationTime
            })
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

            // 데모용: localStorage에서 조회
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
            return []
          } catch (error) {
            console.error('Failed to get sessions:', error)
            return []
          }
        }
      })
    })

    const appkitWallet = useAppKitWallet()

    // 사용 가능한 네트워크 리스트
    const availableNetworks = [
      { id: 'cross-mainnet', name: 'Cross Mainnet', network: crossMainnet },
      { id: 'cross-testnet', name: 'Cross Testnet', network: crossTestnet },
      { id: 'bsc-mainnet', name: 'BSC Mainnet', network: bscMainnet },
      { id: 'bsc-testnet', name: 'BSC Testnet', network: bscTestnet },
      { id: 'kaia-mainnet', name: 'Kaia Mainnet', network: kaiaMainnet },
      { id: 'kaia-testnet', name: 'Kaia Testnet', network: kaiaTestnet },
      { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', network: etherMainnet },
      { id: 'ethereum-testnet', name: 'Ethereum Testnet', network: etherTestnet }
    ]

    // Contract addresses and constants (초기값은 Cross Testnet 사용)
    const ERC20_ADDRESS = contractData[612044].erc20
    const ERC20_DECIMALS = 18
    const ERC721_ADDRESS = contractData[612044].erc721
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

    // MetaMask 관련 변수들
    let metamaskProvider = null
    let metamaskAddress = null
    let metamaskChainId = null
    let isMetaMaskExtensionInstalled = false

    // 세션 관리 관련 변수들
    let isPageActive = true
    let lastActiveTime = Date.now()

    // MetaMask provider 찾기 (multiple extensions support)
    function findMetaMaskProvider() {
      if (typeof window.ethereum === 'undefined') {
        return null
      }

      // Single provider case
      if (window.ethereum.isMetaMask && !window.ethereum.providers) {
        return window.ethereum
      }

      // Multiple providers case
      if (window.ethereum.providers) {
        return window.ethereum.providers.find(p => p.isMetaMask) || null
      }

      return null
    }

    // 현재 활성화된 지갑 감지
    function getActiveWallet() {
      if (metamaskProvider && metamaskAddress) {
        return 'metamask'
      }
      if (accountState?.isConnected) {
        return 'cross'
      }
      return null
    }

    // MetaMask Extension 설치 확인
    function checkMetaMaskExtension() {
      const provider = findMetaMaskProvider()
      isMetaMaskExtensionInstalled = provider !== null
      return isMetaMaskExtensionInstalled
    }

    // 현재 네트워크 이름 가져오기
    function getCurrentNetworkName() {
      const activeWallet = getActiveWallet()

      if (activeWallet === 'metamask' && metamaskChainId) {
        // MetaMask의 경우 chainId로 네트워크 찾기
        const networkInfo = availableNetworks.find(n => n.network.id === metamaskChainId)
        return networkInfo ? networkInfo.name : `Network ${metamaskChainId}`
      } else if (activeWallet === 'cross') {
        // Cross SDK의 경우
        return networkState.caipNetwork?.name || 'Switch Network'
      }

      return 'Switch Network'
    }

    // 스위치 네트워크 버튼 텍스트 업데이트
    function updateSwitchNetworkButton() {
      const switchNetworkBtn = document.getElementById('switch-network')
      if (switchNetworkBtn) {
        switchNetworkBtn.textContent = getCurrentNetworkName()
      }
    }

    // 버튼 가시성 및 상태 업데이트 함수
    function updateButtonVisibility() {
      const activeWallet = getActiveWallet()
      const isConnected = activeWallet !== null

      // 연결 관련 버튼들
      const connectCrossQR = document.getElementById('connect-cross-qr')
      const connectCrossExtension = document.getElementById('connect-cross-extension')
      const connectMetaMaskExtension = document.getElementById('connect-metamask-extension')
      const disconnectWallet = document.getElementById('disconnect-wallet')
      const switchNetwork = document.getElementById('switch-network')

      if (isConnected) {
        // 연결된 상태: 모든 연결 버튼 숨기고 disconnect 버튼 표시
        if (connectCrossQR) connectCrossQR.style.display = 'none'
        if (connectCrossExtension) connectCrossExtension.style.display = 'none'
        if (connectMetaMaskExtension) connectMetaMaskExtension.style.display = 'none'
        if (disconnectWallet) {
          disconnectWallet.style.display = 'inline-block'
          disconnectWallet.textContent = `🔓 Disconnect (${activeWallet === 'metamask' ? 'MetaMask' : 'CROSSx'})`
        }
        if (switchNetwork) switchNetwork.style.display = 'inline-block'

        // 네트워크 버튼 텍스트 업데이트
        updateSwitchNetworkButton()
      } else {
        // 연결되지 않은 상태: 연결 버튼들 표시
        if (connectCrossQR) connectCrossQR.style.display = 'inline-block'
        if (connectCrossExtension) connectCrossExtension.style.display = 'inline-block'
        if (connectMetaMaskExtension) connectMetaMaskExtension.style.display = 'inline-block'
        if (disconnectWallet) disconnectWallet.style.display = 'none'
        if (switchNetwork) switchNetwork.style.display = 'none'

        // Extension 버튼 상태 업데이트
        updateExtensionButtonStates()
      }
    }

    // Extension 버튼들 상태 업데이트 함수
    function updateExtensionButtonStates() {
      // Cross Extension 버튼
      const connectCrossExtension = document.getElementById('connect-cross-extension')
      if (connectCrossExtension && window.CrossSdk?.ConnectorUtil) {
        try {
          const isCrossInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()
          connectCrossExtension.disabled = !isCrossInstalled
          connectCrossExtension.title = isCrossInstalled
            ? 'Cross Extension에 연결'
            : 'Cross Extension이 설치되지 않았습니다'
          connectCrossExtension.style.opacity = isCrossInstalled ? '1' : '0.6'
          connectCrossExtension.textContent = isCrossInstalled
            ? 'Connect Cross Extension ✅'
            : 'Connect Cross Extension ❌'
        } catch (error) {
          console.log('SDK not ready for extension check:', error.message)
        }
      }

      // MetaMask Extension 버튼
      const connectMetaMaskExtension = document.getElementById('connect-metamask-extension')
      if (connectMetaMaskExtension) {
        const isMetaMaskInstalled = checkMetaMaskExtension()
        connectMetaMaskExtension.disabled = !isMetaMaskInstalled
        connectMetaMaskExtension.title = isMetaMaskInstalled
          ? 'MetaMask Extension에 연결'
          : 'MetaMask Extension이 설치되지 않았습니다'
        connectMetaMaskExtension.style.opacity = isMetaMaskInstalled ? '1' : '0.6'
        connectMetaMaskExtension.textContent = isMetaMaskInstalled
          ? 'Connect MetaMask Extension ✅'
          : 'Connect MetaMask Extension ❌'
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
      console.log('📱 [CDN] Page focused - checking session status')
      isPageActive = true
      lastActiveTime = Date.now()

      // 세션 상태 확인 (cleanup 수행)
      if (accountState?.isConnected) {
        checkWalletConnectionStatus(true)
          .then(isActive => {
            if (!isActive) {
              console.log('📱 [CDN] Session is no longer active, updating UI')
              // 세션이 끊어진 경우 UI 업데이트를 위해 강제로 상태 갱신
              // 실제 disconnect는 SDK 내부에서 처리됨
            }
          })
          .catch(error => {
            console.error('📱 [CDN] Error during session check:', error)
          })
      }
    }

    function handlePageBlur() {
      console.log('📱 [CDN] Page blurred')
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

        console.log('📱 [CDN] Session management initialized')
      }
    }

    // 네트워크 선택 팝업 생성 함수
    function createNetworkModal() {
      const modal = document.getElementById('network-modal')
      const networkList = document.getElementById('network-list')
      const activeWallet = getActiveWallet()

      // 기존 네트워크 리스트 초기화
      networkList.innerHTML = ''

      // 현재 네트워크 ID 결정
      let currentNetworkId
      if (activeWallet === 'metamask') {
        currentNetworkId = metamaskChainId
      } else {
        currentNetworkId = networkState?.caipNetwork?.id
      }

      // 네트워크 리스트 생성
      availableNetworks.forEach(networkInfo => {
        const networkItem = document.createElement('div')
        const isCurrentNetwork = currentNetworkId === networkInfo.network.id

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
              if (activeWallet === 'metamask') {
                // MetaMask Extension: wallet_switchEthereumChain 사용
                const chainIdHex = `0x${networkInfo.network.id.toString(16)}`
                try {
                  await metamaskProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIdHex }]
                  })
                  // 네트워크 변경 후 버튼 텍스트 업데이트
                  metamaskChainId = networkInfo.network.id
                  updateSwitchNetworkButton()
                  closeNetworkModal()
                } catch (switchError) {
                  // 네트워크가 없는 경우 추가
                  if (switchError.code === 4902) {
                    await metamaskProvider.request({
                      method: 'wallet_addEthereumChain',
                      params: [
                        {
                          chainId: chainIdHex,
                          chainName: networkInfo.name,
                          nativeCurrency: {
                            name: networkInfo.network.nativeCurrency.symbol,
                            symbol: networkInfo.network.nativeCurrency.symbol,
                            decimals: networkInfo.network.nativeCurrency.decimals
                          },
                          rpcUrls: [networkInfo.network.rpcUrls.default.http[0]],
                          blockExplorerUrls: networkInfo.network.blockExplorers?.default?.url
                            ? [networkInfo.network.blockExplorers.default.url]
                            : []
                        }
                      ]
                    })
                    // 네트워크 변경 후 버튼 텍스트 업데이트
                    metamaskChainId = networkInfo.network.id
                    updateSwitchNetworkButton()
                    closeNetworkModal()
                  } else {
                    throw switchError
                  }
                }
              } else {
                // Cross SDK: 기존 로직
                await crossSdk.switchNetwork(networkInfo.network)
                closeNetworkModal()
              }
            } catch (error) {
              console.error('Network switch failed:', error)
              alert(`Network switch failed: ${error.message}`)
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
        nexusLogo.src = mode === 'dark' ? './nexus-logo-white.png' : 'nexus-logo.png'
      }
    }

    // MetaMask 연결 함수들
    async function handleConnectMetaMaskExtension() {
      try {
        const provider = findMetaMaskProvider()
        if (!provider) {
          alert('❌ MetaMask Extension이 설치되지 않았습니다.')
          return
        }

        // Request accounts
        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        metamaskAddress = accounts[0]
        metamaskProvider = provider

        // Get chain ID
        const chainIdHex = await provider.request({ method: 'eth_chainId' })
        metamaskChainId = parseInt(chainIdHex, 16)

        // Set up event listeners (중복 방지를 위해 removeAllListeners)
        provider.removeAllListeners('accountsChanged')
        provider.removeAllListeners('chainChanged')

        provider.on('accountsChanged', accounts => {
          console.log('MetaMask Extension accounts changed:', accounts)
          if (accounts.length > 0) {
            metamaskAddress = accounts[0]
          } else {
            metamaskAddress = null
            metamaskProvider = null
            metamaskChainId = null
          }
          updateButtonVisibility()
          updateSwitchNetworkButton()
        })

        provider.on('chainChanged', chainIdHex => {
          console.log('MetaMask Extension chain changed:', chainIdHex)
          metamaskChainId = parseInt(chainIdHex, 16)
          updateButtonVisibility()
          updateSwitchNetworkButton()
        })

        alert(`✅ MetaMask Extension 연결 성공!\n\n주소: ${metamaskAddress}`)
        updateButtonVisibility()
        updateSwitchNetworkButton()
      } catch (error) {
        console.error('MetaMask Extension connection failed:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          alert('❌ 연결 취소됨\n\n사용자가 MetaMask 연결을 취소했습니다.')
        } else {
          alert(`❌ MetaMask Extension 연결 실패: ${errorMessage}`)
        }
      }
    }

    async function disconnectWallet() {
      try {
        const activeWallet = getActiveWallet()

        if (activeWallet === 'metamask') {
          // MetaMask Extension 연결 해제
          metamaskProvider = null
          metamaskAddress = null
          metamaskChainId = null
          alert('✅ MetaMask Extension 연결이 해제되었습니다.')
        } else {
          // Cross SDK 연결 해제
          await appkitWallet.disconnect()
          alert('✅ CROSSx Wallet 연결이 해제되었습니다.')
        }

        updateButtonVisibility()
      } catch (error) {
        console.error('Wallet disconnect failed:', error)
        alert(`❌ 연결 해제 실패: ${error.message}`)
      }
    }

    // Action functions
    async function handleSignMessage() {
      const activeWallet = getActiveWallet()
      if (!activeWallet) {
        alert('Please connect wallet first.')
        return
      }

      try {
        const message = `Hello, world! ${Date.now()}`
        let signedMessage

        if (activeWallet === 'metamask') {
          // MetaMask Extension: ethers.js 사용
          const provider = new ethers.providers.Web3Provider(metamaskProvider)
          const signer = provider.getSigner()
          signedMessage = await signer.signMessage(message)
        } else {
          // Cross SDK
          signedMessage = await ConnectionController.signMessage({
            message,
            customData: {
              metadata: 'This is metadata for signed message'
            }
          })
        }

        alert(`✅ Message signed successfully!\n\nSignature: ${signedMessage}`)
      } catch (error) {
        console.error('Error signing message:', error)
        alert(`❌ Failed to sign message: ${error.message}`)
      }
    }

    // Universal EIP-712 signing using server-provided typed data (Cross SDK only)
    async function handleSignTypedDataV4() {
      if (!accountState.isConnected) {
        alert('This feature is only available with Cross Wallet.')
        return
      }

      // Get current chain ID for the fallback data
      const currentChainId =
        typeof networkState.chainId === 'string'
          ? parseInt(networkState.chainId, 10)
          : networkState.chainId || 1

      // Fallback typed data for when API fails
      const fallbackTypedData = {
        domain: {
          name: 'Example',
          version: '1',
          chainId: currentChainId,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
        },
        message: {
          contents: 'hello'
        },
        primaryType: 'Ping',
        types: {
          Ping: [{ name: 'contents', type: 'string' }]
        }
      }

      try {
        let paramsData
        let apiData = null
        let usingFallback = false

        try {
          console.log('Requesting typed data from API...')
          const FROM_ADDRESS = getFROM_ADDRESS()

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

        // Use the universal signTypedDataV4 method
        const signature = await ConnectionController.signTypedDataV4(paramsData, {
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

        if (!signature) {
          alert('Signature is undefined')
          return
        }

        console.log('Signature result:', signature)

        // Show detailed results
        if (usingFallback) {
          alert(`✅ Signature successful!

🔑 Signature: ${signature}
⚠️ Using Fallback Data (API unavailable)
🔗 Primary Type: ${paramsData.primaryType}
⛓️ Chain ID: ${paramsData.domain.chainId}
📋 Contract: ${paramsData.domain.verifyingContract}

Check console for full details.`)
        } else {
          alert(`✅ Signature successful!

🔑 Signature: ${signature}
📝 Hash: ${apiData.data.hash}
🆔 UUID: ${apiData.data.uuid}
🔗 Primary Type: ${paramsData.primaryType}
⛓️ Chain ID: ${paramsData.domain.chainId}
📋 Contract: ${paramsData.domain.verifyingContract}

Check console for full details.`)
        }
      } catch (error) {
        console.error('Error in handleSignTypedDataV4:', error)
        alert(`❌ Error: ${error.message}`)
      }
    }

    // Cross SDK only
    async function handleProviderRequest() {
      if (!accountState.isConnected) {
        alert('This feature is only available with Cross Wallet.')
        return
      }

      try {
        const result = await eip155Provider.request({
          method: 'eth_blockNumber',
          params: []
        })
        alert(`eth_blockNumber: ${result}`)
      } catch (error) {
        console.error('Error requesting provider:', error)
        alert('Failed to request provider')
      }
    }

    // Cross SDK only
    async function handleSendTransaction() {
      if (!accountState.isConnected) {
        alert('This feature is only available with Cross Wallet.')
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
              providedFormat:
                'Plain text(string), HTML(string), JSON(key value object) are supported.',
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
      const activeWallet = getActiveWallet()

      if (!activeWallet) {
        alert('Please connect wallet first.')
        return
      }

      try {
        if (activeWallet === 'metamask') {
          // MetaMask Extension: ethers.js v5 사용
          const amount =
            metamaskChainId === 1 || metamaskChainId === 11155111 ? 0.0001 : SEND_CROSS_AMOUNT
          const valueInWei = ethers.utils.parseEther(amount.toString())

          const txHash = await metamaskProvider.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: metamaskAddress,
                to: RECEIVER_ADDRESS,
                value: `0x${valueInWei.toHexString().slice(2)}`,
                data: '0x'
              }
            ]
          })

          alert(`✅ MetaMask Native 전송 성공!\n\nTx Hash: ${txHash}`)
        } else {
          // Cross SDK
          const resTx = await SendController.sendNativeToken({
            data: '0x',
            receiverAddress: RECEIVER_ADDRESS,
            sendTokenAmount:
              networkState.caipNetwork.chainId === 1 ||
              networkState.caipNetwork.chainId === 11155111
                ? 0.0001
                : SEND_CROSS_AMOUNT,
            decimals: '18',
            customData: {
              metadata:
                'You are about to send 1 CROSS to the receiver address. This is plain text formatted custom data.'
            },
            type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
          })
          alert(`✅ Cross Native 전송 성공!\n\nResponse: ${JSON.stringify(resTx)}`)
        }
      } catch (error) {
        console.error('Error sending native token:', error)
        alert(`❌ Failed to send native token: ${error.message}`)
      }
    }

    async function handleSendERC20Token() {
      const activeWallet = getActiveWallet()

      if (!activeWallet) {
        alert('Please connect wallet first.')
        return
      }

      try {
        if (activeWallet === 'metamask') {
          // MetaMask Extension: ethers.js v5 사용
          const provider = new ethers.providers.Web3Provider(metamaskProvider)
          const signer = provider.getSigner()
          const erc20Contract = new ethers.Contract(ERC20_ADDRESS, sampleErc20ABI, signer)

          const amountInWei = ethers.utils.parseUnits(SEND_ERC20_AMOUNT.toString(), 18)
          const tx = await erc20Contract.transfer(RECEIVER_ADDRESS, amountInWei)
          const receipt = await tx.wait()

          alert(`✅ MetaMask ERC20 전송 성공!\n\nTx Hash: ${receipt.transactionHash}`)
          getBalanceOfERC20({ showResult: false })
        } else {
          // Cross SDK
          const resTx = await SendController.sendERC20Token({
            receiverAddress: RECEIVER_ADDRESS,
            contractAddress: getERC20CAIPAddress(),
            sendTokenAmount: SEND_ERC20_AMOUNT,
            decimals: '18',
            customData: {
              metadata: `<DOCTYPE html><html><head><title>Game Developer can add custom data to the transaction</title></head><body><h1>Game Developer can add custom data to the transaction</h1><p>This is a HTML text formatted custom data.</p></body></html>`
            },
            type: ConstantsUtil.TRANSACTION_TYPE.LEGACY
          })
          alert(`✅ Cross ERC20 전송 성공!\n\nResponse: ${JSON.stringify(resTx)}`)
          getBalanceOfERC20({ showResult: false })
        }
      } catch (error) {
        console.error('Error sending ERC20 token:', error)
        alert(`❌ Failed to send ERC20 token: ${error.message}`)
      }
    }

    // Cross SDK only
    async function handleSendTransactionWithDynamicFee() {
      if (!accountState.isConnected) {
        alert('This feature is only available with Cross Wallet.')
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
              providedFormat:
                'Plain text(string), HTML(string), JSON(key value object) are supported.',
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

    // Cross SDK only
    async function handleSendNativeWithDynamicFee() {
      if (!accountState.isConnected) {
        alert('This feature is only available with Cross Wallet.')
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

    // Cross SDK only
    async function handleSendERC20TokenWithDynamicFee() {
      if (!accountState.isConnected) {
        alert('This feature is only available with Cross Wallet.')
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
      const activeWallet = getActiveWallet()

      if (!activeWallet) {
        alert('Please connect wallet first.')
        return
      }

      try {
        if (activeWallet === 'metamask') {
          // MetaMask Extension: ethers.js v5 사용
          const provider = new ethers.providers.Web3Provider(metamaskProvider)
          const balance = await provider.getBalance(metamaskAddress)
          const balanceInEth = ethers.utils.formatEther(balance)

          alert(`✅ MetaMask Native 잔액!\n\nBalance: ${balanceInEth} ETH`)
        } else {
          // Cross SDK
          const balance = accountState?.balance
          alert(`✅ Cross Native 잔액!\n\nBalance: ${balance}`)
        }
      } catch (error) {
        console.error('Error getting native balance:', error)
        alert(`❌ Failed to get native balance: ${error.message}`)
      }
    }

    async function getBalanceOfERC20({ showResult = true } = {}) {
      const activeWallet = getActiveWallet()

      if (!activeWallet) {
        alert('Please connect wallet first.')
        return
      }

      try {
        if (activeWallet === 'metamask') {
          // MetaMask Extension: ethers.js v5 사용
          const provider = new ethers.providers.Web3Provider(metamaskProvider)
          const erc20Contract = new ethers.Contract(ERC20_ADDRESS, sampleErc20ABI, provider)

          const balance = await erc20Contract.balanceOf(metamaskAddress)
          const balanceFormatted = ethers.utils.formatUnits(balance, 18)

          if (showResult) {
            alert(
              `✅ MetaMask ERC20 잔액!\n\nBalance: ${balanceFormatted} tokens\nContract: ${ERC20_ADDRESS}`
            )
          }
        } else {
          // Cross SDK
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
              `✅ Cross ERC20 잔액!\n\n${JSON.stringify(
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
        alert(`❌ Failed to get ERC20 balance: ${error.message}`)
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

    // 세션 상태 확인 함수 (읽기 전용)
    async function getSessionStatus() {
      try {
        if (!eip155Provider?.client?.engine) {
          alert('❌ Session Status Error\n\nEngine not available')
          return
        }

        const status = await eip155Provider.client.engine.getSessionStatus()

        alert(`✅ Session Status (Read Only)

📊 Total: ${status.total}
💚 Healthy: ${status.healthy}
💔 Disconnected: ${status.disconnected}

📋 Sessions:
${JSON.stringify(status.sessions, null, 2)}`)
      } catch (error) {
        console.error('Error getting session status:', error)
        alert(`❌ Session Status Error\n\nError: ${error.message}`)
      }
    }

    // 수동 세션 삭제 테스트 함수
    async function testManualSessionDeletion() {
      try {
        if (!eip155Provider?.client?.engine) {
          alert('❌ Session Deletion Error\n\nEngine not available')
          return
        }

        // 현재 세션들 가져오기
        const sessions = eip155Provider.client.session.getAll()

        if (sessions.length === 0) {
          alert('❌ No Sessions\n\nNo active sessions to delete')
          return
        }

        // 첫 번째 세션 삭제 (테스트용)
        const sessionToDelete = sessions[0]
        await eip155Provider.client.engine.deleteSession({
          topic: sessionToDelete.topic,
          emitEvent: true // 이벤트를 발생시켜 UI 업데이트 트리거
        })

        alert(`✅ Session Deleted

🗑️ Manually deleted session: ${sessionToDelete.topic.substring(0, 8)}...

📊 Remaining sessions: ${sessions.length - 1}`)
      } catch (error) {
        console.error('Error deleting session:', error)
        alert(`❌ Session Deletion Error\n\nError: ${error.message}`)
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
      // connect-wallet 버튼 텍스트 안전하게 업데이트
      const connectWalletBtn = document.getElementById('connect-wallet')
      if (connectWalletBtn) {
        connectWalletBtn.textContent = accountState.isConnected ? 'Connected' : 'Connect Wallet'
      }

      // 버튼 가시성 업데이트
      updateButtonVisibility()

      // 주소가 변경되었을 때만 토큰 잔액을 가져옵니다
      if (accountState.caipAddress && accountState.caipAddress !== previousCaipAddress) {
        previousCaipAddress = accountState.caipAddress
        const fetchTokenBalance = async () => {
          try {
            await AccountController.fetchTokenBalance()
            console.log(
              'Token balance fetched successfully for new address:',
              accountState.caipAddress
            )
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

      // switch-network 버튼 텍스트 업데이트 (Cross Wallet용)
      updateSwitchNetworkButton()
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
    console.log('🔧 Setting up button event listeners...')

    // Cross QR Code 연결
    const connectCrossQRBtn = document.getElementById('connect-cross-qr')
    console.log('Connect Cross QR button:', connectCrossQRBtn)

    connectCrossQRBtn?.addEventListener('click', async () => {
      console.log('🔘 Connect Cross QR button clicked!')
      try {
        await appkitWallet.connect('cross_wallet')
      } catch (error) {
        console.error('Cross QR connection failed:', error)
        alert(`❌ CROSSx 연결 실패: ${error.message}`)
      }
    })

    // Cross Extension 연결
    document.getElementById('connect-cross-extension')?.addEventListener('click', async () => {
      console.log('🔘 Connect Cross Extension button clicked!')
      try {
        const result = await window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()
        alert(`✅ Cross Extension 연결 성공!\n\n주소: ${result.address}`)
        updateButtonVisibility()
        updateSwitchNetworkButton()
      } catch (error) {
        console.error('Cross Extension connection failed:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        const isUserRejection =
          errorMessage.includes('User rejected') ||
          errorMessage.includes('User denied') ||
          errorMessage.includes('cancelled')
        if (isUserRejection) {
          alert('❌ 연결 취소됨\n\n사용자가 지갑 연결을 취소했습니다.')
        } else {
          alert(`❌ 연결 실패: ${errorMessage}`)
        }
      }
    })

    // MetaMask Extension 연결
    document
      .getElementById('connect-metamask-extension')
      ?.addEventListener('click', handleConnectMetaMaskExtension)

    // Cross Extension 연결 + SIWE 인증 통합
    document.getElementById('authenticate-cross-extension')?.addEventListener('click', async () => {
      const button = document.getElementById('authenticate-cross-extension')
      if (!button) return

      // 버튼 상태 저장 및 비활성화
      const originalText = button.textContent
      button.disabled = true
      button.textContent = 'Authenticating...'
      button.style.opacity = '0.6'
      button.style.cursor = 'not-allowed'

      console.log('🔐 Starting Cross Extension authentication...')
      try {
        // 1. Extension 연결 시작
        const connectPromise = window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet().catch(
          error => {
            console.error('❌ Connection failed:', error)
            throw error
          }
        )

        // 2. 연결 상태 감지를 위한 Promise
        const waitForConnection = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout - address not set after 30 seconds'))
          }, 30000)

          const unsubscribe = window.CrossSdk.AccountController.subscribeKey('address', address => {
            if (address) {
              clearTimeout(timeout)
              unsubscribe()
              console.log('✅ Address detected:', address)
              resolve(address)
            }
          })
        })

        // 3. 연결과 상태 감지 동시 실행
        await Promise.all([connectPromise, waitForConnection])

        console.log('🔗 Extension connected, checking connection state...')

        // 4. 연결 상태 확인
        const caipAddress = window.CrossSdk.ChainController.getActiveCaipAddress()
        const activeNetwork = window.CrossSdk.ChainController.getActiveCaipNetwork()

        if (!caipAddress || !activeNetwork) {
          throw new Error('Connection state not properly initialized')
        }

        console.log('📍 Connection state verified:', {
          caipAddress,
          network: activeNetwork.caipNetworkId
        })

        // 5. SIWE 직접 처리
        const siwx = window.CrossSdk.OptionsController.state.siwx
        if (!siwx) {
          throw new Error('SIWE not configured in SDK')
        }

        // 6. SIWE 메시지 생성
        const address = window.CrossSdk.CoreHelperUtil.getPlainAddress(caipAddress)
        console.log('📝 Creating SIWE message for address:', address)

        const message = await siwx.createMessage({
          chainId: activeNetwork.caipNetworkId,
          accountAddress: address
        })

        console.log('✍️ SIWE message created, requesting signature...')

        // 7. Extension을 통해 직접 서명
        const client = window.CrossSdk.ConnectionController._getClient()
        if (!client || !client.signMessage) {
          throw new Error('Client or signMessage method not available')
        }

        const signature = await client.signMessage({
          message: message.message,
          address
        })

        console.log('✅ Signature obtained:', signature.substring(0, 20) + '...')

        // 8. 세션 저장
        await siwx.addSession({
          data: {
            accountAddress: address,
            chainId: activeNetwork.caipNetworkId
          },
          message: message.message,
          signature,
          cacao: undefined
        })

        console.log('💾 Session saved successfully')

        // 9. 성공 알림
        alert(
          `🎉 SIWE 인증 성공!\n\n` +
            `Cross Extension이 연결되고 SIWE 인증이 완료되었습니다!\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📍 Address:\n${address}\n\n` +
            `🔗 Chain ID:\n${activeNetwork.caipNetworkId}\n\n` +
            `✍️ Signature:\n${signature.substring(0, 20)}...${signature.substring(signature.length - 20)}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
      } catch (error) {
        console.error('❌ Authentication failed:', error)

        const errorMessage = error?.message || String(error)

        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          alert('❌ User Rejected\n\nYou rejected the authentication request.')
        } else if (errorMessage.includes('Extension Not Installed')) {
          alert(
            '❌ Extension Not Installed\n\nCross Extension Wallet is not installed. Please install it first.'
          )
        } else if (errorMessage.includes('SIWE not configured')) {
          alert('❌ SIWE Not Configured\n\nSIWE is not properly configured. Contact the developer.')
        } else {
          alert(`❌ Authentication Failed\n\nError: ${errorMessage}`)
        }
      } finally {
        // 버튼 상태 복구
        if (button) {
          button.disabled = false
          button.textContent = originalText
          button.style.opacity = '1'
          button.style.cursor = 'pointer'
        }
      }
    })

    // WalletConnect (QR Code) 연결 + SIWE 인증 통합
    document.getElementById('authenticate-walletconnect')?.addEventListener('click', async () => {
      const button = document.getElementById('authenticate-walletconnect')
      if (!button) return

      // 버튼 상태 저장 및 비활성화
      const originalText = button.textContent
      button.disabled = true
      button.textContent = 'Authenticating...'
      button.style.opacity = '0.6'
      button.style.cursor = 'not-allowed'

      console.log('🔐 Starting WalletConnect authentication...')
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

            // 성공 알림
            alert(
              `🎉 SIWE 인증 성공!\n\n` +
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
            alert(
              '✅ 연결 및 인증 완료\n\n지갑이 연결되고 SIWE 인증이 완료되었습니다!\n세션 정보는 콘솔을 확인하세요.'
            )
          } else {
            alert('연결 성공\n\n지갑이 연결되었습니다.')
          }
        } else if (result) {
          alert('연결 성공\n\n지갑이 연결되고 인증이 완료되었습니다! 🎉')
        } else {
          alert(
            '인증 실패\n\nSIWE 인증이 설정되지 않았거나 지원하지 않는 체인입니다.\n일반 연결을 사용해주세요.'
          )
        }
      } catch (error) {
        console.error('❌ Authentication failed:', error)

        const errorMessage = error?.message || String(error)

        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          alert('❌ User Rejected\n\nYou rejected the authentication request.')
        } else {
          alert(`❌ Authentication Failed\n\nError: ${errorMessage}`)
        }
      } finally {
        // 버튼 상태 복구
        if (button) {
          button.disabled = false
          button.textContent = originalText
          button.style.opacity = '1'
          button.style.cursor = 'pointer'
        }
      }
    })

    // Disconnect 버튼
    document.getElementById('disconnect-wallet')?.addEventListener('click', disconnectWallet)

    // Theme toggle
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      const newTheme = themeState.themeMode === 'dark' ? 'light' : 'dark'
      crossSdk.setThemeMode(newTheme)
      themeState = { ...themeState, themeMode: newTheme }
      updateTheme(newTheme)
    })

    // Switch network
    const switchNetwork = document.getElementById('switch-network')
    switchNetwork.addEventListener('click', () => {
      const activeWallet = getActiveWallet()
      if (activeWallet) {
        createNetworkModal()
      }
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
    document
      .getElementById('get-balance-erc20')
      ?.addEventListener('click', () => getBalanceOfERC20())
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

    // 세션 관리 초기화
    initializeSessionManagement()

    // MetaMask Extension 자동 재연결 (페이지 로드 시)
    async function autoReconnectMetaMask() {
      try {
        const provider = findMetaMaskProvider()
        if (!provider) return

        // eth_accounts는 이미 연결된 계정만 반환 (사용자 승인 불필요)
        const accounts = await provider.request({ method: 'eth_accounts' })

        if (accounts && accounts.length > 0) {
          console.log('🔄 MetaMask 자동 재연결 중...')
          metamaskAddress = accounts[0]
          metamaskProvider = provider

          // Get chain ID
          const chainIdHex = await provider.request({ method: 'eth_chainId' })
          metamaskChainId = parseInt(chainIdHex, 16)

          // Set up event listeners (중복 방지)
          provider.removeAllListeners('accountsChanged')
          provider.removeAllListeners('chainChanged')

          provider.on('accountsChanged', accounts => {
            if (accounts.length > 0) {
              metamaskAddress = accounts[0]
            } else {
              metamaskAddress = null
              metamaskProvider = null
              metamaskChainId = null
            }
            updateButtonVisibility()
            updateSwitchNetworkButton()
          })

          provider.on('chainChanged', chainIdHex => {
            metamaskChainId = parseInt(chainIdHex, 16)
            updateButtonVisibility()
            updateSwitchNetworkButton()
          })

          updateButtonVisibility()
          updateSwitchNetworkButton()
          console.log('✅ MetaMask 자동 재연결 성공:', metamaskAddress)
        }
      } catch (error) {
        console.log('MetaMask 자동 재연결 실패 (무시):', error)
      }
    }

    // Extension 버튼 상태 주기적 업데이트 (SDK 로드 후)
    setTimeout(() => {
      updateExtensionButtonStates()
      autoReconnectMetaMask() // MetaMask 자동 재연결 시도
      setInterval(updateExtensionButtonStates, 3000) // 3초마다 확인
    }, 1000) // 1초 후 시작

    // Initialize contract args when state changes
    crossSdk.subscribeAccount(() => {
      setTimeout(initializeContractArgs, 100)
    })

    crossSdk.subscribeNetwork(() => {
      setTimeout(initializeContractArgs, 100)
    })

    // 초기 버튼 상태 설정
    updateButtonVisibility()
    updateSwitchNetworkButton()

    console.log('App initialized successfully!')
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
}

// Contract ABIs (simplified versions)
const sampleErc20ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

const sampleErc721ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'mintTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

const sampleEIP712 = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8'
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32'
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32'
      }
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

// DOM이 로드된 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM Content Loaded - Starting app initialization...')
  initializeApp()
})

// Debugging: Check if script is loaded
console.log('✅ app.js loaded successfully')
