# sdk-webapp-outrun 예제 설정 가이드

이 문서는 `examples/sdk-webapp-outrun` 예제를 빌드하고 실행하기 위한 완전한 가이드입니다.

## 📋 설정 요약

### 변경 사항

1. **pnpm-workspace.yaml** - `examples/sdk-webapp-outrun` 추가
2. **root package.json** - 다음 스크립트 추가:
   - `example:webapp-outrun`: 개발 서버 실행
   - `example:webapp-outrun:build`: 프로덕션 빌드

3. **examples/sdk-webapp-outrun/package.json** 업데이트:
   - 패키지 이름: `neon-outrun` → `@examples/sdk-webapp-outrun`
   - 버전: `0.0.0` → `1.18.3-alpha.1` (모노레포 버전과 동기화)
   - `@to-nexus/webapp` dependency 추가 ✅
   - 의존성 통일

4. **예제 폴더 구조 완성**:
   - `tsconfig.json` - 타입 체킹 설정 추가
   - `tsconfig.app.json` - 빌드용 설정
   - `vite.config.ts` - 빌드 출력 설정 추가
   - `README.md` - 상세 가이드 작성
   - `.gitignore` - 무시할 파일 목록 추가

5. **@to-nexus/webapp 통합** ✅:
   - `App.tsx` - WebApp 초기화 및 fullscreen 요청 로직 추가
   - `index.html` - Fullscreen CSS 적용
   - WebApp 이벤트 리스너 (viewClosed, viewBackgrounded)
   - 네이티브 환경 자동 감지

## 🚀 사용 방법

### 방법 1: 루트에서 (권장)

```bash
# 위치: /Users/chuck/Documents/GitHub/cross-sdk-js

# 개발 서버 실행 (포트 3000)
pnpm example:webapp-outrun

# 또는 빌드 및 프로덕션 버전 실행
pnpm example:webapp-outrun:build
```

### 방법 2: 예제 폴더에서

```bash
# 위치: /Users/chuck/Documents/GitHub/cross-sdk-js/examples/sdk-webapp-outrun

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드된 결과물 미리보기
pnpm preview
```

## 📦 구조

```
examples/sdk-webapp-outrun/
├── components/                  # React 컴포넌트들
│   ├── GameCanvas.tsx          # 게임 캔버스
│   ├── GameOver.tsx            # 게임 오버 화면
│   ├── HUD.tsx                 # 상단 UI
│   ├── MainMenu.tsx            # 메인 메뉴
│   └── PauseMenu.tsx           # 일시정지 메뉴
├── .gitignore                  # Git 무시 파일 ✅ 추가됨
├── App.tsx                     # 메인 앱 컴포넌트 ✅ WebApp 통합됨
├── index.tsx                   # 엔트리 포인트
├── index.html                  # HTML 템플릿 ✅ Fullscreen CSS 추가됨
├── metadata.json               # 메타데이터
├── package.json                # 패키지 설정 ✅ @to-nexus/webapp 추가됨
├── README.md                   # 상세 가이드 ✅ WebApp 문서 추가됨
├── tsconfig.json               # TS 설정 ✅ 수정됨
├── tsconfig.app.json           # 빌드용 TS 설정 ✅ 추가됨
├── types.ts                    # 타입 정의
└── vite.config.ts              # Vite 설정 ✅ 수정됨
```

## ✅ 체크리스트

- [x] pnpm-workspace.yaml에 경로 추가
- [x] package.json에 스크립트 추가
- [x] examples/sdk-webapp-outrun 설정 파일 완성
- [x] TypeScript 설정 정비
- [x] Vite 빌드 설정 완성
- [x] README.md 작성
- [x] .gitignore 생성
- [x] @to-nexus/webapp dependency 추가
- [x] App.tsx에 WebApp 통합
- [x] Fullscreen 요청 기능 구현
- [x] WebApp 이벤트 리스너 등록
- [x] index.html fullscreen CSS 적용
- [x] README에 WebApp 문서 추가

## 🖥️ WebApp 통합 상세

### App.tsx의 WebApp 초기화

```typescript
import CROSSxWebApp, { type IWebApp } from '@to-nexus/webapp';

// 초기화
const app = CROSSxWebApp;
app.requestFullScreen();  // Fullscreen 요청
app.ready();              // 준비 완료 신호

// 이벤트 리스너
app.on('viewClosed', () => {
  // 앱 닫기 처리
});

app.on('viewBackgrounded', () => {
  // 백그라운드 처리
});
```

