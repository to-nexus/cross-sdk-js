# Wallet 연결 방법

CROSS SDK는 다양한 지갑과의 연결 방법을 제공합니다. 사용자의 환경과 선호도에 따라 최적의 연결 방법을 선택할 수 있습니다.

## 🔗 연결 방법 개요

### 기본 연결 방법

#### 1. 통합 지갑 연결 (`connect`)

- **용도**: SDK에서 지원하는 모든 지갑을 통합 UI로 연결
- **동작**: AppKit 모달을 열어 사용자가 원하는 지갑 선택
- **장점**: 가장 간단하고 직관적인 연결 방법

#### 2. 특정 지갑 연결 (`connect(walletId)`)

- **용도**: 특정 지갑을 직접 지정하여 연결
- **동작**: 지정된 지갑의 연결 프로세스 바로 시작
- **장점**: 사용자 경험 최적화, 빠른 연결

### CROSS Wallet 전용 연결 방법 (useAppKitWallet 훅 사용)

#### 1. QR 코드 연결 (`connectCrossWallet`)

- **용도**: 모바일 CROSS Wallet 앱과 연결
- **동작**: QR 코드 스캔 또는 모바일에서 딥링크 실행
- **장점**: 모바일 우선 환경에서 직관적이고 빠른 연결

#### 2. 브라우저 익스텐션 연결 (`connectCrossExtensionWallet`)

- **용도**: CROSS Wallet 브라우저 익스텐션과 직접 연결
- **동작**: 익스텐션과 직접 통신하여 즉시 연결
- **장점**: 데스크톱 환경에서 빠르고 안전한 연결

#### 3. 익스텐션 설치 확인 (`isInstalledCrossExtensionWallet`)

- **용도**: CROSS Wallet 익스텐션 설치 상태 확인
- **동작**: 브라우저에서 익스텐션 존재 여부 감지
- **장점**: 사용자에게 적절한 UI/UX 제공

> **중요**: CROSS Wallet 전용 함수들은 `useAppKitWallet` 훅을 통해서만 사용할 수 있습니다.

## 📱 사용법

### 기본 연결 방법

#### React 환경

```tsx
import { useAppKitWallet } from '@to-nexus/sdk/react'

function BasicWalletConnection() {
  const { connect, disconnect } = useAppKitWallet()

  const handleConnect = async () => {
    try {
      // 통합 지갑 선택 모달 열기
      await connect()
      console.log('지갑 연결 모달이 열렸습니다.')
    } catch (error) {
      console.error('연결 실패:', error)
    }
  }

  const handleConnectCross = async () => {
    try {
      // CROSS Wallet으로 직접 연결
      await connect('cross_wallet')
      console.log('CROSS Wallet 연결 시작됨')
    } catch (error) {
      console.error('CROSS Wallet 연결 실패:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      console.log('지갑 연결 해제됨')
    } catch (error) {
      console.error('연결 해제 실패:', error)
    }
  }

  return (
    <div>
      <h3>기본 연결 방법</h3>
      <button onClick={handleConnect}>지갑 선택 모달 열기</button>
      <button onClick={handleConnectCross}>CROSS Wallet 직접 연결</button>
      <button onClick={handleDisconnect}>연결 해제</button>
    </div>
  )
}
```

#### Vanilla JavaScript

```javascript
import { useAppKitWallet } from '@to-nexus/sdk'

// AppKit Wallet 인스턴스 가져오기
const appkitWallet = useAppKitWallet()

// 통합 지갑 연결
async function connectAllWallets() {
  try {
    await appkitWallet.connect()
    alert('지갑 선택 모달이 열렸습니다.')
  } catch (error) {
    console.error('연결 실패:', error)
    alert('연결에 실패했습니다.')
  }
}

// 특정 지갑 연결
async function connectSpecificWallet(walletId) {
  try {
    await appkitWallet.connect(walletId)
    alert(`${walletId} 연결이 시작되었습니다.`)
  } catch (error) {
    console.error(`${walletId} 연결 실패:`, error)
    alert(`${walletId} 연결에 실패했습니다.`)
  }
}

// 연결 해제
async function disconnectWallet() {
  try {
    await appkitWallet.disconnect()
    alert('지갑 연결이 해제되었습니다.')
  } catch (error) {
    console.error('연결 해제 실패:', error)
    alert('연결 해제에 실패했습니다.')
  }
}

// 이벤트 리스너 등록
document.getElementById('connect-all').addEventListener('click', connectAllWallets)
document
  .getElementById('connect-cross')
  .addEventListener('click', () => connectSpecificWallet('cross_wallet'))
document.getElementById('disconnect').addEventListener('click', disconnectWallet)
```

