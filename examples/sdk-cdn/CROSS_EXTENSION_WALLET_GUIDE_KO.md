# Cross Extension Wallet 사용 가이드 (Vanilla JavaScript / CDN)

Cross Extension Wallet을 바닐라 JavaScript 또는 CDN 환경에서 감지하고 연결하는 방법을 설명합니다.

## CDN 스크립트 로드

먼저 HTML에 Cross SDK를 로드합니다:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Cross SDK Example</title>
  </head>
  <body>
    <!-- Cross SDK CDN -->
    <script type="module" src="./cross-sdk.js"></script>

    <!-- Your app script -->
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

## 1. SDK 로드 대기

SDK가 완전히 로드될 때까지 대기하는 헬퍼 함수:

```javascript
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
```

## 2. Extension 설치 상태 확인

### 2.1 확인 함수 구현

```javascript
// Cross Extension Wallet 버튼 상태 업데이트 함수
function updateCrossExtensionButtonState() {
  const connectCrossExtension = document.getElementById('connect-cross-extension')

  if (connectCrossExtension && window.CrossSdk?.ConnectorUtil) {
    try {
      // Extension 설치 여부 확인
      const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()

      if (isInstalled) {
        connectCrossExtension.disabled = false
        connectCrossExtension.title = 'Cross Extension Wallet에 연결'
        connectCrossExtension.style.opacity = '1'
        connectCrossExtension.style.cursor = 'pointer'
      } else {
        connectCrossExtension.disabled = true
        connectCrossExtension.title = 'Cross Extension Wallet이 설치되지 않았습니다'
        connectCrossExtension.style.opacity = '0.6'
        connectCrossExtension.style.cursor = 'not-allowed'
      }
    } catch (error) {
      // SDK가 아직 로드되지 않은 경우 기본 상태 유지
      console.log('SDK not ready for extension check:', error.message)
    }
  }
}
```

### 2.2 주기적 확인 설정

Extension이 런타임에 설치/제거될 수 있으므로 주기적으로 확인:

```javascript
// SDK 로드 후 주기적으로 Extension 상태 확인
setTimeout(() => {
  updateCrossExtensionButtonState()
  // 3초마다 확인
  setInterval(updateCrossExtensionButtonState, 3000)
}, 1000) // 1초 후 시작
```

## 3. Extension 연결 함수

```javascript
// Extension 연결 버튼 이벤트 리스너
document.getElementById('connect-cross-extension')?.addEventListener('click', async () => {
  try {
    console.log('🚀 Cross Extension Wallet 연결 시도 시작')

    // Extension 연결 실행
    const result = await window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()

    console.log('✅ Cross Extension Wallet 연결 성공:', result)
    alert(`✅ Cross Extension Wallet 연결 성공!\n\n주소: ${result.address}`)
  } catch (error) {
    console.error('Cross Extension Wallet 연결 실패:', error)

    // 에러 메시지 분석
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isUserRejection =
      errorMessage.includes('User rejected') ||
      errorMessage.includes('User denied') ||
      errorMessage.includes('User cancelled') ||
      errorMessage.includes('Connection rejected') ||
      errorMessage.includes('Modal closed') ||
      errorMessage.includes('rejected') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('denied')

    const isTimeout = errorMessage.includes('Connection timeout')

    // 사용자 친화적인 에러 메시지 표시
    if (isUserRejection) {
      alert('❌ 연결 취소됨\n\n사용자가 지갑 연결을 취소했습니다.')
    } else if (isTimeout) {
      alert('⏰ 연결 시간 초과\n\n지갑 연결 요청이 시간 초과되었습니다. 다시 시도해주세요.')
    } else if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
      alert(
        '📦 익스텐션 미설치\n\nCross Extension Wallet이 설치되지 않았습니다. 먼저 익스텐션을 설치해주세요.'
      )
    } else if (errorMessage.includes('customWallets에 설정되지 않았습니다')) {
      alert('⚙️ 설정 오류\n\nCross Wallet이 올바르게 설정되지 않았습니다. 개발자에게 문의해주세요.')
    } else {
      alert(`❌ 연결 실패\n\n지갑 연결 중 오류가 발생했습니다: ${errorMessage}`)
    }
  }
})
```

## 4. Extension 설치 확인 버튼

```javascript
// Extension 설치 상태 확인 버튼
document.getElementById('check-cross-extension')?.addEventListener('click', () => {
  const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()
  alert(`Cross Extension Wallet 설치 상태: ${isInstalled ? '✅ 설치됨' : '❌ 설치되지 않음'}`)
})
```

## 5. HTML 버튼 구성

