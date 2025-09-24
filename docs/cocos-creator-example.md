# Cross SDK Cocos Creator 예제

## 개요

이 예제는 Cross SDK를 Cocos Creator 3.8.7 웹/모바일 플랫폼에 통합하는 방법을 보여줍니다. 지갑 연결 관리, 트랜잭션 처리, 실시간 UI 업데이트를 포함한 완전한 지갑 통합을 제공합니다.

## 프로젝트 구조

```
examples/cocos-creator/
├── assets/
│   ├── scripts/
│   │   └── CrossInit.ts          # SDK 초기화 스크립트
│   └── SdkActions.ts             # 메인 SDK 상호작용 컴포넌트
├── build-templates/
│   ├── web-mobile/
│   │   ├── index.html            # SDK 임포트가 포함된 모바일 웹 템플릿
│   │   └── external/
│   │       ├── cross-sdk.js      # Cross SDK CDN 번들
│   │       └── index.es-*.js     # SDK 의존성
│   ├── web-desktop/              # 데스크톱 웹 템플릿 (동일 구조)
│   ├── android/                  # 안드로이드 빌드 템플릿
│   └── ios/                      # iOS 빌드 템플릿
└── package.json                  # Cocos Creator 프로젝트 설정
```

## 구현된 기능

### 1. 지갑 연결 관리

- CrossKit 프로토콜을 통한 Cross Wallet 연결
- 적절한 정리를 포함한 지갑 연결 해제
- 실시간 연결 상태 업데이트
- Cross Connect ↔ Cross Connected 버튼 라벨 토글

### 2. 네트워크 관리

- Cross Testnet(612044)과 Cross Mainnet(612055) 간 전환
- 네트워크 전환 후 자동 잔액 새로고침
- 네트워크별 컨트랙트 주소 처리

### 3. 사용자 정보 표시

- 실시간 지갑 주소 표시
- 적절한 파싱(16진수/10진수 지원)을 포함한 현재 체인 ID
- 심볼이 포함된 네이티브 토큰 잔액
- 상태 구독을 통한 자동 UI 업데이트

### 4. 트랜잭션 작업

- **네이티브 토큰 전송**: 커스텀 메타데이터와 함께 CROSS 토큰 전송
- **ERC20 토큰 전송**: CAIP-2 주소 형식으로 ERC20 토큰 전송
- **메시지 서명**: 커스텀 데이터와 함께 개인 서명
- **EIP-191 서명**: 이더리움 메시지 서명
- **EIP-712 서명**: 샘플 스키마와 함께 타입 데이터 서명

### 5. 고급 기능

- **ENS 조회**: ENS 이름을 주소와 아바타 URL로 조회
- **가스 추정**: 트랜잭션 가스 비용 추정
- **단위 변환**: 이더와 wei 간 파싱/포맷팅
- **토큰 잔액 조회**: 사용자의 토큰 잔액 검색
- **세션 관리**: 수동 세션 검증 및 정리
- **강제 연결 해제**: 긴급 세션 종료

### 6. 프로바이더 통합

- UniversalProvider 세션 토픽 검색
- 직접 프로바이더 요청 (eth_chainId 등)
- 확장 지갑 감지 및 처리

## 설정 가이드

### 1. 필수 조건

- Cocos Creator 3.8.7 이상
- Node.js 16+ (빌드 도구용)
- Cross SDK CDN 파일

### 2. 프로젝트 설정

#### a) Cross SDK 파일 가져오기

다음 파일들을 `build-templates/{platform}/external/`에 복사:

```
external/
├── cross-sdk.js                 # 메인 SDK 번들
├── index.es-*.js         # 핵심 의존성
└── w3m-modal-*.js        # 모달 UI 컴포넌트
```

#### b) 빌드 템플릿 구성

`build-templates/{platform}/index.html`을 업데이트하여 SDK 임포트:

```html
<!-- Cross SDK를 ES 모듈로 임포트 -->
<script type="module">
  import * as CrossSdk from './external/cross-sdk.js'

  window.CrossSdk = CrossSdk
  console.log('[SDK] 모듈 로드됨:', !!window.CrossSdk)
</script>
```