#### CDN 사용

```html
<!DOCTYPE html>
<html>
  <head>
    <title>기본 지갑 연결</title>
  </head>
  <body>
    <h3>기본 연결 방법</h3>
    <button id="connect-all">지갑 선택 모달 열기</button>
    <button id="connect-cross">CROSS Wallet 직접 연결</button>
    <button id="disconnect">연결 해제</button>

    <script type="module">
      import * as CrossSdk from 'https://cdn.jsdelivr.net/npm/@to-nexus/sdk-cdn/dist/cross-sdk.js'

      const { useAppKitWallet } = CrossSdk
      const appkitWallet = useAppKitWallet()

      // 이벤트 핸들러
      document.getElementById('connect-all').onclick = async () => {
        try {
          await appkitWallet.connect()
          alert('지갑 선택 모달이 열렸습니다.')
        } catch (error) {
          alert('연결 실패: ' + error.message)
        }
      }

      document.getElementById('connect-cross').onclick = async () => {
        try {
          await appkitWallet.connect('cross_wallet')
          alert('CROSS Wallet 연결이 시작되었습니다.')
        } catch (error) {
          alert('CROSS Wallet 연결 실패: ' + error.message)
        }
      }

      document.getElementById('disconnect').onclick = async () => {
        try {
          await appkitWallet.disconnect()
          alert('지갑 연결이 해제되었습니다.')
        } catch (error) {
          alert('연결 해제 실패: ' + error.message)
        }
      }
    </script>
  </body>
</html>
```

### CROSS Wallet 전용 연결 방법

#### React 환경

```tsx
import { useAppKitWallet } from '@to-nexus/sdk/react'

function WalletConnection() {
  const {
    connectCrossWallet,
    connectCrossExtensionWallet,
    isInstalledCrossExtensionWallet,
    isPending,
    isError,
    error
  } = useAppKitWallet()

  // 익스텐션 설치 상태 실시간 확인
  const isExtensionInstalled = isInstalledCrossExtensionWallet()

  const handleQRConnect = async () => {
    try {
      await connectCrossWallet()
      console.log('QR 연결 시작됨')
    } catch (error) {
      console.error('QR 연결 실패:', error)
    }
  }

  const handleExtensionConnect = async () => {
    try {
      if (!isExtensionInstalled) {
        alert('CROSS Wallet 익스텐션이 설치되지 않았습니다.')
        return
      }

      await connectCrossExtensionWallet()
      console.log('익스텐션 연결 성공')
    } catch (error) {
      console.error('익스텐션 연결 실패:', error)
    }
  }

  return (
    <div>
      <button onClick={handleQRConnect}>CROSS Wallet 연결 (QR)</button>

      <button
        onClick={handleExtensionConnect}
        disabled={!isExtensionInstalled}
        style={{
          backgroundColor: !isExtensionInstalled ? '#9E9E9E' : '',
          color: !isExtensionInstalled ? 'white' : ''
        }}
      >
        익스텐션 연결{!isExtensionInstalled ? ' (미설치)' : ''}
      </button>
    </div>
  )
}
```

### Vanilla JavaScript

