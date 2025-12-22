# WebApp Kit 구현 및 Native Bridge 기능 추가

## 📋 개요

WebView 환경에서 동작하는 WebApp SDK를 구현하고, Native Bridge를 통한 네이티브 앱과의 통신 기능을 추가했습니다.

## 🎯 주요 변경 사항

### 1. 새로운 WebApp 패키지 추가 (`@to-nexus/webapp`)

#### 핵심 기능

- **Native Bridge**: WebView와 네이티브 앱 간 양방향 통신 인터페이스 (JSON-RPC 2.0)
- **Browser Detection**: User Agent 대신 Marker 기반의 정확한 브라우저 판별
- **Safe Area Management**: 노치, 상태바 등 Safe Area 인셋 정보 제공
- **Haptic Feedback**: 7가지 햅틱 피드백 타입 지원
- **Event System**: 라이프사이클 이벤트 수신 (viewClosed, viewBackgrounded)
- **Mock Module**: 개발 및 테스트를 위한 Mock 구현

#### 구현된 파일

```
packages/webapp/
├── src/
│   ├── index.ts              # 메인 export
│   ├── detector.ts           # 브라우저 감지 (88줄)
│   ├── types.ts              # 타입 정의 (101줄)
│   ├── webapp/
│   │   ├── bridge.ts         # Native Bridge 구현 (127줄)
│   │   └── index.ts          # WebApp 메인 로직 (119줄)
│   ├── mock/
│   │   └── index.ts          # Mock 구현 (116줄)
│   └── __tests__/
│       └── basic.spec.ts     # 테스트 (101줄)
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

### 2. 예제 프로젝트 추가

#### 새로운 예제

- **sdk-webapp**: WebApp SDK 기본 사용 예제

  - HTML 기반 간단한 통합 예제
  - 515줄의 완전한 예제 코드

- **sdk-webapp-outrun**: 실제 게임 통합 예제
  - React + TypeScript 기반 Outrun 레이싱 게임
  - GameCanvas 컴포넌트 (1,148줄)
  - 지갑 연동 훅 (useWallet)
  - 메인 메뉴, HUD, 게임 오버 화면 등 완전한 게임 UI

#### 기존 예제 업데이트

- `sdk-cdn`: 버전 출력 기능 추가
- `sdk-react`: WebApp 통합 예제 추가
- `sdk-vanilla`: Native Bridge 테스트 코드 추가

### 3. 문서화

완벽한 문서 세트를 제공합니다:

| 문서                          | 줄 수 | 설명                              |
| ----------------------------- | ----- | --------------------------------- |
| `NATIVE_BRIDGE.md`            | 1,075 | Native Bridge 상세 스펙 및 가이드 |
| `WALLET_INTEGRATION.md`       | 536   | 지갑 통합 가이드                  |
| `WEBAPP_FULLSCREEN_SETUP.md`  | 428   | 풀스크린 설정 가이드              |
| `QUICK_START.md`              | 405   | 빠른 시작 가이드                  |
| `STRUCTURE.md`                | 320   | 프로젝트 구조 설명                |
| `SETUP_SDK_WEBAPP_OUTRUN.md`  | 289   | Outrun 예제 설정                  |
| `COMPLETED.md`                | 284   | 완료된 작업 목록                  |
| `CROSSX_BROWSER_INJECTION.md` | 256   | 브라우저 주입 가이드              |

### 4. 코어 개선

**CoreHelperUtil.ts 개선**

- User Agent 기반 → Marker 기반 브라우저 판별로 변경
- 더 정확하고 신뢰성 있는 브라우저 감지
- 66줄의 새로운 유틸리티 함수 추가

### 5. 빌드 및 설정

- Vite 기반 빌드 설정
- Vitest 테스트 환경 구성
- TypeScript 설정 최적화
- pnpm workspace 통합

## 📊 통계

```
75 files changed
+10,498 insertions
-783 deletions
```

### 주요 추가 내용

- 새로운 패키지: 1개
- 새로운 예제: 2개
- 새로운 문서: 8개 (총 3,593줄)
- 테스트: 101줄

## 🔧 기술 스택

- **언어**: TypeScript
- **빌드 도구**: Vite
- **테스트**: Vitest
- **패키지 관리**: pnpm
- **예제 프레임워크**: React, Vanilla JS

## 🚀 주요 기능

### Native Bridge API

```typescript
import { CROSSxWebApp, Haptics } from '@to-nexus/webapp'

// WebApp 준비 신호
CROSSxWebApp.ready()

// 전체화면 요청
CROSSxWebApp.requestFullScreen()
CROSSxWebApp.requestFullScreen({ isExpandSafeArea: true })

// Safe Area 인셋 가져오기
const insets = await CROSSxWebApp.getSafeAreaInsets()
// { top: 47, bottom: 34, left: 0, right: 0 }