```html
<!-- 연결되지 않은 경우 표시되는 버튼들 -->
<div id="connection-buttons">
  <button id="connect-wallet">Connect Wallet</button>
  <button id="connect-cross-extension" disabled>Connect Cross Extension</button>
  <button id="check-cross-extension">Check Extension Status</button>
</div>

<!-- 연결된 경우 표시되는 버튼들 -->
<div id="connected-buttons" style="display: none;">
  <button id="disconnect-wallet">Disconnect</button>
</div>
```

## 6. 버튼 가시성 관리

```javascript
// 버튼 가시성 및 상태 업데이트 함수
function updateButtonVisibility() {
  const isConnected = accountState?.isConnected || false

  // 연결 관련 버튼들
  const connectWallet = document.getElementById('connect-wallet')
  const connectCrossExtension = document.getElementById('connect-cross-extension')
  const checkCrossExtension = document.getElementById('check-cross-extension')
  const disconnectWallet = document.getElementById('disconnect-wallet')

  if (isConnected) {
    // 연결된 상태: disconnect 버튼만 표시
    if (connectWallet) connectWallet.style.display = 'none'
    if (connectCrossExtension) connectCrossExtension.style.display = 'none'
    if (checkCrossExtension) checkCrossExtension.style.display = 'none'
    if (disconnectWallet) disconnectWallet.style.display = 'inline-block'
  } else {
    // 연결되지 않은 상태: 연결 버튼들 표시
    if (connectWallet) connectWallet.style.display = 'inline-block'
    if (connectCrossExtension) connectCrossExtension.style.display = 'inline-block'
    if (checkCrossExtension) checkCrossExtension.style.display = 'inline-block'
    if (disconnectWallet) disconnectWallet.style.display = 'none'

    // Cross Extension Wallet 버튼 활성화/비활성화 상태 업데이트
    updateCrossExtensionButtonState()
  }
}
```

## 7. 초기화 및 이벤트 구독

```javascript
async function initializeApp() {
  try {
    console.log('Waiting for SDK to load...')
    const CrossSdk = await waitForSDK()
    console.log('SDK loaded successfully:', CrossSdk)

    // SDK 초기화
    const crossSdk = CrossSdk.initCrossSdkWithParams({
      projectId: 'your-project-id',
      redirectUrl: window.location.href,
      metadata: {
        name: 'Your App Name',
        description: 'Your App Description',
        url: 'https://your-app.com',
        icons: ['https://your-app.com/icon.png']
      },
      themeMode: 'light'
    })

    // 계정 상태 구독
    crossSdk.subscribeAccount(state => {
      accountState = state
      updateButtonVisibility()
      console.log('Account state updated:', state)
    })

    // Cross Extension Wallet 버튼 상태 주기적 업데이트
    setTimeout(() => {
      updateCrossExtensionButtonState()
      setInterval(updateCrossExtensionButtonState, 3000)
    }, 1000)

    // 초기 버튼 상태 설정
    updateButtonVisibility()

    console.log('App initialized successfully!')
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
}

// DOM이 로드된 후 앱 초기화
document.addEventListener('DOMContentLoaded', initializeApp)
```

## 주요 API

### `window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()`

- **역할**: Cross Extension Wallet이 브라우저에 설치되어 있는지 확인
- **반환값**: `boolean` - 설치되어 있으면 `true`, 아니면 `false`
- **사용 시기**:
  - 앱 초기화 시
  - 주기적 확인 (Extension이 런타임에 설치/제거될 수 있음)
  - 버튼 활성화/비활성화 결정

### `window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()`

- **역할**: Cross Extension Wallet 연결 요청
- **반환값**: `Promise<{ address: string }>` - 연결 성공 시 주소 반환
- **주의사항**:
  - Extension이 설치되어 있지 않으면 에러 발생
  - 사용자가 연결을 거부하면 에러 발생
  - 연결 타임아웃 가능
  - 적절한 에러 핸들링 필수

## 에러 처리

### 일반적인 에러 케이스

1. **Extension 미설치**: "익스텐션이 설치되지 않았습니다"
2. **사용자 거부**: "User rejected", "User cancelled", "Modal closed"
3. **타임아웃**: "Connection timeout"
4. **설정 오류**: "customWallets에 설정되지 않았습니다"

### 권장 에러 처리 패턴

```javascript
try {
  const result = await window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()
  console.log('연결 성공:', result)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
    console.error('Extension not installed')
    alert('Cross Extension Wallet을 먼저 설치해주세요.')
  } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
    console.log('User cancelled connection')
    alert('연결이 취소되었습니다.')
  } else if (errorMessage.includes('timeout')) {
    console.error('Connection timeout')
    alert('연결 시간이 초과되었습니다. 다시 시도해주세요.')
  } else {
    console.error('Connection failed:', error)
    alert(`연결 실패: ${errorMessage}`)
  }
}
```