#### c) 씬에 SDK 컴포넌트 추가

1. 씬에 빈 GameObject 생성
2. SDK 초기화를 위한 `CrossInit` 컴포넌트 첨부
3. 지갑 상호작용을 위한 `SdkActions` 컴포넌트 첨부
4. UI Label을 `SdkActions` 속성에 바인딩:
   - `connectButtonLabel`: 연결 상태 버튼
   - `addressLabel`: 사용자 지갑 주소 표시
   - `chainIdLabel`: 현재 체인 ID 표시
   - `nativeBalanceLabel`: 네이티브 토큰 잔액 표시

### 3. SDK 구성

#### a) 프로젝트 ID 설정

`CrossInit.ts`에서 프로젝트 ID 업데이트:

```typescript
const projectId = 'your-project-id-here' // Cross 팀에서 받은 ID
```

#### b) 네트워크 구성

예제는 컨트랙트 매핑과 함께 여러 네트워크를 지원:

```typescript
const contractData = {
  612044: {
    // Cross Testnet
    coin: 'CROSS',
    erc20: '0xe934057Ac314cD9bA9BC17AE2378959fd39Aa2E3',
    erc721: '0xaD31a95fE6bAc89Bc4Cf84dEfb23ebBCA080c013'
  },
  612055: {
    // Cross Mainnet
    coin: 'CROSS',
    erc20: '0xe9013a5231BEB721f4F801F2d07516b8ca19d953',
    erc721: ''
  }
  // 추가 네트워크...
}
```

## 코드 구현

### 1. SDK 초기화 (CrossInit.ts)

```typescript
@ccclass('CrossInit')
export class CrossInit extends Component {
  async start() {
    // 템플릿에서 SDK 로드를 기다림
    await new Promise<void>(resolve => {
      const start = Date.now()
      const t = setInterval(() => {
        if (window.CrossSdk || Date.now() - start > 8000) {
          clearInterval(t)
          resolve()
        }
      }, 100)
    })

    // 폴백: 로드되지 않았다면 SystemJS로 로드
    if (!window.CrossSdk && window.System?.import) {
      const base = location.pathname.replace(/index\.html?$/, '')
      const mod = await window.System.import(`${base}external/cross-sdk.js`)
      window.CrossSdk = mod
    }

    if (!window.CrossSdk) {
      throw new Error('CrossSdk를 찾을 수 없습니다. 템플릿 임포트를 확인하세요.')
    }

    // 프로젝트 구성으로 SDK 초기화
    const projectId = 'your-project-id-here' // Cross 팀에서 발급받은 실제 프로젝트 ID
    const redirectUrl = window.location.href
    const metadata = {
      name: 'Cross SDK',
      description: 'Cross SDK in Cocos',
      url: 'https://to.nexus',
      icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
    }

    // 글로벌 SDK 인스턴스 생성
    const instance = window.CrossSdk.initCrossSdk(projectId, redirectUrl, metadata, 'dark')
    window.CrossSdkInstance = instance
  }
}
```

### 2. 지갑 연결 (SdkActions.ts)

```typescript
// Cross Wallet에 연결
async onClickConnect() {
  if (!window.CrossSdk) {
    alert('SDK가 로드되지 않았습니다')
    return
  }

  await window.CrossSdk.useAppKitWallet().connect('cross_wallet')

  // 연결 후 UI 업데이트
  this.updateConnectButtonLabel()
  try {
    await this.refreshBalances()
  } catch {}
  await this.updateSummaryLabels()
}

// 지갑 연결 해제
async onClickDisconnect() {
  if (!window.CrossSdk) return

  await window.CrossSdk.ConnectionController.disconnect()
  this.updateConnectButtonLabel()
  await this.updateSummaryLabels()
}
```

### 3. 실시간 UI 업데이트