```javascript
import { useAppKitWallet } from '@to-nexus/sdk'

// AppKit Wallet 인스턴스 생성
const appkitWallet = useAppKitWallet()

function updateButtons() {
  const qrButton = document.getElementById('qr-connect')
  const extensionButton = document.getElementById('extension-connect')

  // 실시간으로 익스텐션 설치 상태 확인
  const isExtensionInstalled = appkitWallet.isInstalledCrossExtensionWallet()
  const isPending = appkitWallet.isPending

  if (qrButton) {
    qrButton.disabled = isPending
    qrButton.textContent = isPending ? '연결 중...' : 'QR 코드 연결'
  }

  if (extensionButton) {
    extensionButton.disabled = isPending || !isExtensionInstalled
    extensionButton.textContent = isPending
      ? '연결 중...'
      : isExtensionInstalled
        ? '익스텐션 연결'
        : '익스텐션 연결 (미설치)'
  }
}

// QR 연결
async function handleQRConnect() {
  try {
    await appkitWallet.connectCrossWallet()
    alert('QR 연결이 시작되었습니다.')
  } catch (error) {
    console.error('QR 연결 실패:', error)
    alert('QR 연결에 실패했습니다.')
  }
}

// 익스텐션 연결
async function handleExtensionConnect() {
  try {
    const isExtensionInstalled = appkitWallet.isInstalledCrossExtensionWallet()

    if (!isExtensionInstalled) {
      alert('CROSS Wallet 익스텐션이 설치되지 않았습니다.')
      return
    }

    await appkitWallet.connectCrossExtensionWallet()
    alert('익스텐션 연결이 완료되었습니다.')
  } catch (error) {
    console.error('익스텐션 연결 실패:', error)
    alert('익스텐션 연결에 실패했습니다.')
  }
}

// 이벤트 리스너 등록
document.getElementById('qr-connect').addEventListener('click', handleQRConnect)
document.getElementById('extension-connect').addEventListener('click', handleExtensionConnect)

// 주기적으로 버튼 상태 업데이트
updateButtons()
setInterval(updateButtons, 1000)
```

### CDN 사용

> **참고**: CDN 환경에서는 전역 `CrossSdk` 객체를 통해 함수에 직접 접근할 수 있습니다.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>CROSS Wallet 연결</title>
  </head>
  <body>
    <button id="qr-connect">CROSS Wallet 연결 (QR)</button>
    <button id="extension-connect">익스텐션 연결</button>

    <script type="module">
      import * as CrossSdk from 'https://cdn.jsdelivr.net/npm/@to-nexus/sdk-cdn/dist/cross-sdk.js'

      const { connectCrossWallet, connectCrossExtensionWallet, isInstalledCrossExtensionWallet } =
        CrossSdk

      // 익스텐션 상태 확인 및 UI 업데이트
      function updateUI() {
        const isInstalled = isInstalledCrossExtensionWallet()
        const extensionBtn = document.getElementById('extension-connect')

        extensionBtn.disabled = !isInstalled
        extensionBtn.textContent = isInstalled ? '익스텐션 연결' : '익스텐션 연결 (미설치)'
      }

      // 이벤트 핸들러
      document.getElementById('qr-connect').onclick = async () => {
        try {
          await connectCrossWallet()
          alert('QR 연결이 시작되었습니다.')
        } catch (error) {
          alert('연결 실패: ' + error.message)
        }
      }

      document.getElementById('extension-connect').onclick = async () => {
        try {
          await connectCrossExtensionWallet()
          alert('익스텐션 연결이 완료되었습니다.')
        } catch (error) {
          alert('연결 실패: ' + error.message)
        }
      }

      // 초기화
      updateUI()
      setInterval(updateUI, 3000)
    </script>
  </body>
</html>
```

## 🎯 지원되는 지갑

### CROSS Wallet

현재 CROSS SDK는 **CROSS Wallet**을 중심으로 설계되어 있습니다:

| 지갑 ID        | 지갑 이름    | 플랫폼           | 연결 방법            |
| -------------- | ------------ | ---------------- | -------------------- |
| `cross_wallet` | CROSS Wallet | 모바일, 브라우저 | QR, 딥링크, 익스텐션 |

### CROSS Wallet 연결 방법 (useAppKitWallet 사용)

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'

function CrossWalletConnections() {
  const { connect, connectCrossWallet, connectCrossExtensionWallet } = useAppKitWallet()

  // CROSS Wallet 연결 방법들
  const crossWalletConnections = {
    // 기본 연결 (통합 UI)
    default: () => connect('cross_wallet'),

    // QR 코드/딥링크 연결
    qr: () => connectCrossWallet(),

    // 브라우저 익스텐션 연결
    extension: () => connectCrossExtensionWallet()
  }

  return crossWalletConnections
}

// 사용 예
const connections = CrossWalletConnections()
await connections.qr()
```

## 🔄 연결 상태 관리

### 연결 상태 확인

```typescript
import { useAppKitAccount, useAppKitWallet } from '@to-nexus/sdk/react'

function WalletStatus() {
  const { isConnected, address, chainId } = useAppKitAccount()
  const { walletInfo } = useAppKitWallet()

  return (
    <div>
      <h3>지갑 상태</h3>
      <p>연결 상태: {isConnected ? '연결됨' : '연결 안됨'}</p>
      {isConnected && (
        <>
          <p>주소: {address}</p>
          <p>체인 ID: {chainId}</p>
          <p>지갑: {walletInfo?.name}</p>
        </>
      )}
    </div>
  )
}
```

