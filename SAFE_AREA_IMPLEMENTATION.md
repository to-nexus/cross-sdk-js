# Safe Area 구현 가이드

## 🎯 문제점

Outrun 게임에서 `isExpandSafeArea: true`를 설정했지만, 실제로는 상단(노치/Dynamic Island)과 하단(홈 인디케이터) 영역을 사용하지 못하고 있었습니다.

## ✅ 해결 방법

`CROSSxWebApp.getSafeAreaInsets()`를 사용하여 Safe Area 값을 받아온 후, CSS 변수로 설정하여 전체 화면을 활용하도록 구현했습니다.

---

## 📝 구현 내역

### 1. index.tsx - Safe Area Insets 가져오기

```typescript
// examples/sdk-webapp-outrun/index.tsx
useEffect(() => {
  if (isCROSSxEnvironment()) {
    // Safe Area Insets 가져오기 및 CSS 변수 설정
    const initializeSafeArea = async () => {
      try {
        const insets = await CROSSxWebApp.getSafeAreaInsets()
        console.log('[Outrun] Safe Area Insets:', insets)

        // CSS 변수로 설정
        document.documentElement.style.setProperty('--safe-area-top', `${insets.top}px`)
        document.documentElement.style.setProperty('--safe-area-bottom', `${insets.bottom}px`)
        document.documentElement.style.setProperty('--safe-area-left', `${insets.left}px`)
        document.documentElement.style.setProperty('--safe-area-right', `${insets.right}px`)

        // 화면 전체 높이 설정
        const totalHeight = window.innerHeight
        document.documentElement.style.setProperty('--viewport-height', `${totalHeight}px`)

        console.log('[Outrun] Safe Area CSS variables set')
      } catch (error) {
        console.error('[Outrun] Failed to get safe area insets:', error)
      }
    }

    // 전체화면 요청
    CROSSxWebApp.requestFullScreen({ isExpandSafeArea: true })

    // Safe Area 초기화
    initializeSafeArea()

    // 준비 완료 신호
    CROSSxWebApp.ready()
  }
}, [])
```

**주요 포인트**:
- `getSafeAreaInsets()`는 Promise를 반환하므로 `async/await` 사용
- CSS 변수로 설정하여 전체 앱에서 재사용 가능
- `window.innerHeight`로 전체 viewport 높이 저장

---

### 2. App.tsx - Safe Area 적용

```typescript
// examples/sdk-webapp-outrun/App.tsx
return (
  <div
    className="relative w-screen overflow-hidden bg-slate-900"
    style={{
      height: 'var(--viewport-height, 100vh)',
      paddingTop: 'var(--safe-area-top, 0px)',
      paddingBottom: 'var(--safe-area-bottom, 0px)',
      paddingLeft: 'var(--safe-area-left, 0px)',
      paddingRight: 'var(--safe-area-right, 0px)',
      boxSizing: 'border-box'
    }}
  >
    {/* Game content */}
  </div>
)
```

**주요 포인트**:
- CSS 변수를 사용하여 Safe Area만큼 padding 적용
- `boxSizing: 'border-box'`로 padding이 전체 크기에 포함되도록 설정
- Fallback 값(`100vh`, `0px`) 제공으로 브라우저 환경에서도 동작

---

### 3. index.html - Viewport 및 CSS 설정

#### Viewport Meta 태그
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

**중요**: `viewport-fit=cover` 추가로 iOS에서 Safe Area를 확장할 수 있도록 설정

#### CSS 초기값 설정
```css
:root {
  /* Safe Area CSS 변수 초기값 */
  --safe-area-top: 0px;
  --safe-area-bottom: 0px;
  --safe-area-left: 0px;
  --safe-area-right: 0px;
  --viewport-height: 100vh;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

---

## 🔍 Safe Area Insets 값 예시

### iPhone 14 Pro (Dynamic Island)
```json
{
  "top": 59,
  "bottom": 34,
  "left": 0,
  "right": 0
}
```

### iPhone 13 (Notch)
```json
{
  "top": 47,
  "bottom": 34,
  "left": 0,
  "right": 0
}
```

### Landscape (가로 모드)
```json
{
  "top": 0,
  "bottom": 21,
  "left": 47,
  "right": 47
}
```

---

## 📊 동작 흐름

```
1. WebApp 초기화
   ↓