```typescript
// 연결 버튼 라벨 업데이트
updateConnectButtonLabel() {
  if (!this.connectButtonLabel) return

  const status = window.CrossSdk?.AccountController?.state?.status
  const address = window.CrossSdk?.AccountController?.state?.address
  const connected = status === 'connected' && Boolean(address)

  this.connectButtonLabel.string = connected ? 'Cross\nConnected' : 'Cross\nConnect'
}

// 사용자 정보 라벨 업데이트
async updateSummaryLabels() {
  try {
    const summary = await this.getSdkSummary()

    if (this.addressLabel)
      this.addressLabel.string = summary.address || '연결되지 않음'
    if (this.chainIdLabel)
      this.chainIdLabel.string = summary.chainId ? `${summary.chainId}` : '-'
    if (this.nativeBalanceLabel)
      this.nativeBalanceLabel.string = summary.nativeBalance
        ? `${summary.nativeBalance}`.trim() : '-'
  } catch (e) {
    // 오류 시 기본값으로 리셋
    if (this.addressLabel) this.addressLabel.string = '연결되지 않음'
    if (this.chainIdLabel) this.chainIdLabel.string = '-'
    if (this.nativeBalanceLabel) this.nativeBalanceLabel.string = '-'
  }
}

// 실시간 상태 변경 구독
async start() {
  // 초기 설정
  await this.warmupProviderIfAny()
  const active = await this.checkInitialSessionActive()
  this.updateConnectButtonLabel()
  await this.updateSummaryLabels()

  // 상태 변경 구독
  if (window.CrossSdk?.AccountController?.subscribeKey) {
    this._unsubs.push(
      window.CrossSdk.AccountController.subscribeKey('status', () => {
        this.updateConnectButtonLabel()
        this.updateSummaryLabels()
      }),
      window.CrossSdk.AccountController.subscribeKey('address', () => {
        this.updateConnectButtonLabel()
        this.updateSummaryLabels()
      }),
      window.CrossSdk.AccountController.subscribeKey('balance', () => {
        this.updateSummaryLabels()
      }),
      window.CrossSdk.AccountController.subscribeKey('balanceSymbol', () => {
        this.updateSummaryLabels()
      })
    )
  }

  // 포커스 이벤트 처리 (모바일 딥링크)
  window.addEventListener('focus', () => setTimeout(() => {
    this.updateConnectButtonLabel()
    this.updateSummaryLabels()
  }, 300), { passive: true })
}
```

### 4. 트랜잭션 예제

```typescript
// 네이티브 토큰 전송
async onClickSendNative() {
  if (!window.CrossSdk) return alert('SDK가 로드되지 않았습니다')

  try {
    const resTx = await window.CrossSdk.SendController.sendNativeToken({
      data: '0x',
      receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
      sendTokenAmount: 1,
      decimals: '18',
      customData: { metadata: 'Cocos 데모' },
      type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.LEGACY // LEGACY or DYNAMIC
    })
    alert(JSON.stringify(resTx))
  } catch (e) {
    alert((e as Error).message)
  }
}

// ERC20 토큰 전송 (CAIP-2 형식 필요)
async onClickSendERC20() {
  if (!window.CrossSdk) return alert('SDK가 로드되지 않았습니다')

  try {
    const { chainId } = await this.getSdkSummary()
    if (!chainId) return alert('먼저 지갑을 연결하세요')

    const erc20 = contractData[chainId as keyof typeof contractData]?.erc20
    if (!erc20) return alert('이 네트워크에는 ERC20 컨트랙트가 없습니다')

    const caipContract = `eip155:${chainId}:${erc20}`

    const resTx = await window.CrossSdk.SendController.sendERC20Token({
      receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
      contractAddress: caipContract, // CAIP-2 형식 필수
      sendTokenAmount: 1,
      decimals: '18',
      type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.LEGACY // LEGACY or DYNAMIC
    })
    alert(JSON.stringify(resTx))
  } catch (e) {
    alert((e as Error).message)
  }
}
```

### 5. 네트워크 전환