### 연결 상태 이벤트 구독

```typescript
import { AccountController, ConnectionController } from '@to-nexus/sdk'

// 계정 상태 변화 구독
AccountController.subscribe(state => {
  console.log('계정 상태 변화:', state)
  if (state.isConnected) {
    console.log('지갑 연결됨:', state.address)
  } else {
    console.log('지갑 연결 해제됨')
  }
})

// 연결 상태 변화 구독
ConnectionController.subscribe(state => {
  console.log('연결 상태 변화:', state)
})
```

### 자동 재연결

```typescript
import { initCrossSdk } from '@to-nexus/sdk'

// SDK 초기화 시 자동 재연결 활성화
const sdk = initCrossSdk({
  projectId: 'your-project-id',
  autoConnect: true, // 페이지 로드 시 이전 연결 복원
  metadata: {
    name: 'Your App',
    description: 'Your App Description',
    url: 'https://your-app.com',
    icons: ['https://your-app.com/icon.png']
  }
})

// 수동으로 재연결 시도
async function reconnectWallet() {
  try {
    await sdk.reconnect()
    console.log('지갑 재연결 성공')
  } catch (error) {
    console.error('재연결 실패:', error)
  }
}
```

## 🔧 고급 설정

### 커스텀 지갑 설정

CROSS Wallet을 사용하려면 SDK 초기화 시 `customWallets`에 CROSS Wallet 정보를 포함해야 합니다:

```typescript
import { initCrossSdk } from '@to-nexus/sdk'

const sdk = initCrossSdk({
  projectId: 'your-project-id',
  customWallets: [
    {
      id: 'cross_wallet',
      name: 'CROSS Wallet',
      rdns: 'nexus.to.crosswallet.desktop',
      mobile_link: 'crosswallet://connect/',
      desktop_link: 'https://chrome.google.com/webstore/detail/cross-wallet',
      chrome_store: 'https://chrome.google.com/webstore/detail/cross-wallet',
      homepage: 'https://wallet.cross.technology'
    }
  ]
})
```

### 에러 처리

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'

function ConnectWithErrorHandling() {
  const { connectCrossWallet, isError, error } = useAppKitWallet()

  const handleConnect = async () => {
    try {
      await connectCrossWallet()
    } catch (error) {
      if (error.message.includes('customWallets에 설정되지 않았습니다')) {
        console.error('CROSS Wallet 설정이 필요합니다.')
      } else if (error.message.includes('익스텐션이 설치되지 않았습니다')) {
        console.error('CROSS Wallet 익스텐션을 설치해주세요.')
      } else {
        console.error('연결 중 오류 발생:', error)
      }
    }
  }

  // 훅의 에러 상태 활용
  if (isError) {
    console.error('Wallet Error:', error)
  }

  return <button onClick={handleConnect}>Connect</button>
}
```

## 🌐 네트워크 관리

### 지원되는 네트워크

```typescript
import {
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  kaiaMainnet,
  kaiaTestnet
} from '@to-nexus/sdk'

// 사용 가능한 네트워크 목록
const supportedNetworks = [
  crossMainnet, // Cross 메인넷
  crossTestnet, // Cross 테스트넷
  bscMainnet, // BSC 메인넷
  bscTestnet, // BSC 테스트넷
  kaiaMainnet, // Kaia 메인넷
  kaiaTestnet, // Kaia 테스트넷
  etherMainnet, // Ethereum 메인넷
  etherTestnet // Ethereum 테스트넷 (Sepolia)
]
```

### 네트워크 전환

```typescript
import { useAppKitNetwork } from '@to-nexus/sdk/react'

