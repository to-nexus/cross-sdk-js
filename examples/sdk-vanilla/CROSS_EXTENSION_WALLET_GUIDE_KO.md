# Cross Extension Wallet 사용 가이드 (Vanilla JavaScript)

Cross Extension Wallet을 바닐라 JavaScript 프로젝트에서 감지하고 연결하는 방법을 설명합니다.

## 필수 Import

```javascript
import { ConnectorUtil } from '@to-nexus/sdk'
```

## 1. SDK 초기화

```javascript
import {
  ConnectorUtil,
  crossMainnet,
  crossTestnet,
  initCrossSdkWithParams,
  useAppKitWallet
} from '@to-nexus/sdk'

const metadata = {
  name: 'Your App Name',
  description: 'Your App Description',
  url: 'https://your-app.com',
  icons: ['https://your-app.com/icon.png']
}

const projectId = 'your-project-id'
const redirectUrl = window.location.href

const crossSdk = initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'light'
})

const appkitWallet = useAppKitWallet()
```

## 2. Extension 설치 상태 확인

### 2.1 확인 함수

```javascript
// Cross Extension Wallet 설치 확인 버튼
const checkCrossExtension = document.getElementById('check-cross-extension')
checkCrossExtension.addEventListener('click', () => {
  const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
  console.log('Cross Extension Wallet 설치 상태:', isInstalled)
  alert(`Cross Extension Wallet ${isInstalled ? '설치됨 ✅' : '설치되지 않음 ❌'}`)
})
```

### 2.2 주기적 확인 (선택사항)

Extension이 런타임에 설치/제거될 수 있으므로 주기적으로 확인:

```javascript
// Extension 상태 확인 함수
function checkExtensionStatus() {
  try {
    const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
    const btn = document.getElementById('connect-cross-extension')

    if (btn) {
      btn.disabled = !isInstalled
      btn.style.opacity = isInstalled ? '1' : '0.6'
      btn.style.cursor = isInstalled ? 'pointer' : 'not-allowed'
      btn.title = isInstalled
        ? 'Cross Extension Wallet에 연결'
        : 'Cross Extension Wallet이 설치되지 않았습니다'
    }
  } catch (error) {
    console.error('Extension 상태 확인 중 오류:', error)
  }
}

// 초기 확인
checkExtensionStatus()

// 3초마다 확인
setInterval(checkExtensionStatus, 3000)
```

## 3. Extension 연결 함수

```javascript
// Cross Extension Wallet 직접 연결 버튼
const connectCrossExtension = document.getElementById('connect-cross-extension')
connectCrossExtension.addEventListener('click', async () => {
  try {
    console.log('🚀 Cross Extension Wallet 연결 시도 시작')

    // Extension 연결 실행
    const result = await ConnectorUtil.connectCrossExtensionWallet()

    console.log('✅ Cross Extension Wallet 연결 성공:', result)
    alert('Cross Extension Wallet 연결 성공!')
  } catch (error) {
    console.error('Cross Extension Wallet 연결 실패:', error)

    // 에러 메시지 분석
    const errorMessage = error?.message || String(error)
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
      alert('📦 익스텐션 미설치\n\nCross Extension Wallet이 설치되지 않았습니다.')
    } else if (errorMessage.includes('customWallets에 설정되지 않았습니다')) {
      alert('⚙️ 설정 오류\n\nCross Wallet이 올바르게 설정되지 않았습니다.')
    } else {
      alert(`❌ 연결 실패\n\n${errorMessage}`)
    }
  }
})
```