// 햅틱 피드백
CROSSxWebApp.hapticFeedback(Haptics.impactMedium)
CROSSxWebApp.hapticFeedback(Haptics.notificationSuccess)

// 이벤트 수신
CROSSxWebApp.on('viewClosed', () => {
  console.log('뷰가 닫혔습니다')
})

CROSSxWebApp.on('viewBackgrounded', () => {
  console.log('백그라운드로 전환')
})
```

### Browser Detection

```typescript
import { isCROSSxEnvironment } from '@to-nexus/webapp'

// Marker 기반 정확한 브라우저 감지
if (isCROSSxEnvironment()) {
  // CROSSx 앱 내부 브라우저
  CROSSxWebApp.ready()
}
```

### Mock 지원

```typescript
// 개발 환경에서 Mock 사용
import { createMockWebApp } from '@to-nexus/webapp/mock'

const mockWebApp = createMockWebApp()
```

## ✅ 테스트

- ✅ 기본 기능 테스트 완료
- ✅ Browser Detection 테스트 완료
- ✅ Mock 기능 검증 완료
- ✅ 예제 프로젝트 동작 확인

## 📦 의존성 업데이트

- 모든 `@to-nexus/*` 패키지 버전 동기화
- pnpm-lock.yaml 업데이트
- 4개의 자동 생성 changeset 포함

## 🔄 커밋 히스토리

```
495f05a - [fix] user agent가 아닌 marker로 브라우져 판별하는 기능 구현
f0ac673 - [fix] examples변경
9124290 - [fix] 의존성 관련 수정
8c99a1a - [fix] update examples
718fb87 - examples 확장
1f5aa83 - [fix] 초기 구현 내용 추가 완료
```

## 🎨 사용 예제

### 기본 사용법

```typescript
import { CROSSxWebApp, Haptics, isCROSSxEnvironment } from '@to-nexus/webapp'

// CROSSx 환경 감지
if (isCROSSxEnvironment()) {
  // WebApp 준비 신호
  CROSSxWebApp.ready()

  // 전체화면 요청
  await CROSSxWebApp.requestFullScreen({ isExpandSafeArea: true })

  // Safe Area 인셋 가져오기
  const insets = await CROSSxWebApp.getSafeAreaInsets()
  console.log('Top inset:', insets.top)

  // 햅틱 피드백
  CROSSxWebApp.hapticFeedback(Haptics.impactLight)

  // 이벤트 리스너 등록
  CROSSxWebApp.on('viewClosed', () => {
    console.log('View closed')
  })
}
```

### React 통합

```typescript
import { useEffect } from 'react'
import { CROSSxWebApp, isCROSSxEnvironment } from '@to-nexus/webapp'

function App() {
  useEffect(() => {
    if (isCROSSxEnvironment()) {
      // WebApp 준비
      CROSSxWebApp.ready()

      // 이벤트 리스너
      const handleViewClosed = () => {
        console.log('View closed')
      }

      CROSSxWebApp.on('viewClosed', handleViewClosed)

      return () => {
        CROSSxWebApp.off('viewClosed', handleViewClosed)
      }
    }
  }, [])

  const handleFullScreen = () => {
    CROSSxWebApp.requestFullScreen({ isExpandSafeArea: true })
  }

  return (
    <div>
      <button onClick={handleFullScreen}>전체화면</button>
    </div>
  )
}
```

## 📝 Breaking Changes

없음 (신규 패키지이므로 기존 코드에 영향 없음)

## 🔗 관련 이슈

<!-- 관련 이슈 번호가 있다면 여기에 추가 -->
<!-- Closes #123 -->

## 🧪 테스트 방법

1. 패키지 설치

```bash
pnpm install
```

2. WebApp 패키지 빌드

```bash
cd packages/webapp
pnpm build
```

3. 예제 실행

```bash
cd examples/sdk-webapp
pnpm dev
```

4. Outrun 게임 예제 실행

```bash
cd examples/sdk-webapp-outrun
pnpm dev
```

## 📸 스크린샷

<!-- 필요시 스크린샷 추가 -->

## 👥 리뷰어

<!-- 리뷰어 멘션 -->

@reviewer1 @reviewer2

## ✔️ 체크리스트

- [x] 코드 작성 완료
- [x] 테스트 추가 및 통과
- [x] 문서화 완료
- [x] 예제 코드 작성
- [x] Changeset 생성
- [x] 빌드 성공 확인
- [ ] 리뷰 요청
- [ ] QA 테스트

## 💡 추가 노트

- 이 PR은 WebApp SDK의 첫 번째 버전입니다
- Native Bridge 스펙은 `NATIVE_BRIDGE.md`에서 확인할 수 있습니다
- 실제 게임 통합 예제(Outrun)를 통해 실용성을 검증했습니다
- Mock 모듈을 제공하여 개발 및 테스트가 용이합니다