### Fullscreen CSS (index.html)

```css
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#root {
  width: 100%;
  height: 100%;
}
```

### 환경별 동작

| 환경 | 동작 |
|------|------|
| CROSSx 네이티브 | 실제 fullscreen, 네이티브 브리지 사용 |
| 브라우저 개발 | Mock 구현, 콘솔 로그로 시뮬레이션 |

## 🔧 빌드 설정 상세

### 개발 서버 (Vite Dev Server)
- 포트: 3000
- 호스트: 0.0.0.0
- 핫 모듈 교체 (HMR): 활성화

### 프로덕션 빌드
- 출력 디렉토리: `dist`
- 소스맵: 활성화 (디버깅용)
- 타입 체크: TypeScript `tsc` 사용

## 📝 npm 스크립트 상세

### 개발 서버

```bash
pnpm example:webapp-outrun
# 또는
pnpm --filter @examples/sdk-webapp-outrun dev
```

**역할**: 개발 환경에서 빠른 피드백 제공
- 핫 리로드
- 소스맵 포함
- 최적화 없음 (개발 속도 우선)

### 프로덕션 빌드

```bash
pnpm example:webapp-outrun:build
# 또는
pnpm --filter @examples/sdk-webapp-outrun build
```

**역할**: 프로덕션용 최적화 빌드 생성
1. 전체 모노레포 빌드 (`pnpm build`)
2. TypeScript 타입 체크 (`tsc`)
3. Vite로 번들링 및 최소화

## 🔍 문제 해결

### "Cannot find package" 에러

**원인**: 의존성이 설치되지 않음

**해결**:
```bash
cd /Users/chuck/Documents/GitHub/cross-sdk-js
pnpm install
```

### 포트 3000이 이미 사용 중

**원인**: 다른 프로세스가 포트 사용 중

**해결 방법 1**: 다른 포트 사용
```bash
# vite.config.ts 수정
server: {
  port: 3001  // 변경
}
```

**해결 방법 2**: 기존 프로세스 종료
```bash
lsof -i :3000
kill -9 <PID>
```

### 타입 에러 발생

**원인**: TypeScript 설정 문제

**해결**:
```bash
# tsconfig.json 재확인
pnpm --filter @examples/sdk-webapp-outrun exec tsc --noEmit
```

## 📚 관련 파일

- [`pnpm-workspace.yaml`](/Users/chuck/Documents/GitHub/cross-sdk-js/pnpm-workspace.yaml) - 워크스페이스 설정
- [`package.json`](/Users/chuck/Documents/GitHub/cross-sdk-js/package.json) - root 스크립트
- [`examples/sdk-webapp-outrun/package.json`](/Users/chuck/Documents/GitHub/cross-sdk-js/examples/sdk-webapp-outrun/package.json) - 예제 설정
- [`examples/sdk-webapp-outrun/README.md`](/Users/chuck/Documents/GitHub/cross-sdk-js/examples/sdk-webapp-outrun/README.md) - 예제 상세 가이드

## 🎯 다음 단계

1. **의존성 설치**
   ```bash
   pnpm install
   ```

2. **개발 서버 실행**
   ```bash
   pnpm example:webapp-outrun
   ```

3. **브라우저에서 확인**
   ```
   http://localhost:3000
   ```

4. **프로덕션 빌드 생성** (필요시)
   ```bash
   pnpm example:webapp-outrun:build
   ```

## 💡 추가 팁

### 워크스페이스 필터링
pnpm은 `--filter` 플래그로 특정 패키지만 대상으로 작업할 수 있습니다:

```bash
# sdk-webapp-outrun만 빌드
pnpm --filter @examples/sdk-webapp-outrun build

# 특정 폴더의 모든 예제 빌드
pnpm --filter "examples/*" build

# 의존성 설치 (루트만)
pnpm --filter @examples/sdk-webapp-outrun install
```

### 빌드 캐시 초기화
문제가 지속되면 캐시를 초기화하세요:

```bash
# Vite 캐시 제거
rm -rf examples/sdk-webapp-outrun/dist
rm -rf examples/sdk-webapp-outrun/.vite

# 전체 캐시 제거
pnpm clean
pnpm install
```

---

**마지막 업데이트**: 2025년 11월 28일
**상태**: ✅ 완전히 설정됨