## CSS 스타일링 예제

```css
/* Extension 연결 버튼 */
#connect-cross-extension {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: opacity 0.3s;
}

#connect-cross-extension:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

#connect-cross-extension:not(:disabled):hover {
  background-color: #0056b3;
}

/* 상태 표시 */
.extension-status {
  display: inline-block;
  margin-left: 10px;
  font-size: 14px;
}

.extension-status.installed {
  color: #28a745;
}

.extension-status.not-installed {
  color: #dc3545;
}
```

## 실제 사용 예제

전체 코드 예제는 다음 경로에서 확인할 수 있습니다:

```
examples/sdk-cdn/app.js
```

라인 218-240 (상태 확인), 988-1026 (연결), 1028-1031 (설치 확인)을 참조하세요.

## 팁

1. **SDK 로드 대기**: `window.CrossSdk`가 로드될 때까지 기다린 후 API를 호출하세요.

2. **주기적 확인**: Extension은 사용자가 런타임에 설치/제거할 수 있으므로 주기적으로 설치 상태를 확인하세요.

3. **버튼 상태 관리**: Extension이 설치되지 않았을 때 버튼을 비활성화하여 UX를 개선하세요.

4. **시각적 피드백**: 버튼의 opacity와 cursor 스타일을 조정하여 활성/비활성 상태를 명확히 표시하세요.

5. **에러 메시지**: 사용자가 이해하기 쉬운 에러 메시지를 제공하세요.

6. **상태 구독**: `crossSdk.subscribeAccount()`를 사용하여 연결 상태 변화를 감지하고 UI를 업데이트하세요.

## 완전한 예제 코드

```javascript
// SDK 로드 대기
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

// 앱 상태
let accountState = {}

// Extension 상태 확인
function updateCrossExtensionButtonState() {
  const btn = document.getElementById('connect-cross-extension')
  if (btn && window.CrossSdk?.ConnectorUtil) {
    try {
      const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()
      btn.disabled = !isInstalled
      btn.style.opacity = isInstalled ? '1' : '0.6'
      btn.title = isInstalled ? 'Connect' : 'Extension not installed'
    } catch (error) {
      console.log('SDK not ready:', error)
    }
  }
}

// Extension 연결
async function connectExtension() {
  try {
    const result = await window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()
    alert(`✅ Connected: ${result.address}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('익스텐션이 설치되지 않았습니다')) {
      alert('❌ Extension not installed')
    } else if (msg.includes('rejected') || msg.includes('cancelled')) {
      alert('❌ Connection cancelled')
    } else {
      alert(`❌ Error: ${msg}`)
    }
  }
}

// Extension 설치 확인
function checkExtension() {
  const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()
  alert(isInstalled ? '✅ Installed' : '❌ Not installed')
}

// 초기화
async function initializeApp() {
  try {
    const CrossSdk = await waitForSDK()

    const crossSdk = CrossSdk.initCrossSdkWithParams({
      projectId: 'your-project-id',
      redirectUrl: window.location.href,
      metadata: {
        name: 'Your App',
        description: 'Description',
        url: 'https://your-app.com',
        icons: ['https://your-app.com/icon.png']
      }
    })

    // 이벤트 리스너 등록
    document.getElementById('connect-cross-extension')?.addEventListener('click', connectExtension)
    document.getElementById('check-cross-extension')?.addEventListener('click', checkExtension)

    // 계정 상태 구독
    crossSdk.subscribeAccount(state => {
      accountState = state
      console.log('Account state:', state)
    })

    // 주기적으로 Extension 상태 확인
    setTimeout(() => {
      updateCrossExtensionButtonState()
      setInterval(updateCrossExtensionButtonState, 3000)
    }, 1000)

    console.log('✅ App initialized')
  } catch (error) {
    console.error('❌ Initialization failed:', error)
  }
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', initializeApp)
```

## HTML 전체 예제

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cross Extension Wallet Example</title>
    <style>
      button {
        padding: 10px 20px;
        margin: 5px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      #connect-cross-extension {
        background-color: #007bff;
        color: white;
      }

      #connect-cross-extension:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
        opacity: 0.6;
      }

      #check-cross-extension {
        background-color: #28a745;
        color: white;
      }
    </style>
  </head>
  <body>
    <h1>Cross Extension Wallet Example</h1>

    <div>
      <button id="connect-cross-extension" disabled>Connect Extension</button>
      <button id="check-cross-extension">Check Extension</button>
    </div>

    <!-- Cross SDK CDN -->
    <script type="module" src="./cross-sdk.js"></script>

    <!-- Your app script -->
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