2. requestFullScreen({ isExpandSafeArea: true })
   ↓
3. getSafeAreaInsets() 호출
   ↓
4. 네이티브에서 Safe Area 값 반환
   ↓
5. CSS 변수로 설정
   - --safe-area-top: 59px
   - --safe-area-bottom: 34px
   - --viewport-height: 844px
   ↓
6. App 컴포넌트에서 CSS 변수 사용
   ↓
7. 전체 화면 활용 ✅
```

---

## 🎨 시각적 효과

### Before (Safe Area 미사용)
```
┌─────────────────────┐
│   [여백 59px]        │ ← 사용 안 함
├─────────────────────┤
│                     │
│   게임 화면         │
│   (751px)           │
│                     │
├─────────────────────┤
│   [여백 34px]        │ ← 사용 안 함
└─────────────────────┘
```

### After (Safe Area 사용)
```
┌─────────────────────┐
│   게임 컨텐츠        │ ← 59px 패딩으로 노치 아래 배치
│   (전체 844px)       │
│                     │
│   게임 화면         │
│   전체 활용         │
│                     │
│   게임 컨텐츠        │ ← 34px 패딩으로 홈 인디케이터 위 배치
└─────────────────────┘
```

---

## 🧪 테스트 방법

### 1. 브라우저 환경
```bash
cd examples/sdk-webapp-outrun
pnpm dev
```

**예상 결과**:
- Safe Area 값이 `0px`이므로 일반 전체 화면
- 콘솔: `[Outrun] Running in browser environment`

### 2. CROSSx 앱 환경
CROSSx 앱의 WebView에서 실행

**예상 콘솔 로그**:
```
[Outrun] Running in CROSSx environment
[Outrun] WebApp version: 1.18.3-alpha.1
[Outrun] Safe Area Insets: { top: 59, bottom: 34, left: 0, right: 0 }
[Outrun] Safe Area CSS variables set
[Outrun] WebApp initialized successfully
```

### 3. 확인 사항
- ✅ 노치/Dynamic Island 영역까지 배경이 확장되는가?
- ✅ 게임 UI 요소가 Safe Area 안쪽에 배치되는가?
- ✅ 하단 홈 인디케이터를 가리지 않는가?
- ✅ 전체 화면을 활용하는가?

---

## 💡 추가 활용 방법

### 다른 컴포넌트에서 Safe Area 사용

Safe Area CSS 변수는 전역으로 설정되므로 모든 컴포넌트에서 사용 가능합니다:

```tsx
// HUD 컴포넌트
<div
  style={{
    position: 'absolute',
    top: 'var(--safe-area-top, 0px)',
    left: '20px',
    right: '20px'
  }}
>
  {/* HUD 컨텐츠 */}
</div>

// 하단 버튼
<button
  style={{
    position: 'absolute',
    bottom: 'calc(var(--safe-area-bottom, 0px) + 20px)',
    left: '50%',
    transform: 'translateX(-50%)'
  }}
>
  Play
</button>
```

---

## 📋 체크리스트

- [x] `getSafeAreaInsets()` API 호출
- [x] CSS 변수로 값 저장
- [x] App 컴포넌트에 padding 적용
- [x] `viewport-fit=cover` meta 태그 추가
- [x] 초기값 CSS 변수 설정
- [x] 콘솔 로그로 디버깅 정보 출력
- [x] 브라우저 fallback 처리

---

## 🚀 결과

이제 Outrun 게임이 **노치/Dynamic Island를 포함한 전체 화면을 활용**하면서도, **중요한 UI 요소는 Safe Area 안쪽에 배치**되어 사용자 경험이 개선되었습니다! ✨