## 4. HTML 버튼 구성

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cross SDK Example</title>
    <link rel="stylesheet" href="./main.css" />
  </head>
  <body>
    <div class="container">
      <h1>Cross Extension Wallet Example</h1>

      <!-- 연결되지 않은 경우 표시되는 버튼들 -->
      <div id="connection-buttons">
        <button id="connect-wallet">Connect Wallet</button>
        <button id="connect-cross-extension">Connect Cross Extension</button>
        <button id="check-cross-extension">Check Extension Status</button>
      </div>

      <!-- 연결된 경우 표시되는 버튼들 -->
      <div id="connected-buttons" style="display: none;">
        <button id="disconnect-wallet">Disconnect</button>
      </div>
    </div>

    <!-- 모듈 타입으로 스크립트 로드 -->
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

## 5. CSS 스타일링

```css
/* main.css */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

button {
  padding: 12px 24px;
  margin: 5px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

#connect-cross-extension {
  background-color: #007bff;
  color: white;
}

#connect-cross-extension:not(:disabled):hover {
  background-color: #0056b3;
  transform: translateY(-1px);
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

#check-cross-extension:hover {
  background-color: #218838;
}

#disconnect-wallet {
  background-color: #dc3545;
  color: white;
}

#disconnect-wallet:hover {
  background-color: #c82333;
}
```

## 6. 버튼 가시성 관리

```javascript
let accountState = {}

// 버튼 가시성 업데이트 함수
function updateButtonVisibility(isConnected) {
  const connectionButtons = document.getElementById('connection-buttons')
  const connectedButtons = document.getElementById('connected-buttons')
  const connectCrossExtension = document.getElementById('connect-cross-extension')

  if (isConnected) {
    // 연결됨: 연결 버튼 숨기고 disconnect 버튼 표시
    connectionButtons.style.display = 'none'
    connectedButtons.style.display = 'block'
  } else {
    // 연결 안됨: 연결 버튼 표시하고 disconnect 버튼 숨김
    connectionButtons.style.display = 'block'
    connectedButtons.style.display = 'none'

    // Extension 상태 확인하여 버튼 활성화/비활성화
    checkExtensionStatus()
  }
}

// 계정 상태 구독
crossSdk.subscribeAccount(state => {
  accountState = state
  updateButtonVisibility(state.isConnected)
  console.log('Account state updated:', state)
})
```

## 주요 API

### `ConnectorUtil.isInstalledCrossExtensionWallet()`

- **역할**: Cross Extension Wallet이 브라우저에 설치되어 있는지 확인
- **반환값**: `boolean` - 설치되어 있으면 `true`, 아니면 `false`
- **사용 시기**:
  - 앱 초기화 시
  - 주기적 확인 (Extension이 런타임에 설치/제거될 수 있음)
  - 버튼 활성화/비활성화 결정

### `ConnectorUtil.connectCrossExtensionWallet()`

- **역할**: Cross Extension Wallet 연결 요청
- **반환값**: `Promise<{ address: string }>` - 연결 성공 시 주소 등 정보 반환
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
  const result = await ConnectorUtil.connectCrossExtensionWallet()
  console.log('연결 성공:', result)
  alert('✅ 연결 성공!')
} catch (error) {
  const errorMessage = error?.message || String(error)

  if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
    console.error('Extension not installed')
    alert('❌ Extension을 먼저 설치해주세요.')
  } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
    console.log('User cancelled connection')
    alert('❌ 연결이 취소되었습니다.')
  } else if (errorMessage.includes('timeout')) {
    console.error('Connection timeout')
    alert('⏰ 연결 시간이 초과되었습니다.')
  } else {
    console.error('Connection failed:', error)
    alert(`❌ 연결 실패: ${errorMessage}`)
  }
}
```

## 실제 사용 예제

전체 코드 예제는 다음 경로에서 확인할 수 있습니다:

```
examples/sdk-vanilla/src/main.js
```

라인 964-1011을 참조하세요.

## 완전한 예제 코드

```javascript
// main.js
import {
  ConnectorUtil,
  crossMainnet,
  crossTestnet,
  initCrossSdkWithParams,
  useAppKitWallet
} from '@to-nexus/sdk'