function NetworkSwitcher() {
  const { switchNetwork, caipNetwork } = useAppKitNetwork()

  const handleSwitchToCross = async () => {
    try {
      await switchNetwork(crossMainnet)
      console.log('Cross 네트워크로 전환됨')
    } catch (error) {
      console.error('네트워크 전환 실패:', error)
    }
  }

  const handleSwitchToBSC = async () => {
    try {
      await switchNetwork(bscMainnet)
      console.log('BSC 네트워크로 전환됨')
    } catch (error) {
      console.error('네트워크 전환 실패:', error)
    }
  }

  return (
    <div>
      <h3>현재 네트워크: {caipNetwork?.name}</h3>
      <button onClick={handleSwitchToCross}>
        Cross로 전환
      </button>
      <button onClick={handleSwitchToBSC}>
        BSC로 전환
      </button>
    </div>
  )
}
```

### 네트워크별 설정

```typescript
// SDK 초기화 시 기본 네트워크 설정
const sdk = initCrossSdk({
  projectId: 'your-project-id',
  defaultNetwork: crossTestnet, // 기본 네트워크 설정
  networks: [crossMainnet, crossTestnet, bscMainnet, bscTestnet],
  metadata: {
    name: 'Your App',
    description: 'Your App Description',
    url: 'https://your-app.com',
    icons: ['https://your-app.com/icon.png']
  }
})
```

## 🎯 최적화 팁

### 1. 연결 상태 관리

```typescript
import { useAppKitAccount } from '@to-nexus/sdk/react'

function OptimizedWalletButtons() {
  const { isConnected } = useAppKitAccount()

  // 연결된 상태에서는 연결 버튼들을 숨김
  if (isConnected) {
    return <DisconnectButton />
  }

  return <ConnectionButtons />
}
```

### 2. 로딩 상태 표시

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'

function ConnectionWithLoading() {
  const { connectCrossWallet, isPending } = useAppKitWallet()

  const handleConnect = async () => {
    try {
      await connectCrossWallet()
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  return (
    <button onClick={handleConnect} disabled={isPending}>
      {isPending ? '연결 중...' : 'CROSS Wallet 연결'}
    </button>
  )
}
```

### 3. 디바이스별 최적화

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'

function SmartConnectionButton() {
  const { connectCrossWallet, connectCrossExtensionWallet, isInstalledCrossExtensionWallet } = useAppKitWallet()

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isExtensionInstalled = isInstalledCrossExtensionWallet()

  if (isMobile) {
    // 모바일에서는 QR/딥링크 우선
    return <button onClick={connectCrossWallet}>CROSS Wallet 연결</button>
  } else if (isExtensionInstalled) {
    // 데스크톱에서 익스텐션이 있으면 익스텐션 우선
    return <button onClick={connectCrossExtensionWallet}>익스텐션 연결</button>
  } else {
    // 익스텐션이 없으면 QR 연결
    return <button onClick={connectCrossWallet}>QR로 연결</button>
  }
}
```

## 📋 모범 사례

### 1. 사용자 경험 최적화

```typescript
import { useAppKitAccount, useAppKitWallet } from '@to-nexus/sdk/react'