```typescript
async onClickSwitchToCross() {
  const instance = window.CrossSdkInstance
  if (!instance) return alert('SDK가 초기화되지 않았습니다')

  const { chainId } = await this.getSdkSummary()
  // 테스트넷(612044)과 메인넷(612055) 간 토글
  const target = chainId === 612044
    ? window.CrossSdk.crossMainnet
    : window.CrossSdk.crossTestnet

  try {
    // 적절한 상태 동기화를 위해 AppKit의 switchNetwork 사용
    await instance.switchNetwork(target)
    this.updateConnectButtonLabel()
    await this.updateSummaryLabels()
  } catch (e) {
    alert((e as Error).message || '네트워크 전환 실패')
  }
}
```

## 빌드 및 배포

### 1. 웹 빌드

```bash
# 웹 플랫폼용 빌드
cocos build --platform web-mobile --mode release
cocos build --platform web-desktop --mode release
```

### 2. 모바일 빌드

#### 안드로이드

1. Android SDK/NDK 설치 (안드로이드 설정 요구사항 참조)
2. 서명 인증서 구성
3. 빌드: `cocos build --platform android --mode release`

#### iOS

1. Xcode 및 iOS SDK 설치
2. Apple Developer 인증서 구성
3. 빌드: `cocos build --platform ios --mode release`

## 중요 사항

### 1. SDK 로딩

- Cross SDK는 ES 모듈로 로드되어야 함 (`type="module"`)
- 템플릿은 Cocos 초기화 전에 SDK 임포트를 포함해야 함
- 개발용 SystemJS를 통한 폴백 로딩 사용

### 2. CAIP-2 주소 형식

- ERC20 전송은 CAIP-2 형식이 필요: `eip155:{chainId}:{contractAddress}`
- 네이티브 전송은 일반 주소 사용: `0x...`

### 3. 상태 관리

- 실시간 UI 업데이트를 위해 `AccountController` 상태 변경 구독
- 포커스 이벤트 리스너로 모바일 딥링크 시나리오 처리
- 메모리 누수 방지를 위해 `onDestroy()`에서 적절한 정리 구현

### 4. 오류 처리

- 항상 SDK 호출을 try-catch 블록으로 감싸기
- 사용자에게 의미 있는 오류 메시지 제공
- 작업 전 연결 상태 가드 구현

### 5. 네트워크 호환성

- 대상 네트워크에 대해 컨트랙트 주소가 구성되었는지 확인
- 원시 프로바이더 호출 대신 AppKit의 `switchNetwork()` 사용
- 트랜잭션 전 체인 호환성 검증

## 문제 해결

### 일반적인 문제

1. **"SDK가 로드되지 않았습니다" 오류**

   - 빌드 템플릿에 적절한 스크립트 임포트가 포함되어 있는지 확인
   - 외부 SDK 파일이 빌드 출력에 복사되었는지 확인
   - `type="module"`로 ES 모듈 로딩 확인

2. **"import 문을 사용할 수 없습니다" 오류**

   - SDK 스크립트 태그에 `type="module"` 추가
   - SystemJS 폴리필이 먼저 로드되었는지 확인

3. **"잘못된 컨트랙트 대상"으로 ERC20 전송 실패**

   - CAIP-2 형식 사용: `eip155:{chainId}:{contractAddress}`
   - 현재 네트워크에 컨트랙트 주소가 존재하는지 확인

4. **연결 후 UI가 업데이트되지 않음**

   - `start()`에서 상태 구독 설정 확인
   - Cocos 에디터에서 라벨 바인딩 확인
   - 모바일용 포커스 이벤트 핸들러 구현

5. **빌드 실패**
   - 안드로이드: NDK/SDK 버전 및 서명 설정 확인
   - iOS: Xcode 인증서 및 배포 대상 확인
   - 웹: 빌드 템플릿에 외부 파일이 포함되었는지 확인

## 지원

기술 지원 및 질문:

- Cross SDK 문서: [Cross SDK Docs](https://docs.crosstoken.io)
- 연락처: Cross Development Team

## 라이선스

이 예제는 Cross SDK와 동일한 라이선스 하에 제공됩니다.
