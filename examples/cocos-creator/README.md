# 🎮 Cocos Creator Cross SDK 통합 가이드

Cocos Creator 3.8.7 게임 프로젝트에 Cross SDK를 통합하여 블록체인 기능을 구현하는 완전한 가이드입니다.
실제 웹게임에 Cross SDK를 적용하려는 개발자를 위한 상세한 문서입니다.

## 📋 목차

- [🎯 개요](#-개요)
- [🛠 프로젝트 구조](#-프로젝트-구조)
- [⚡ 빠른 시작](#-빠른-시작)
- [🔧 SDK 통합 방법](#-sdk-통합-방법)
- [📝 핵심 코드 분석](#-핵심-코드-분석)
- [🚀 빌드 및 배포](#-빌드-및-배포)
- [📱 모바일 최적화](#-모바일-최적화)
- [🐛 문제 해결](#-문제-해결)

## 🎯 개요

이 프로젝트는 Cocos Creator 웹게임에 Cross SDK를 통합하는 방법을 보여줍니다:

- **지갑 연결**: Cross Wallet 지갑 연결 지원
- **네트워크 전환**: Cross, Ethereum, BSC, Kaia 등 멀티체인 지원
- **토큰 전송**: 네이티브 토큰 및 ERC-20 토큰 전송
- **스마트 컨트랙트**: 컨트랙트 읽기/쓰기 기능
- **서명**: 메시지 서명 및 EIP-712 타입 데이터 서명
- **세션 관리**: 지갑 연결 상태 관리 및 자동 재연결

### 지원 기능

✅ **지갑 연결/해제**  
✅ **멀티체인 네트워크 전환**  
✅ **토큰 전송 (Native, ERC-20)**  
✅ **스마트 컨트랙트 상호작용**  
✅ **메시지 서명 (EIP-191, EIP-712)**  
✅ **ENS 도메인 조회**  
✅ **가스비 추정**  
✅ **세션 상태 관리**  
✅ **모바일 반응형 UI**

## 🛠 프로젝트 구조

```
cocos-creator/
├── assets/                          # 게임 에셋
│   ├── scripts/
│   │   └── CrossInit.ts             # SDK 초기화 스크립트
│   ├── SdkActions.ts                # SDK 기능 구현 컴포넌트
│   └── scene/                       # 게임 씬 파일들
├── build-templates/                 # 빌드 템플릿
│   ├── web-desktop/                 # 데스크톱 웹 빌드 템플릿
│   │   ├── index.html              # HTML 템플릿
│   │   ├── style.css               # CSS 스타일
│   │   └── external/               # SDK 파일들
│   │       ├── cross-sdk.js        # 메인 SDK 파일
│   │       ├── index.es-*.js       # SDK 핵심 모듈
│   │       └── w3m-modal-*.js      # WalletConnect 모달
│   └── web-mobile/                 # 모바일 웹 빌드 템플릿
│       ├── index.html              # 모바일 최적화 HTML
│       ├── style.css               # 반응형 CSS
│       └── external/               # SDK 파일들
│           ├── cross-sdk.js        # 메인 SDK 파일
│           ├── index.es-*.js       # SDK 핵심 모듈
│           └── w3m-modal-*.js      # WalletConnect 모달
├── settings/                       # Cocos Creator 프로젝트 설정
│   ├── packages/
│   │   └── project-setting.json    # 프로젝트 설정
│   └── v2/packages/
│       └── project.json            # 프로젝트 메타데이터
└── package.json                    # 빌드 스크립트
```

### 핵심 파일 설명

| 파일             | 역할                     | 중요도 |
| ---------------- | ------------------------ | ------ |
| `CrossInit.ts`   | SDK 로드 및 초기화       | ⭐⭐⭐ |
| `SdkActions.ts`  | SDK 기능 구현 및 UI 연동 | ⭐⭐⭐ |
| `index.html`     | SDK 로드 및 HTML 설정    | ⭐⭐⭐ |
| `cross-sdk.js`   | Cross SDK 메인 파일      | ⭐⭐⭐ |
| `index.es-*.js`  | SDK 핵심 모듈 (의존성)   | ⭐⭐⭐ |
| `w3m-modal-*.js` | WalletConnect 모달 UI    | ⭐⭐⭐ |
| `style.css`      | 반응형 UI 스타일         | ⭐⭐   |

## ⚡ 빠른 시작

### 1. 프로젝트 설정

```bash
# 1. Cocos Creator 3.8.7 설치
# https://www.cocos.com/en/creator/download

# 2. 프로젝트 열기
# Cocos Creator에서 이 폴더를 프로젝트로 열기

# 3. 빌드 (선택사항)
npm run build
```

### 2. 개발 환경 실행

1. **Cocos Creator에서 프로젝트 열기**
2. **Scene 선택**: `assets/scene/home.scene`
3. **미리보기 실행**: 상단 메뉴 → Preview → Browser
4. **지갑 연결 테스트**: "Cross Connect" 버튼 클릭

### 3. 프로덕션 빌드

```bash
# 전체 빌드 (데스크톱 + 모바일)
npm run build

# 개별 플랫폼 빌드
npm run build:web-desktop   # 데스크톱용
npm run build:web-mobile    # 모바일용

# 빌드 결과 확인
ls dist/
```

## 🔧 SDK 통합 방법

### Step 1: Cross SDK 파일 준비

Cross SDK를 프로젝트에 통합하는 첫 번째 단계입니다.

```bash
# 1. Cross SDK 빌드 파일 다운로드
# https://github.com/your-org/cross-sdk-js/releases

# 2. 필수 SDK 파일들을 빌드 템플릿에 배치
# 메인 SDK 파일
cp cross-sdk.js build-templates/web-desktop/external/
cp cross-sdk.js build-templates/web-mobile/external/

# 의존성 파일들 (SDK와 함께 제공됨)
cp index.es-*.js build-templates/web-desktop/external/
cp index.es-*.js build-templates/web-mobile/external/

# WalletConnect 모달 파일들 (SDK와 함께 제공됨)
cp w3m-modal-*.js build-templates/web-desktop/external/
cp w3m-modal-*.js build-templates/web-mobile/external/
```

#### 필수 파일 목록

Cross SDK가 정상 작동하려면 다음 파일들이 모두 필요합니다:

| 파일             | 설명                            | 필수 여부 |
| ---------------- | ------------------------------- | --------- |
| `cross-sdk.js`   | 메인 SDK 파일                   | ⭐⭐⭐    |
| `index.es-*.js`  | SDK 핵심 모듈 (번들링된 의존성) | ⭐⭐⭐    |
| `w3m-modal-*.js` | WalletConnect 모달 UI           | ⭐⭐⭐    |

> **⚠️ 중요**: 파일명의 `*` 부분은 빌드 버전에 따라 달라질 수 있습니다 (예: `index.es-CDAPa9-C.js`, `w3m-modal-nO5exNeY.js`)

### Step 2: HTML 템플릿 설정

`build-templates/web-mobile/index.html` 및 `web-desktop/index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Your Game Title</title>

    <!-- 모바일 최적화 메타 태그 -->
    <meta
      name="viewport"
      content="width=device-width,user-scalable=no,initial-scale=1,minimum-scale=1,maximum-scale=1,minimal-ui=true,viewport-fit=cover"
    />
    <meta name="screen-orientation" content="landscape" />
    <meta name="apple-mobile-web-app-capable" content="yes" />

    <!-- CSS 스타일 -->
    <link rel="stylesheet" type="text/css" href="./style.css" />
  </head>
  <body>
    <!-- 게임 컨테이너 -->
    <div id="GameDiv" cc_exact_fit_screen="true" style="width: 100vw; height: 100vh">
      <div id="Cocos3dGameContainer">
        <canvas id="GameCanvas" width="1280" height="720" tabindex="99"></canvas>
      </div>
    </div>

    <!-- Cocos Creator 시스템 파일들 -->
    <script src="src/polyfills.bundle.js"></script>
    <script src="src/system.bundle.js"></script>
    <script src="src/import-map.json" type="systemjs-importmap"></script>

    <!-- Cross SDK 로드 -->
    <script type="module">
      import * as CrossSdk from './external/cross-sdk.js'

      // 전역 객체에 SDK 등록
      window.CrossSdk = CrossSdk
      console.log('[SDK] Cross SDK loaded:', !!window.CrossSdk)
    </script>

    <!-- 게임 시작 -->
    <script>
      System.import('./index.js').catch(function (err) {
        console.error('Game load error:', err)
      })
    </script>
  </body>
</html>
```

### Step 3: CrossInit.ts 구현

SDK 초기화를 담당하는 컴포넌트입니다.

```typescript
// assets/scripts/CrossInit.ts
import { Component, _decorator } from 'cc'

const { ccclass } = _decorator

declare global {
  interface Window {
    CrossSdk: any
    CrossSdkInstance?: any
    System?: any
  }
}

@ccclass('CrossInit')
export class CrossInit extends Component {
  async start() {
    // 1) SDK 로드 대기 (최대 8초)
    await this.waitForSdkLoad()

    // 2) SDK 초기화
    await this.initializeSdk()
  }

  private async waitForSdkLoad(): Promise<void> {
    return new Promise<void>(resolve => {
      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        if (window.CrossSdk || Date.now() - startTime > 8000) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }

  private async initializeSdk(): Promise<void> {
    // 폴백: SystemJS로 직접 로드 시도
    if (!window.CrossSdk && window.System?.import) {
      try {
        const basePath = location.pathname.replace(/index\.html?$/, '')
        const sdkPath = `${basePath}external/cross-sdk.js`
        const sdkModule = await window.System.import(sdkPath)
        window.CrossSdk = sdkModule
      } catch (error) {
        console.error('Failed to load SDK via SystemJS:', error)
      }
    }

    if (!window.CrossSdk) {
      throw new Error('Cross SDK not found. Check external/cross-sdk.js')
    }

    // SDK 초기화
    const config = {
      projectId: 'YOUR_PROJECT_ID', // Cross 팀에서 발급받은 프로젝트 ID
      redirectUrl: window.location.href,
      metadata: {
        name: 'Your Game Name',
        description: 'Your Game Description',
        url: 'https://yourgame.com',
        icons: ['https://yourgame.com/icon.png']
      },
      themeMode: 'dark' // 'light' | 'dark'
    }

    const instance = window.CrossSdk.initCrossSdk(
      config.projectId,
      config.redirectUrl,
      config.metadata,
      config.themeMode
    )

    window.CrossSdkInstance = instance
    console.log('✅ Cross SDK initialized successfully')
  }
}
```

### Step 4: SdkActions.ts 구현

SDK 기능을 실제로 사용하는 컴포넌트입니다.

```typescript
// assets/SdkActions.ts
import { Component, Label, _decorator } from 'cc'

const { ccclass, property } = _decorator

@ccclass('SdkActions')
export class SdkActions extends Component {
  @property(Label) connectButtonLabel: Label = null!
  @property(Label) addressLabel: Label = null!
  @property(Label) chainIdLabel: Label = null!
  @property(Label) balanceLabel: Label = null!

  // 지갑 연결
  async onClickConnect() {
    if (!window.CrossSdk) {
      console.error('SDK not loaded')
      return
    }

    try {
      // Cross Wallet 연결
      await window.CrossSdk.useAppKitWallet().connect('cross_wallet')

      // UI 업데이트
      this.updateUI()
      console.log('✅ Wallet connected')
    } catch (error) {
      console.error('❌ Connection failed:', error)
    }
  }

  // 지갑 해제
  async onClickDisconnect() {
    if (!window.CrossSdk) return

    try {
      await window.CrossSdk.ConnectionController.disconnect()
      this.updateUI()
      console.log('✅ Wallet disconnected')
    } catch (error) {
      console.error('❌ Disconnect failed:', error)
    }
  }

  // 네트워크 전환
  async onClickSwitchNetwork() {
    const instance = window.CrossSdkInstance
    if (!instance) return

    try {
      // Cross 테스트넷으로 전환
      await instance.switchNetwork(window.CrossSdk.crossTestnet)
      this.updateUI()
      console.log('✅ Network switched')
    } catch (error) {
      console.error('❌ Network switch failed:', error)
    }
  }

  // 토큰 전송
  async onClickSendToken() {
    if (!window.CrossSdk) return

    try {
      const result = await window.CrossSdk.SendController.sendNativeToken({
        receiverAddress: '0x742d35Cc6634C0532925a3b8D400e5e5c8c6c5e8',
        sendTokenAmount: 0.01, // 0.01 CROSS
        decimals: '18',
        customData: { metadata: 'Game reward' }
      })

      console.log('✅ Token sent:', result)
    } catch (error) {
      console.error('❌ Send failed:', error)
    }
  }

  // UI 업데이트
  private async updateUI() {
    try {
      const account = window.CrossSdk?.AccountController?.state
      const isConnected = account?.status === 'connected' && account?.address

      // 연결 상태 업데이트
      if (this.connectButtonLabel) {
        this.connectButtonLabel.string = isConnected ? 'Connected' : 'Connect'
      }

      // 주소 표시
      if (this.addressLabel) {
        this.addressLabel.string = isConnected
          ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
          : 'Not Connected'
      }

      // 체인 ID 표시
      if (this.chainIdLabel && isConnected) {
        const provider = await window.CrossSdkInstance?.getUniversalProvider()
        const chainId = await provider?.request({ method: 'eth_chainId' })
        this.chainIdLabel.string = chainId ? `Chain: ${parseInt(chainId, 16)}` : 'Unknown'
      }

      // 잔액 표시
      if (this.balanceLabel) {
        this.balanceLabel.string = account?.balance || '0'
      }
    } catch (error) {
      console.error('UI update failed:', error)
    }
  }

  // 컴포넌트 시작 시 UI 업데이트
  start() {
    // SDK 로드 대기 후 UI 업데이트
    setTimeout(() => {
      this.updateUI()

      // 상태 변화 구독
      if (window.CrossSdk?.AccountController?.subscribeKey) {
        window.CrossSdk.AccountController.subscribeKey('status', () => {
          this.updateUI()
        })
        window.CrossSdk.AccountController.subscribeKey('address', () => {
          this.updateUI()
        })
      }
    }, 1000)
  }
}
```

### Step 5: Cocos Creator 에디터 설정

1. **Scene에 컴포넌트 추가**:

   ```
   Canvas
   ├── CrossInit (Node + CrossInit 컴포넌트)
   └── UI
       └── SdkActions (Node + SdkActions 컴포넌트)
           ├── ConnectButton (Button)
           ├── AddressLabel (Label)
           ├── ChainLabel (Label)
           └── BalanceLabel (Label)
   ```

2. **컴포넌트 연결**:

   - SdkActions의 각 Label 프로퍼티에 해당 Label 노드 연결
   - Button의 Click Events에 SdkActions 메서드 연결

3. **빌드 설정**:
   - Project → Build Panel
   - Platform: Web Mobile/Desktop 선택
   - Template: Custom 선택 (build-templates 사용)

## 📝 핵심 코드 분석

### CrossInit.ts 상세 분석

```typescript
export class CrossInit extends Component {
  async start() {
    // 🔄 SDK 로드 대기
    await this.waitForSdkLoad()

    // ⚙️ SDK 초기화
    await this.initializeSdk()
  }

  private async waitForSdkLoad(): Promise<void> {
    // HTML에서 로드된 SDK를 최대 8초간 대기
    // 폴백으로 SystemJS 동적 로드 지원
  }

  private async initializeSdk(): Promise<void> {
    // 1. SDK 존재 확인
    // 2. 프로젝트 설정 구성
    // 3. SDK 인스턴스 생성 및 전역 등록
  }
}
```

**주요 특징**:

- ✅ **안정적 로드**: 여러 로드 방식 지원 (HTML import, SystemJS)
- ✅ **에러 처리**: 로드 실패 시 명확한 에러 메시지
- ✅ **전역 접근**: `window.CrossSdkInstance`로 어디서든 접근 가능

### SdkActions.ts 상세 분석

```typescript
@ccclass('SdkActions')
export class SdkActions extends Component {
  // 🎯 UI 바인딩
  @property(Label) connectButtonLabel: Label = null!
  @property(Label) addressLabel: Label = null!

  // 🔗 지갑 연결
  async onClickConnect() {
    await window.CrossSdk.useAppKitWallet().connect('cross_wallet')
    this.updateUI()
  }

  // 🔄 네트워크 전환
  async onClickSwitchNetwork() {
    await instance.switchNetwork(window.CrossSdk.crossTestnet)
  }

  // 💰 토큰 전송
  async onClickSendToken() {
    await window.CrossSdk.SendController.sendNativeToken({...})
  }
}
```

**주요 특징**:

- ✅ **UI 연동**: Cocos Creator Label과 직접 연결
- ✅ **상태 관리**: SDK 상태 변화 자동 감지 및 UI 업데이트
- ✅ **에러 처리**: 각 기능별 독립적 에러 처리

### 지원하는 SDK 기능

#### 1. 지갑 관리

```typescript
// 지갑 연결
await CrossSdk.useAppKitWallet().connect('cross_wallet')
await CrossSdk.useAppKitWallet().connect('metamask')

// 지갑 해제
await CrossSdk.ConnectionController.disconnect()

// 연결 상태 확인
const account = CrossSdk.AccountController.state
const isConnected = account.status === 'connected'
```

#### 2. 네트워크 전환

```typescript
// 지원 네트워크
const networks = {
  crossTestnet: CrossSdk.crossTestnet, // Cross 테스트넷
  crossMainnet: CrossSdk.crossMainnet, // Cross 메인넷
  ethereum: CrossSdk.etherMainnet, // 이더리움
  bsc: CrossSdk.bscMainnet, // BSC
  kaia: CrossSdk.kaiaMainnet // Kaia
}

// 네트워크 전환
await instance.switchNetwork(networks.crossTestnet)
```

#### 3. 토큰 전송

```typescript
// 네이티브 토큰 전송
await CrossSdk.SendController.sendNativeToken({
  receiverAddress: '0x...',
  sendTokenAmount: 1.0,
  decimals: '18',
  customData: { metadata: 'Game reward' }
})

// ERC-20 토큰 전송
await CrossSdk.SendController.sendERC20Token({
  receiverAddress: '0x...',
  contractAddress: 'eip155:1:0x...',
  sendTokenAmount: 100,
  decimals: '18'
})
```

#### 4. 스마트 컨트랙트

```typescript
// 컨트랙트 읽기
const result = await CrossSdk.ConnectionController.readContract({
  contractAddress: '0x...',
  method: 'balanceOf',
  abi: contractABI,
  args: ['0x...']
})

// 컨트랙트 쓰기
const tx = await CrossSdk.ConnectionController.writeContract({
  fromAddress: '0x...',
  contractAddress: '0x...',
  method: 'transfer',
  abi: contractABI,
  args: ['0x...', '1000000000000000000']
})
```

#### 5. 메시지 서명

```typescript
// 일반 메시지 서명
const signature = await CrossSdk.ConnectionController.signMessage({
  message: 'Hello World',
  customData: { metadata: 'Game login' }
})

// EIP-712 타입 데이터 서명
const typedSignature = await CrossSdk.ConnectionController.signTypedDataV4({
  types: { ... },
  primaryType: 'Mail',
  domain: { ... },
  message: { ... }
})
```

## 🚀 빌드 및 배포

### 로컬 빌드 프로세스

```bash
# 1. 프로젝트 빌드
npm run build

# 2. 빌드 결과 확인
ls dist/
# dist/
# ├── web-desktop/    # 데스크톱 웹 빌드
# └── web-mobile/     # 모바일 웹 빌드

# 3. 로컬 서버 실행 (테스트용)
cd dist/web-mobile
python -m http.server 8000
# 또는
npx serve .
```

### 빌드 템플릿 시스템

Cocos Creator는 빌드 시 `build-templates/` 폴더의 내용을 사용합니다:

```
build-templates/
├── web-desktop/
│   ├── index.html          # 🔧 HTML 템플릿
│   ├── style.css           # 🎨 CSS 스타일
│   └── external/           # 📦 SDK 파일들
│       ├── cross-sdk.js    # 메인 SDK 파일
│       ├── index.es-*.js   # SDK 핵심 모듈
│       └── w3m-modal-*.js  # WalletConnect 모달
└── web-mobile/
    ├── index.html          # 📱 모바일 최적화 HTML
    ├── style.css           # 📱 반응형 CSS
    └── external/           # 📦 SDK 파일들
        ├── cross-sdk.js    # 메인 SDK 파일
        ├── index.es-*.js   # SDK 핵심 모듈
        └── w3m-modal-*.js  # WalletConnect 모달
```

**빌드 프로세스**:

1. Cocos Creator가 게임 로직을 컴파일
2. `build-templates/` 내용을 빌드 결과에 복사
3. SDK 파일이 `external/` 폴더에서 자동으로 포함됨
4. HTML 템플릿이 게임과 SDK를 연결

## 📱 모바일 최적화

### 반응형 디자인 설정

현재 프로젝트는 모바일 가로형으로 최적화되어 있습니다:

#### 1. 화면 설정

```json
// settings/packages/project-setting.json
{
  "general": {
    "designResolution": {
      "width": 960, // 가로형 해상도
      "height": 640,
      "fitWidth": true, // 너비 맞춤
      "fitHeight": true // 높이 맞춤
    }
  }
}
```

#### 2. HTML 메타 태그

```html
<!-- 모바일 최적화 -->
<meta
  name="viewport"
  content="width=device-width,user-scalable=no,initial-scale=1,minimum-scale=1,maximum-scale=1,minimal-ui=true,viewport-fit=cover"
/>
<meta name="screen-orientation" content="landscape" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

#### 3. CSS 반응형 스타일

```css
/* 전체 화면 사용 */
#GameDiv {
  width: 100vw !important;
  height: 100vh !important;
}

/* 다양한 화면 비율 대응 */
@media screen and (orientation: landscape) {
  /* 가로형 최적화 */
}

@media screen and (orientation: portrait) {
  /* 세로형 대응 */
}

/* 노치 대응 */
@supports (padding: max(0px)) {
  body {
    padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right))
      max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  }
}
```

## 🐛 문제 해결

### 자주 발생하는 문제들

#### 1. SDK 로드 실패

```
❌ Error: Cross SDK not found on window
```

**해결 방법**:

```bash
# 1. SDK 파일 존재 확인
ls build-templates/web-mobile/external/cross-sdk.js

# 2. HTML 템플릿 확인
grep "cross-sdk.js" build-templates/web-mobile/index.html

# 3. 브라우저 콘솔에서 확인
console.log(window.CrossSdk)
```

#### 2. 빌드 후 SDK 동작 안함

**해결 방법**:

```bash
# 1. 빌드 템플릿에 모든 파일 존재 확인
ls build-templates/web-mobile/external/
# 필요한 파일들: cross-sdk.js, index.es-*.js, w3m-modal-*.js

# 2. 빌드 결과에 모든 파일 복사되었는지 확인
ls dist/web-mobile/external/
# 빌드 템플릿과 동일한 파일들이 있어야 함

# 3. 상대 경로 확인
# HTML에서 './external/cross-sdk.js' 경로가 올바른지 확인

# 4. 파일 권한 및 MIME 타입 확인
# 웹 서버에서 .js 파일이 올바른 Content-Type으로 서빙되는지 확인
```

### 디버깅 도구

#### 1. SDK 상태 확인

```typescript
// 개발자 콘솔에서 실행
console.log('SDK Status:', {
  loaded: !!window.CrossSdk,
  initialized: !!window.CrossSdkInstance,
  account: window.CrossSdk?.AccountController?.state,
  network: window.CrossSdk?.NetworkController?.state
})
```

#### 2. 네트워크 요청 모니터링

```typescript
// 네트워크 요청 로깅
const originalFetch = window.fetch
window.fetch = function (...args) {
  console.log('Fetch request:', args[0])
  return originalFetch.apply(this, args)
}
```

#### 3. 에러 추적

```typescript
// 전역 에러 핸들러
window.addEventListener('error', event => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
})
```

## 📞 지원 및 문의

- **기술 문의**: [Cross 개발자 포털](https://developers.cross.io)
- **SDK 문서**: [Cross SDK 가이드](https://docs.cross.io/sdk)
- **커뮤니티**: [Discord](https://discord.gg/cross)
- **이슈 리포트**: [GitHub Issues](https://github.com/cross-org/cross-sdk-js/issues)
