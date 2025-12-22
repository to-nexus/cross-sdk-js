# CROSSx WebApp SDK - Quick Start Guide

완벽한 시작 가이드입니다! 모든 준비가 완료되었습니다. 🎉

## 📦 설치

### NPM 패키지로 설치 (프로덕션)

```bash
npm install @to-nexus/webapp
# 또는
pnpm add @to-nexus/webapp
```

### 개발 환경에서 설치 (이 리포지토리)

```bash
cd /Users/chuck/Documents/GitHub/cross-sdk-js
pnpm install
```

## 🎮 예제 실행

### 방법 1: WebApp 예제 실행 (권장)

```bash
# 루트 디렉토리에서
pnpm example:webapp
```

브라우저가 자동으로 열리고 `http://localhost:5174`에 접속됩니다.

**두 가지 페이지 제공:**

- **`/index.html`** - API 테스트 & 학습용
- **`/game.html`** - 실제 게임 예제

### 방법 2: 직접 실행

```bash
cd examples/sdk-webapp
pnpm install
pnpm dev
```

### 방법 3: 빌드 후 실행

```bash
pnpm example:webapp:build

# 프로덕션 빌드 결과
cd examples/sdk-webapp
pnpm preview
```

## 🚀 기본 사용법

### 1. SDK 임포트

```typescript
import { CROSSxWebApp } from '@to-nexus/webapp'
```

### 2. WebApp 준비 신호

```typescript
// 앱이 초기화 완료되면 호출
CROSSxWebApp.ready()
```

### 3. 라이프사이클 이벤트 처리

```typescript
// WebApp이 닫힐 때
CROSSxWebApp.on('viewClosed', () => {
  console.log('앱이 닫힘 - 상태 저장')
  saveGameState()
})

// 앱이 백그라운드로 갈 때
CROSSxWebApp.on('viewBackgrounded', () => {
  console.log('앱이 백그라운드로 감 - 게임 일시중지')
  pauseGame()
})
```

### 4. 전체화면 요청

```typescript
// 게임을 전체화면으로 표시
CROSSxWebApp.requestFullScreen()

// Safe area를 포함하여 전체화면
CROSSxWebApp.requestFullScreen({ isExpandSafeArea: true })
```

### 5. Safe Area 인셋 가져오기

```typescript
// Safe area 인셋 (노치, 상태바, 홈 인디케이터 등)
const insets = await CROSSxWebApp.getSafeAreaInsets()
console.log(insets)
// { top: 50, bottom: 34, left: 0, right: 0 }

// 콘텐츠에 패딩 적용
const contentElement = document.getElementById('content')
contentElement.style.paddingTop = `${insets.top}px`
contentElement.style.paddingBottom = `${insets.bottom}px`
```

### 6. SDK 버전 확인

```typescript
console.log(`SDK Version: ${CROSSxWebApp.version}`)
```

## 💻 전체 예제

### 게임 통합 예제

```typescript
import { CROSSxWebApp, isCROSSxEnvironment } from '@to-nexus/webapp'

class MyGame {
  constructor() {
    this.init()
  }

  private async init() {
    // 1. SDK가 준비되었음을 알림
    CROSSxWebApp.ready()

    // 2. Safe area 인셋 가져오기
    const insets = await CROSSxWebApp.getSafeAreaInsets()
    this.applySafeAreaInsets(insets)

    // 3. 전체화면 요청
    CROSSxWebApp.requestFullScreen({ isExpandSafeArea: true })

    // 4. 라이프사이클 이벤트 등록
    CROSSxWebApp.on('viewBackgrounded', () => {
      this.pauseGame()
    })

    CROSSxWebApp.on('viewClosed', () => {
      this.saveProgress()
      this.cleanup()
    })

    console.log(`Running in: ${isCROSSxEnvironment() ? 'CROSSx' : 'Browser'}`)
    console.log(`SDK Version: ${CROSSxWebApp.version}`)
    console.log(`Safe Area Insets:`, insets)
  }

  private applySafeAreaInsets(insets: {
    top: number
    bottom: number
    left: number
    right: number
  }) {
    const contentElement = document.getElementById('content')
    if (contentElement) {
      contentElement.style.paddingTop = `${insets.top}px`
      contentElement.style.paddingBottom = `${insets.bottom}px`
      contentElement.style.paddingLeft = `${insets.left}px`
      contentElement.style.paddingRight = `${insets.right}px`
    }
  }

  private pauseGame() {
    console.log('게임 일시중지')
    // 게임 일시중지 로직
  }

  private saveProgress() {
    console.log('진행 상황 저장')
    // 진행 상황 저장 로직
  }

  private cleanup() {
    console.log('정리')
    // 자원 해제 로직
  }
}

// 시작
const game = new MyGame()
```

## 🧪 테스트 환경에서 이벤트 시뮬레이션

**Mock 모드 (브라우저)에서만 사용 가능:**

```typescript
// viewClosed 이벤트 시뮬레이션
if (CROSSxWebApp._simulateClose) {
  CROSSxWebApp._simulateClose()
}

// viewBackgrounded 이벤트 시뮬레이션
if (CROSSxWebApp._simulateBackgrounded) {
  CROSSxWebApp._simulateBackgrounded()
}
```

## 🔍 환경 감지

```typescript
import { getEnvironmentType, isCROSSxEnvironment } from '@to-nexus/webapp'

// CROSSx 환경 확인
if (isCROSSxEnvironment()) {
  console.log('CROSSx 앱에서 실행 중')
  // CROSSx 전용 기능 사용
  CROSSxWebApp.requestFullScreen()
} else {
  console.log('브라우저에서 실행 중 (Mock 모드)')
  // 개발/테스트 기능 사용
}

// 현재 환경 타입 가져오기
const env = getEnvironmentType() // 'crossx' | 'browser'
```

