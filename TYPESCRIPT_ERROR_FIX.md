# TypeScript 에러 해결 보고서

**문제**: @to-nexus/webapp 패키지 빌드 에러  
**원인**: WebAppMock 클래스에서 IWebApp 인터페이스 메서드 누락  
**해결일**: 2025년 11월 28일  
**상태**: ✅ 완료

---

## 🔴 발생한 에러

### 에러 메시지

```
error TS2741: Property 'getSafeAreaInsets' is missing in type 'WebAppMock'
            but required in type 'IWebApp'.

error TS2420: Class 'WebAppMock' incorrectly implements interface 'IWebApp'.
             Property 'getSafeAreaInsets' is missing in type 'WebAppMock'
             but required in type 'IWebApp'.
```

### 발생 위치

```
packages/webapp/src/index.ts:19:5
packages/webapp/src/mock/index.ts:6:14
```

---

## 🔍 근본 원인 분석

### 문제 상황

1. `IWebApp` 인터페이스에서 `getSafeAreaInsets()` 메서드가 정의되어 있음
   ```typescript
   // packages/webapp/src/types.ts
   interface IWebApp {
     getSafeAreaInsets(): Promise<SafeAreaInsets>
   }
   ```

2. `WebAppImpl` 클래스에는 구현되어 있음
   ```typescript
   // packages/webapp/src/webapp/index.ts
   async getSafeAreaInsets(): Promise<{ ... }> {
     // 구현됨
   }
   ```

3. **하지만** `WebAppMock` 클래스에는 구현되지 않음
   ```typescript
   // packages/webapp/src/mock/index.ts
   export class WebAppMock implements IWebApp {
     // getSafeAreaInsets() 메서드 없음! ❌
   }
   ```

### 왜 이 문제가 발생했나?

- `WebAppMock`은 개발/테스트 환경을 위한 Mock 구현
- `IWebApp` 인터페이스 변경 시 Mock도 함께 업데이트되지 않음
- TypeScript의 구조적 타입 체킹으로 인해 컴파일 에러 발생

---

## ✅ 해결 방법

### 파일 수정

**파일**: `packages/webapp/src/mock/index.ts`

### 추가된 메서드

```typescript
/**
 * Get safe area insets (mock)
 * Returns default values for browser environment
 */
async getSafeAreaInsets(): Promise<{ top: number; bottom: number; left: number; right: number }> {
  console.log('[MOCK] CROSSx.WebApp.getSafeAreaInsets() called')
  
  // Return default safe area insets for browser
  // In real CROSSx environment, these values would come from native
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
}
```

### 구현 특징

| 항목 | 설명 |
|------|------|
| 메서드 | `getSafeAreaInsets()` |
| 반환 타입 | `Promise<SafeAreaInsets>` |
| 동작 | 기본값 (0, 0, 0, 0) 반환 |
| 로깅 | `[MOCK] CROSSx.WebApp.getSafeAreaInsets() called` |
| 용도 | 브라우저 개발/테스트 환경 |

---

## 📊 변경 전후 비교

### 변경 전

```typescript
export class WebAppMock implements IWebApp {
  version: string
  private listeners: Map<string, Set<Function>> = new Map()
  private isReady = false

  constructor(version: string) { ... }
  ready(): void { ... }
  requestFullScreen(): void { ... }
  on(event: WebAppEventType, callback: () => void): void { ... }
  off(event: WebAppEventType, callback: () => void): void { ... }
  // ❌ getSafeAreaInsets() 메서드 없음!
}
```

### 변경 후

```typescript
export class WebAppMock implements IWebApp {
  version: string
  private listeners: Map<string, Set<Function>> = new Map()
  private isReady = false

  constructor(version: string) { ... }
  ready(): void { ... }
  requestFullScreen(): void { ... }
  // ✅ getSafeAreaInsets() 메서드 추가!
  async getSafeAreaInsets(): Promise<{ top: number; bottom: number; left: number; right: number }> {
    console.log('[MOCK] CROSSx.WebApp.getSafeAreaInsets() called')
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  }
  on(event: WebAppEventType, callback: () => void): void { ... }
  off(event: WebAppEventType, callback: () => void): void { ... }
}
```

---

## 🧪 검증

### 빌드 결과

```bash
$ pnpm --filter @to-nexus/webapp build
> @to-nexus/webapp@1.18.3-alpha.1 build
> tsc --build

✓ 컴파일 성공 (에러 없음)
```

### 전체 모노레포 빌드

```bash
$ pnpm build
Tasks:    19 successful, 19 total
Cached:    0 cached, 19 total
Time:     45.843s

✓ 모든 패키지 빌드 성공
```

---

## 🌐 환경별 동작

### 개발/테스트 환경 (브라우저)

```typescript
const insets = await webApp.getSafeAreaInsets()
// Console: [MOCK] CROSSx.WebApp.getSafeAreaInsets() called
// 반환: { top: 0, bottom: 0, left: 0, right: 0 }
```

### 프로덕션 환경 (CROSSx 앱)

```typescript
const insets = await webApp.getSafeAreaInsets()
// Native bridge 호출: crossx_app_safeAreaInset
// 반환: { top: 20, bottom: 34, left: 0, right: 0 } (예시)
```

---

## 📝 코드 리뷰 체크리스트

- [x] 메서드 시그니처가 IWebApp 인터페이스와 일치
- [x] async/await 패턴 사용 (Promise 반환)
- [x] 타입 안전성 (반환 타입 명시)
- [x] Mock 구현 (기본값 반환)
- [x] 로깅 추가 (디버깅 용이성)
- [x] 주석 추가 (설명 충분)
- [x] 코드 스타일 일관성 (기존 코드 참고)

---

## 🎯 향후 개선 사항

### 1. 동적 Safe Area 시뮬레이션

```typescript
async getSafeAreaInsets(): Promise<SafeAreaInsets> {
  // 브라우저 창 크기에 따라 동적으로 safe area 계산
  const top = window.innerHeight > 800 ? 20 : 0
  const bottom = window.innerHeight > 800 ? 34 : 0
  return { top, bottom, left: 0, right: 0 }
}
```

### 2. 테스트 유틸리티

```typescript
setSafeAreaInsets(insets: SafeAreaInsets): void {
  this._safeAreaInsets = insets // 테스트용 값 설정
}
```

---

## 📚 참고 자료

- **IWebApp 인터페이스**: `packages/webapp/src/types.ts`
- **WebAppImpl 구현**: `packages/webapp/src/webapp/index.ts`
- **WebAppMock 구현**: `packages/webapp/src/mock/index.ts`

---

## 🔗 관련 파일

- `packages/webapp/src/index.ts` - 환경 감지 및 인스턴스 생성
- `packages/webapp/src/types.ts` - TypeScript 인터페이스 정의
- `examples/sdk-webapp-outrun/App.tsx` - 실제 사용 예제

---

## ✅ 완료 상태

| 항목 | 상태 |
|------|------|
| 에러 해결 | ✅ 완료 |
| 빌드 검증 | ✅ 완료 |
| 타입 체크 | ✅ 통과 |
| 문서 작성 | ✅ 완료 |

---

**이제 모든 패키지가 정상적으로 빌드되며, sdk-webapp-outrun 예제를 실행할 수 있습니다.**

```bash
pnpm example:webapp-outrun
```

---

*이 문서는 TypeScript 빌드 에러 해결 과정을 기록합니다.*


