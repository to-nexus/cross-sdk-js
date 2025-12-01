# 🚀 빠른 시작 가이드

## 📍 현재 위치

`/Users/chuck/Documents/GitHub/cross-sdk-js/examples/sdk-webapp-outrun`

## ⚡ 30초 시작하기

### 1. 루트로 이동 후 의존성 설치

```bash
cd /Users/chuck/Documents/GitHub/cross-sdk-js
pnpm install
```

### 2. 개발 서버 실행

```bash
# 옵션 A: 루트에서 실행 (권장)
pnpm example:webapp-outrun

# 옵션 B: 예제 폴더에서 실행
cd examples/sdk-webapp-outrun
pnpm dev
```

### 3. 브라우저에서 확인

```
http://localhost:3000
```

## 🔨 빌드하기

```bash
# 방법 1: 루트에서 (권장)
pnpm example:webapp-outrun:build

# 방법 2: 예제 폴더에서
cd examples/sdk-webapp-outrun
pnpm build

# 빌드 결과물 미리보기
pnpm preview
```

## 📁 주요 파일

- `App.tsx` - 메인 애플리케이션
- `components/` - React 컴포넌트
- `vite.config.ts` - Vite 설정
- `tsconfig.json` - TypeScript 설정

## 🆘 문제 해결

### 의존성 설치 실패
```bash
# 루트에서 pnpm install 실행 필수
cd /Users/chuck/Documents/GitHub/cross-sdk-js
pnpm install
```

### 포트 3000 이미 사용 중
`vite.config.ts`에서 포트 변경:
```typescript
server: {
  port: 3001  // 3000 대신 3001 사용
}
```

## 📚 전체 가이드

더 자세한 정보는 [README.md](./README.md)를 참고하세요.

## ✅ 설정 확인

필요한 모든 설정이 완료되었습니다:
- ✅ pnpm-workspace.yaml 등록
- ✅ package.json 스크립트 추가
- ✅ TypeScript 설정
- ✅ Vite 설정
- ✅ 의존성 정의
- ✅ @to-nexus/webapp 통합
- ✅ Fullscreen 지원

## 🖥️ Fullscreen 기능

이 앱은 `@to-nexus/webapp` 패키지를 통해 자동으로 fullscreen으로 동작합니다.

- 📱 **네이티브 환경**: CROSSx 앱에서 완전한 fullscreen 지원
- 🌐 **브라우저 환경**: 개발/테스트를 위한 Mock 구현

Console에서 다음과 같은 로그를 확인할 수 있습니다:
```
[Outrun] WebApp initialized successfully
[Outrun] WebApp version: 1.18.3-alpha.1
```

이제 즉시 시작할 수 있습니다! 🎮🖥️