function OptimizedWalletConnection() {
  const { isConnected } = useAppKitAccount()
  const { connect } = useAppKitWallet()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async (walletId?: string) => {
    try {
      setIsConnecting(true)

      // 사용자에게 로딩 상태 표시
      await connect(walletId)

      // 연결 성공 시 사용자에게 피드백
      toast.success('지갑이 성공적으로 연결되었습니다!')

    } catch (error) {
      // 에러 처리 및 사용자 친화적 메시지
      if (error.message.includes('User rejected')) {
        toast.info('지갑 연결이 취소되었습니다.')
      } else {
        toast.error('지갑 연결에 실패했습니다. 다시 시도해주세요.')
      }
      console.error('Connection error:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  // 이미 연결된 경우 연결 버튼 숨김
  if (isConnected) {
    return <ConnectedWalletInfo />
  }

  return (
    <div>
      <button
        onClick={() => handleConnect()}
        disabled={isConnecting}
        className="primary-button"
      >
        {isConnecting ? '연결 중...' : '지갑 연결'}
      </button>
    </div>
  )
}
```

### 2. 에러 처리 및 복구

```typescript
class WalletConnectionManager {
  private maxRetries = 3
  private retryDelay = 1000

  async connectWithRetry(walletId?: string, retries = 0): Promise<void> {
    try {
      await connect(walletId)
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`연결 재시도 ${retries + 1}/${this.maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.connectWithRetry(walletId, retries + 1)
      }

      // 최대 재시도 횟수 초과 시 사용자에게 알림
      this.handleConnectionFailure(error)
      throw error
    }
  }

  private handleConnectionFailure(error: Error) {
    if (error.message.includes('CROSS Wallet 익스텐션이 설치되지 않았습니다')) {
      // CROSS Wallet 익스텐션 설치 안내
      this.showCrossWalletInstallGuide()
    } else if (error.message.includes('Network not supported')) {
      // 네트워크 전환 안내
      this.showNetworkSwitchGuide()
    } else {
      // 일반적인 연결 실패 안내
      this.showGenericErrorGuide()
    }
  }
}
```

### 3. 성능 최적화

```typescript
// 지연 로딩을 통한 번들 크기 최적화
const LazyWalletModal = lazy(() => import('./WalletModal'))

// 연결 상태 캐싱
const connectionCache = new Map<string, boolean>()

function useOptimizedWalletConnection() {
  const { isConnected } = useAppKitAccount()

  // 연결 상태를 로컬 스토리지에 캐시
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('wallet_connected', 'true')
    } else {
      localStorage.removeItem('wallet_connected')
    }
  }, [isConnected])

  // 페이지 로드 시 캐시된 상태로 빠른 UI 업데이트
  const [cachedConnection, setCachedConnection] = useState(
    () => localStorage.getItem('wallet_connected') === 'true'
  )

  return {
    isConnected: isConnected || cachedConnection,
    connect: useCallback(async (walletId?: string) => {
      // 연결 로직
    }, [])
  }
}
```

### 4. 보안 고려사항

```typescript
// 안전한 지갑 연결 확인
function validateWalletConnection(address: string, signature: string) {
  // 서명 검증 로직
  const message = `지갑 연결 확인: ${Date.now()}`
  const recoveredAddress = ethers.utils.verifyMessage(message, signature)

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    throw new Error('지갑 주소가 일치하지 않습니다.')
  }

  return true
}

// 연결 시간 제한
const CONNECTION_TIMEOUT = 30000 // 30초

async function connectWithTimeout(walletId?: string) {
  return Promise.race([
    connect(walletId),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('연결 시간 초과')), CONNECTION_TIMEOUT)
    )
  ])
}
```

### 5. 접근성 개선

```typescript
// 키보드 네비게이션 지원
function AccessibleWalletButton({ children, connectHandler }) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      connectHandler()
    }
  }

  return (
    <button
      onClick={connectHandler}
      onKeyDown={handleKeyDown}
      aria-label={`${children} 지갑으로 연결`}
      role="button"
      tabIndex={0}
    >
      {children}
    </button>
  )
}

// 스크린 리더 지원
function WalletConnectionStatus() {
  const { isConnected, address } = useAppKitAccount()

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="지갑 연결 상태"
    >
      {isConnected ? (
        <span>지갑이 연결되었습니다. 주소: {address}</span>
      ) : (
        <span>지갑이 연결되지 않았습니다.</span>
      )}
    </div>
  )
}
```

## 🛠️ 트러블슈팅

### 자주 발생하는 문제

1. **"CROSS Wallet이 customWallets에 설정되지 않았습니다"**

   - SDK 초기화 시 `customWallets`에 CROSS Wallet 정보 추가 필요

2. **"CROSS Wallet 익스텐션이 설치되지 않았습니다"**

   - 사용자에게 익스텐션 설치 안내
   - `isInstalledCrossExtensionWallet()`로 사전 확인

3. **"CROSS Wallet 커넥터를 찾을 수 없습니다"**
   - 익스텐션이 제대로 로드되지 않았을 가능성
   - 페이지 새로고침 후 재시도

### 디버깅 도구

SDK는 디버깅을 위한 정보 제공 함수를 포함합니다:

```typescript
import { getCrossWalletDebugInfo } from '@to-nexus/sdk'

// 디버깅 정보 확인
const debugInfo = getCrossWalletDebugInfo()
console.log('CROSS Wallet Debug Info:', debugInfo)
```

이 함수는 다음 정보를 제공합니다:

- 익스텐션 설치 상태
- 감지 방법 (announced, rdns, providers 등)
- Ethereum 객체 존재 여부
- Provider 정보

## 📚 추가 자료

- [CROSS Wallet 공식 웹사이트](https://wallet.cross.technology)
- [CROSS SDK API 문서](https://cross.readme.io/update/docs/js/api/)
- [예제 코드](../examples/)
  - [React 예제](../examples/sdk-react/)
  - [Vanilla JS 예제](../examples/sdk-vanilla/)
  - [CDN 예제](../examples/sdk-cdn/)
