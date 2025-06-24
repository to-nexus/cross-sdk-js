import { initCrossSdkWithParams, useAppKitWallet } from '@to-nexus/sdk'
import { crossMainnet, crossTestnet, bscMainnet, bscTestnet } from '@to-nexus/sdk'

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

const crossSdk =initCrossSdkWithParams({
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

// State objects
let accountState = {}
let networkState = {}
let appKitState = {}
let themeState = { themeMode: 'light', themeVariables: {} }
let events = []
let walletInfo = {}
let eip155Provider = null

// 네트워크 선택 팝업 생성 함수
function createNetworkModal() {
  // 기존 모달이 있다면 제거
  const existingModal = document.getElementById('network-modal')
  if (existingModal) {
    existingModal.remove()
  }

  const modal = document.createElement('div')
  modal.id = 'network-modal'
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `

  const modalContent = document.createElement('div')
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 12px;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  `

  const title = document.createElement('h3')
  title.textContent = '네트워크 선택'
  title.style.cssText = `
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  `

  const networkList = document.createElement('div')
  networkList.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `

  availableNetworks.forEach(networkInfo => {
    const networkItem = document.createElement('div')
    networkItem.style.cssText = `
      padding: 12px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `

    // 현재 네트워크인지 확인
    const isCurrentNetwork = networkState?.caipNetwork?.id === networkInfo.network.id
    if (isCurrentNetwork) {
      networkItem.style.backgroundColor = '#f0f8ff'
      networkItem.style.borderColor = '#007bff'
    }

    networkItem.onmouseenter = () => {
      if (!isCurrentNetwork) {
        networkItem.style.backgroundColor = '#f8f9fa'
        networkItem.style.borderColor = '#007bff'
      }
    }

    networkItem.onmouseleave = () => {
      if (!isCurrentNetwork) {
        networkItem.style.backgroundColor = 'white'
        networkItem.style.borderColor = '#e0e0e0'
      }
    }

    const networkName = document.createElement('span')
    networkName.textContent = networkInfo.name
    networkName.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #333;
    `

    const statusIndicator = document.createElement('span')
    if (isCurrentNetwork) {
      statusIndicator.textContent = '✓ 현재'
      statusIndicator.style.cssText = `
        font-size: 12px;
        color: #007bff;
        font-weight: 500;
      `
    } else {
      statusIndicator.textContent = '선택'
      statusIndicator.style.cssText = `
        font-size: 12px;
        color: #666;
        font-weight: 400;
      `
    }

    networkItem.appendChild(networkName)
    networkItem.appendChild(statusIndicator)

    networkItem.onclick = async () => {
      if (!isCurrentNetwork) {
        try {
          await crossSdk.switchNetwork(networkInfo.network)
          closeNetworkModal()
        } catch (error) {
          console.error('네트워크 전환 실패:', error)
          alert('네트워크 전환에 실패했습니다.')
        }
      }
    }

    networkList.appendChild(networkItem)
  })

  const closeButton = document.createElement('button')
  closeButton.textContent = '닫기'
  closeButton.style.cssText = `
    margin-top: 20px;
    padding: 8px 16px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    width: 100%;
  `

  closeButton.onclick = closeNetworkModal

  modalContent.appendChild(title)
  modalContent.appendChild(networkList)
  modalContent.appendChild(closeButton)
  modal.appendChild(modalContent)

  // 모달 외부 클릭 시 닫기
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeNetworkModal()
    }
  }

  document.body.appendChild(modal)
}

// 네트워크 모달 닫기 함수
function closeNetworkModal() {
  const modal = document.getElementById('network-modal')
  if (modal) {
    modal.remove()
  }
}

// Helper function to update theme
const updateTheme = mode => {
  document.documentElement.setAttribute('data-theme', mode)
  document.body.className = mode

  // Update logo based on theme
  const nexusLogo = document.getElementById('nexus-logo')
  if (nexusLogo) {
    nexusLogo.src = mode === 'dark' ? '/nexus-logo-white.png' : '/nexus-logo.png'
  }
}

// Subscribe to state changes
crossSdk.subscribeAccount(state => {
  accountState = state
  document.getElementById('accountState').textContent = JSON.stringify(state, null, 2)
})

crossSdk.subscribeNetwork(state => {
  networkState = state
  const switchNetwork = document.getElementById('switch-network')
  switchNetwork.textContent = networkState.caipNetwork.name
})

crossSdk.subscribeState(state => {
  appKitState = state
  appKitState.isConnected ? connectWallet.textContent = 'Connected' : connectWallet.textContent = 'Connect Wallet'
})

crossSdk.subscribeTheme(state => {
  themeState = state
  document.getElementById('themeState').textContent = JSON.stringify(state, null, 2)
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
  if (appKitState.isConnected) {
    await appkitWallet.disconnect()
  } else {
    await appkitWallet.connect("cross_wallet")
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

document.getElementById('sign-message')?.addEventListener('click', async () => {
  if (!accountState.address) {
    await crossSdk.open()
    return
  }
  signMessage()
})

async function signMessage() {
  if (eip155Provider && accountState.address) {
    try {
      await eip155Provider.request({
        method: 'personal_sign',
        params: ['Hello from AppKit!', accountState.address]
      })
    } catch (error) {
      console.error('Error signing message:', error)
    }
  }
}

// Set initial theme and UI state
updateTheme(themeState.themeMode)
