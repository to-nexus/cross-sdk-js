# WebApp 통합 가이드

이 문서는 `@to-nexus/webapp` 패키지를 사용한 Outrun 게임의 Fullscreen 통합 과정을 설명합니다.

## 📋 개요

Neon Outrun은 `@to-nexus/webapp`을 사용하여 다음 기능을 지원합니다:

- 🖥️ **Fullscreen 요청** - 앱 시작 시 자동 fullscreen 전환
- 📲 **네이티브 환경 감지** - CROSSx 환경과 브라우저 환경 자동 구분
- 🎮 **이벤트 처리** - 앱 닫기, 백그라운드 처리
- 🔒 **Safe Area 지원** - 노치 및 안전 영역 처리

## 🔧 구현 상세

### 1. 의존성 추가

#### package.json
```json
{
  "dependencies": {
    "@to-nexus/webapp": "workspace:*"
  }
}
```

### 2. App.tsx 통합

#### 초기화 코드
```typescript
import CROSSxWebApp, { type IWebApp } from '@to-nexus/webapp';

const App: React.FC = () => {
  const [webApp, setWebApp] = useState<IWebApp | null>(null);

  // WebApp 초기화 (마운트 시 한 번만 실행)
  useEffect(() => {
    try {
      const app = CROSSxWebApp;
      setWebApp(app);
      
      // Fullscreen 요청
      app.requestFullScreen();
      
      // 준비 완료 신호 전송
      app.ready();
      
      // 이벤트 리스너 등록
      app.on('viewClosed', () => {
        console.log('[Outrun] View closed');
        setGameState(GameState.MENU);
      });
      
      app.on('viewBackgrounded', () => {
        console.log('[Outrun] View backgrounded');
        if (gameState === GameState.PLAYING) {
          setGameState(GameState.PAUSED);
        }
      });
      
      console.log('[Outrun] WebApp initialized successfully');
      console.log('[Outrun] WebApp version:', app.version);
    } catch (error) {
      console.error('[Outrun] Failed to initialize WebApp:', error);
    }
  }, []);
};
```

### 3. CSS 설정

#### index.html
```html
<style>
  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    touch-action: none;
  }
  
  #root {
    width: 100%;
    height: 100%;
  }
</style>
```

#### App.tsx 렌더링
```tsx
<div className="relative w-screen h-screen overflow-hidden bg-slate-900">
  {/* 게임 콘텐츠 */}
</div>
```

## 🔍 WebApp 인터페이스

### IWebApp

```typescript
interface IWebApp {
  version: string                          // WebApp 버전
  ready(): void                            // 준비 완료 신호
  requestFullScreen(): void                // Fullscreen 요청
  getSafeAreaInsets(): Promise<SafeAreaInsets>  // Safe area 조회
  on(event: WebAppEventType, callback: () => void): void   // 이벤트 리스너
  off(event: WebAppEventType, callback: () => void): void  // 리스너 제거
}
```

### WebAppEventType

```typescript
type WebAppEventType = 'viewClosed' | 'viewBackgrounded'
```

## 🌐 환경별 동작

### CROSSx 네이티브 환경 (실제 앱)

```
App.tsx
  ↓
CROSSxWebApp (WebAppImpl)
  ↓
Native Bridge (JSON-RPC)
  ↓
네이티브 코드 (Java/Swift)
```

**특징:**
- 실제 fullscreen 전환
- 네이티브 이벤트 수신
- Safe area 정보 제공

### 브라우저 환경 (개발/테스트)

```
App.tsx
  ↓
CROSSxWebApp (WebAppMock)
  ↓
콘솔 로그 출력
```

**특징:**
- Mock 구현으로 즉시 테스트 가능
- 콘솔에서 동작 확인
- 모든 기능 시뮬레이션

## 📊 라이프사이클

```
1. 앱 마운트
   ↓
2. WebApp 초기화 (useEffect)
   ↓
3. requestFullScreen() 호출
   ↓
4. ready() 호출 (네이티브에 준비 신호)
   ↓
5. 이벤트 리스너 등록
   ↓
6. 게임 플레이
   ↓
7. viewClosed 또는 viewBackgrounded 이벤트
   ↓
8. 상태 업데이트 (MENU 또는 PAUSED)
```

## 🐛 디버깅

### 브라우저 콘솔

개발 중에 다음과 같은 로그를 확인할 수 있습니다:

```javascript
// WebApp 정보 확인
console.log(window.CROSSx?.WebApp?.version)
// → "1.18.3-alpha.1"

// 환경 확인
console.log(window.__crossx)
// → false (브라우저) 또는 true (CROSSx 환경)

// 이벤트 시뮬레이션 (개발용)
window.CROSSx.WebApp.requestFullScreen()
// → "[CROSSx WebApp] Requesting fullscreen..."
```

### TypeScript 타입 검사

```bash
pnpm --filter @examples/sdk-webapp-outrun exec tsc --noEmit
```

## 🔄 안티패턴 및 주의사항

### ❌ 하지 말아야 할 것

```typescript
// ❌ 매번 새로운 인스턴스 생성 (비효율적)
useEffect(() => {
  const app = CROSSxWebApp;
  app.requestFullScreen();
}, [dependency])

// ❌ 이벤트 리스너를 정리하지 않음 (메모리 누수)
app.on('viewClosed', handler);
// 정리 코드 없음
```

### ✅ 올바른 방법

```typescript
// ✅ 초기화는 한 번만
useEffect(() => {
  const app = CROSSxWebApp;
  app.requestFullScreen();
  app.ready();
  
  const handleClosed = () => { /* ... */ };
  app.on('viewClosed', handleClosed);
  
  // ✅ 정리 함수 (필요시)
  return () => {
    app.off('viewClosed', handleClosed);
  };
}, []); // 의존성 배열 비움
```

## 📚 추가 정보

- [packages/webapp/README.md](../../packages/webapp/README.md)
- [packages/webapp/NATIVE_BRIDGE.md](../../packages/webapp/NATIVE_BRIDGE.md)
- [packages/webapp/WALLET_INTEGRATION.md](../../packages/webapp/WALLET_INTEGRATION.md)

## 🎯 다음 단계

1. **Safe Area 활용** - Safe area insets을 사용한 레이아웃 최적화
2. **네이티브 브리지** - JSON-RPC를 통한 고급 네이티브 기능
3. **메타데이터** - metadata.json 설정으로 앱 정보 관리

---

**마지막 업데이트**: 2025년 11월 28일