## 📱 CDN 사용 (HTML에서 직접)

```html
<!-- 글로벌로 주입됨 -->
<script src="https://sdk.crossx.io/crossx-webapp.umd.js"></script>

<script>
  // window.CROSSx.WebApp으로 접근 가능
  window.CROSSx.WebApp.ready()

  console.log(window.CROSSx.WebApp.version)

  window.CROSSx.WebApp.on('viewClosed', () => {
    console.log('앱 닫힘')
  })
</script>
```

## 🎯 API 완전 레퍼런스

### 속성 (Properties)

| 속성      | 타입     | 설명     |
| --------- | -------- | -------- |
| `version` | `string` | SDK 버전 |

### 메서드 (Methods)

| 메서드                    | 설명                    | 반환값                    |
| ------------------------- | ----------------------- | ------------------------- |
| `ready()`                 | WebApp 준비 완료 신호   | `void`                    |
| `requestFullScreen()`     | 전체 화면 요청          | `Promise<void>`           |
| `getSafeAreaInsets()`     | Safe Area 인셋 가져오기 | `Promise<SafeAreaInsets>` |
| `hapticFeedback(type)`    | 햅틱 피드백 실행        | `void`                    |
| `on(event, callback)`     | 이벤트 리스너 등록      | `void`                    |
| `off(event, callback)`    | 이벤트 리스너 제거      | `void`                    |

### 이벤트 (Events)

| 이벤트             | 설명                 | 타이밍                           |
| ------------------ | -------------------- | -------------------------------- |
| `viewClosed`       | WebView가 닫힘       | 사용자가 앱 닫을 때              |
| `viewBackgrounded` | 앱이 백그라운드로 감 | 홈 버튼 누르거나 다른 앱 실행 시 |

## ⚠️ 주의사항

### 1. ready() 호출 필수

```typescript
// ✅ 필수: 앱 초기화 후 호출
CROSSxWebApp.ready()

// ❌ 호출하지 않으면 native와 통신 불가
```

### 2. 라이프사이클 이벤트 처리

```typescript
// ✅ 좋음: 상태 저장 후 종료
CROSSxWebApp.on('viewClosed', () => {
  saveState()
  cleanup()
})

// ❌ 나쁨: 이벤트를 무시하면 데이터 손실 가능
```

### 3. 에러 처리

```typescript
// ✅ 좋음: 에러 처리
CROSSxWebApp.requestFullScreen().catch(error => {
  console.error('요청 실패:', error)
})

// ❌ 나쁨: 에러 무시
CROSSxWebApp.requestFullScreen()
```

## 🐛 디버깅

### 콘솔 로그 확인

```typescript
// Mock 모드에서는 console.log로 디버그 정보 출력
// [MOCK] 접두사로 모든 호출이 로깅됨
```

### 환경 확인

```typescript
// 현재 환경 출력
console.log('Environment:', getEnvironmentType())
console.log('Is CROSSx:', isCROSSxEnvironment())
console.log('SDK Version:', CROSSxWebApp.version)
```

### 이벤트 로깅

```typescript
CROSSxWebApp.on('viewClosed', () => {
  console.log('✅ viewClosed event received')
})

CROSSxWebApp.on('viewBackgrounded', () => {
  console.log('⚠️ viewBackgrounded event received')
})
```

## 📚 더 알아보기

- [**SDK 전체 문서**](./README.md)
- [**아키텍처 상세**](./STRUCTURE.md)
- [**Native Bridge 규격**](./NATIVE_BRIDGE.md)
- [**Wallet 통신 규격**](./WALLET_INTEGRATION.md)
- [**예제 코드**](../examples/sdk-webapp/)

## 🆘 자주 묻는 질문

### Q: Mock 모드와 Real 모드의 차이?

**Mock 모드 (브라우저):**

- 모든 기능이 작동하지만 실제 동작 안 함
- 콘솔 로그만 출력
- 이벤트를 수동으로 시뮬레이션 가능

**Real 모드 (CROSSx):**

- 실제 native 기능 호출
- native에서 응답 받음
- 실제 이벤트 수신

### Q: 언제 ready()를 호출해야 하나?

앱이 완전히 로드되고 사용자와 상호작용할 준비가 되었을 때 호출하세요.

```typescript
// 게임
function setupGame() {
  loadAssets() // 에셋 로드
  initGame() // 게임 초기화
  // ✅ 여기서 호출
  CROSSxWebApp.ready()
}
```

### Q: 여러 이벤트 리스너를 등록할 수 있나?

네, 여러 개 등록 가능합니다:

```typescript
CROSSxWebApp.on('viewClosed', () => console.log('1'))
CROSSxWebApp.on('viewClosed', () => console.log('2'))
// 둘 다 호출됨
```

### Q: 프로덕션 배포는?

```bash
# 1. 빌드
pnpm build

# 2. dist 폴더의 파일 배포
# npm에 배포하거나 CDN에 호스팅

# 3. 게임에서 import 또는 스크립트 태그로 사용
```

## 🎉 준비 완료!

축하합니다! 이제 CROSSx WebApp SDK로 멋진 게임을 만들 준비가 되었습니다!

**다음 단계:**

1. ✅ 예제 실행: `pnpm example:webapp`
2. 📖 API 문서 읽기
3. 🎮 게임 만들기
4. 🚀 배포하기

행운을 빕니다! 🍀
