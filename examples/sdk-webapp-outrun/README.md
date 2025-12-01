# SDK WebApp Outrun Example

🎮 **Neon Outrun** - Cross SDK를 사용하는 인터랙티브 게임 예제입니다.

React와 TypeScript로 작성되었으며, Vite를 빌드 도구로 사용합니다. 이 프로젝트는 모노레포의 일부이며, 루트 디렉토리의 pnpm 명령을 통해 쉽게 빌드하고 실행할 수 있습니다.

## ✨ 주요 기능

- 🎮 **인터랙티브 게임 환경** - 완전한 게임 루프 구현
- 🖥️ **Fullscreen 지원** - @to-nexus/webapp을 통한 완전한 전체화면 동작
- ⚡ **React 19 & TypeScript** - 최신 기술 스택 사용
- 🚀 **Vite 최적화** - 빠른 개발 경험과 프로덕션 빌드
- 🎨 **Lucide React 아이콘** - 아이콘 지원
- 📱 **반응형 디자인** - 다양한 디바이스 지원
- 🎯 **Neon 테마** - 현대적인 사이버펑크 스타일
- 📲 **Native Bridge 지원** - CROSSx 네이티브 환경과의 상호작용

## 🚀 빠른 시작

### 전제 조건

- Node.js 18+
- pnpm 9.5.0+

### 1단계: 루트 디렉토리에서 의존성 설치

```bash
cd /Users/chuck/Documents/GitHub/cross-sdk-js
pnpm install
```

### 2단계: 개발 서버 실행

```bash
# 옵션 1: 루트에서 (추천)
pnpm example:webapp-outrun

# 옵션 2: 예제 폴더에서
cd examples/sdk-webapp-outrun
pnpm dev
```

개발 서버는 `http://localhost:3000` 에서 실행됩니다.

### 3단계: 빌드 (프로덕션)

```bash
# 옵션 1: 루트에서 (추천)
pnpm example:webapp-outrun:build

# 옵션 2: 예제 폴더에서
cd examples/sdk-webapp-outrun
pnpm build
```

### 4단계: 빌드된 결과물 미리보기

```bash
# 예제 폴더에서
cd examples/sdk-webapp-outrun
pnpm preview
```

미리보기는 `http://localhost:4173` 에서 실행됩니다.

## 📁 프로젝트 구조

```
sdk-webapp-outrun/
├── components/
│   ├── GameCanvas.tsx           # 게임 렌더링 캔버스
│   ├── GameOver.tsx             # 게임 오버 화면
│   ├── HUD.tsx                  # 상단 UI (점수, 속도 등)
│   ├── MainMenu.tsx             # 메인 메뉴 화면
│   └── PauseMenu.tsx            # 일시정지 메뉴
├── App.tsx                      # 메인 애플리케이션 컴포넌트
├── index.tsx                    # React 엔트리 포인트
├── index.html                   # HTML 템플릿
├── types.ts                     # TypeScript 타입 정의
├── metadata.json                # 게임 메타데이터
├── package.json                 # 패키지 설정 및 의존성
├── tsconfig.json                # TypeScript 설정
├── tsconfig.app.json            # 빌드용 TypeScript 설정
├── vite.config.ts               # Vite 빌드 설정
└── README.md                    # 이 파일
```

## 📦 사용 가능한 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 (포트 3000) |
| `pnpm build` | TypeScript 타입 체크 후 프로덕션 빌드 생성 |
| `pnpm preview` | 빌드된 결과물 미리보기 (포트 4173) |

## 🖥️ WebApp 통합 (@to-nexus/webapp)

이 프로젝트는 `@to-nexus/webapp` 패키지를 사용하여 네이티브 환경과의 통합을 지원합니다.

### 주요 기능

- **Fullscreen 요청**: 앱 시작 시 자동으로 fullscreen 요청
- **네이티브 이벤트 처리**: 앱 닫기, 백그라운드 처리 감지
- **Safe Area 지원**: 노치나 안전 영역 고려
- **버전 관리**: WebApp 버전 추적

### 사용 코드

```typescript
import CROSSxWebApp, { type IWebApp } from '@to-nexus/webapp';

// WebApp 초기화 및 fullscreen 요청
const app = CROSSxWebApp;
app.requestFullScreen();
app.ready();

// 이벤트 리스너 등록
app.on('viewClosed', () => {
  console.log('앱이 닫혔습니다');
});

app.on('viewBackgrounded', () => {
  console.log('앱이 백그라운드로 이동했습니다');
});
```

### 환경 감지

WebApp은 다음과 같이 환경을 감지하고 동작합니다:

- **CROSSx 환경**: 네이티브 브리지를 통해 실제 fullscreen 및 네이티브 기능 사용
- **브라우저 환경**: Mock 구현으로 개발/테스트 가능

## 🔧 환경 변수

선택사항인 환경 변수들:

- `GEMINI_API_KEY` - Google Gemini API 키 (AI 기능 사용 시)

`.env.local` 파일에 추가할 수 있습니다:

```
GEMINI_API_KEY=your_api_key_here
```

## 📚 의존성

### Runtime
- **@to-nexus/webapp** workspace:* - WebApp 및 Fullscreen 지원
- **react** ^19.2.0 - UI 라이브러리
- **react-dom** ^19.2.0 - React DOM 렌더러
- **lucide-react** ^0.555.0 - 아이콘 라이브러리

### Development
- **@types/react** 19.0.0 - React 타입 정의
- **@types/react-dom** 19.0.0 - React DOM 타입 정의
- **TypeScript** 5.7.3 - 정적 타입 체킹
- **Vite** 5.4.12 - 빌드 도구
- **@vitejs/plugin-react** ^5.0.0 - React 플러그인

## 🏗️ 모노레포 통합

이 프로젝트는 모노레포의 일부입니다. pnpm-workspace.yaml에 등록되어 있으며, 루트 package.json에서 다음 스크립트로 관리됩니다:

```json
{
  "example:webapp-outrun": "pnpm --filter @examples/sdk-webapp-outrun dev",
  "example:webapp-outrun:build": "pnpm build && pnpm --filter @examples/sdk-webapp-outrun build"
}
```

## 🎮 게임 조작

게임 조작 방법은 게임 내 메뉴에서 확인할 수 있습니다.

## 🐛 문제 해결

### dev 서버가 시작되지 않을 때

1. 의존성이 올바르게 설치되었는지 확인:
   ```bash
   cd /Users/chuck/Documents/GitHub/cross-sdk-js
   pnpm install
   ```

2. node_modules 폴더가 손상된 경우 재설치:
   ```bash
   pnpm clean
   pnpm install
   ```

### 포트 3000이 이미 사용 중일 때

vite.config.ts에서 포트를 변경할 수 있습니다:

```typescript
server: {
  port: 3001, // 원하는 포트로 변경
  host: '0.0.0.0'
}
```

## 📝 추가 정보

- Vite 공식 문서: https://vitejs.dev/
- React 공식 문서: https://react.dev/
- TypeScript 공식 문서: https://www.typescriptlang.org/

## 📄 라이센스

MIT