// SDK 초기화
const crossSdk = initCrossSdkWithParams({
  projectId: 'your-project-id',
  redirectUrl: window.location.href,
  metadata: {
    name: 'Your App',
    description: 'Description',
    url: 'https://your-app.com',
    icons: ['https://your-app.com/icon.png']
  },
  themeMode: 'light'
})

const appkitWallet = useAppKitWallet()
let accountState = {}

// Extension 상태 확인
function checkExtensionStatus() {
  try {
    const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
    const btn = document.getElementById('connect-cross-extension')

    if (btn) {
      btn.disabled = !isInstalled
      btn.style.opacity = isInstalled ? '1' : '0.6'
      btn.title = isInstalled ? 'Connect' : 'Extension not installed'
    }
  } catch (error) {
    console.error('Error checking extension:', error)
  }
}

// 버튼 가시성 업데이트
function updateButtonVisibility(isConnected) {
  const connectionButtons = document.getElementById('connection-buttons')
  const connectedButtons = document.getElementById('connected-buttons')

  if (isConnected) {
    connectionButtons.style.display = 'none'
    connectedButtons.style.display = 'block'
  } else {
    connectionButtons.style.display = 'block'
    connectedButtons.style.display = 'none'
    checkExtensionStatus()
  }
}

// Extension 연결
const connectBtn = document.getElementById('connect-cross-extension')
connectBtn.addEventListener('click', async () => {
  try {
    const result = await ConnectorUtil.connectCrossExtensionWallet()
    console.log('✅ 연결 성공:', result)
    alert('✅ Connected!')
  } catch (error) {
    const msg = error?.message || String(error)
    if (msg.includes('익스텐션이 설치되지 않았습니다')) {
      alert('❌ Extension not installed')
    } else if (msg.includes('rejected') || msg.includes('cancelled')) {
      alert('❌ Connection cancelled')
    } else {
      alert(`❌ Error: ${msg}`)
    }
  }
})

// Extension 설치 확인
const checkBtn = document.getElementById('check-cross-extension')
checkBtn.addEventListener('click', () => {
  const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
  alert(isInstalled ? '✅ Installed' : '❌ Not installed')
})

// 연결 해제
const disconnectBtn = document.getElementById('disconnect-wallet')
disconnectBtn.addEventListener('click', async () => {
  try {
    await appkitWallet.disconnect()
    console.log('✅ Disconnected')
  } catch (error) {
    console.error('❌ Disconnect failed:', error)
  }
})

// 계정 상태 구독
crossSdk.subscribeAccount(state => {
  accountState = state
  updateButtonVisibility(state.isConnected)
})

// 주기적으로 Extension 상태 확인
checkExtensionStatus()
setInterval(checkExtensionStatus, 3000)

// 초기 버튼 상태 설정
window.addEventListener('DOMContentLoaded', () => {
  updateButtonVisibility(false)
})
```

## 빌드 설정 (Vite)

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
```

## 패키지 설정

```json
{
  "name": "cross-sdk-vanilla-example",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@to-nexus/sdk": "^1.17.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

## 팁

1. **Import 방식**: ES 모듈 형식으로 import하세요 (`type="module"`).

2. **주기적 확인**: Extension은 사용자가 런타임에 설치/제거할 수 있으므로 주기적으로 상태를 확인하세요.

3. **버튼 상태 관리**: Extension이 설치되지 않았을 때 버튼을 비활성화하여 UX를 개선하세요.

4. **시각적 피드백**: opacity와 cursor 스타일을 조정하여 활성/비활성 상태를 명확히 표시하세요.

5. **에러 메시지**: 사용자가 이해하기 쉬운 에러 메시지를 제공하세요.

6. **상태 구독**: `crossSdk.subscribeAccount()`를 사용하여 연결 상태 변화를 감지하고 UI를 업데이트하세요.

7. **로깅**: 개발 중에는 console.log를 활용하여 연결 과정을 추적하세요.

