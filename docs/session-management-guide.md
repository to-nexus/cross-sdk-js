## Cross JS SDK 세션 관리 가이드 (DApp 측 수동 관리)

DApp이 자체적으로 세션을 점검/정리/삭제하고, 끊김 이벤트를 받아 UI를 안정적으로 유지하는 방법을 단계별로 설명합니다. 실전 적용을 위해 복사-붙여넣기 가능한 코드와 체크리스트를 제공합니다.

참고 예제: `examples/sdk-react/src/components/action-button.tsx`

---

### 무엇을 왜 해야 하나요?

- **모바일 딥링크/탭 전환/포커스 변화** 시 세션이 일시적으로 끊기거나 유휴 상태가 될 수 있습니다.
- SDK는 엔진(`SignClient Engine`)에 점검/정리 도구를 제공합니다. DApp은 적절한 타이밍에 이를 호출해 세션을 건강하게 유지해야 합니다.

텍스트 아키텍처 개요:

- DApp(UI) → AppKit(리액트 훅) → UniversalProvider → SignClient Engine
- 세션 점검: `engine.validateAndCleanupSessions(isSessionCheck)`
- 상태 조회: `engine.getSessionStatus()`
- 수동 삭제: `engine.deleteSession({ topic, emitEvent })`
- 이벤트: `window`에서 `appkit_session_disconnected`

---

### 빠른 시작 (Quick Start)

1. `walletProvider`를 가져옵니다.

```tsx
const { walletProvider } = useAppKitProvider<UniversalProvider>('eip155')
```

2. 포커스/가시성 이벤트에 점검 함수를 연결하세요.

```tsx
useEffect(() => {
  const validateAndCleanupSessions = async (force: boolean) => {
    if (!walletProvider?.client?.engine) return false
    return (walletProvider.client.engine as any).validateAndCleanupSessions(force)
  }

  const onFocus = () => validateAndCleanupSessions(true)
  const onVisible = () => {
    if (!document.hidden) validateAndCleanupSessions(true)
  }

  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    window.removeEventListener('focus', onFocus)
    document.removeEventListener('visibilitychange', onVisible)
  }
}, [walletProvider])
```

3. 세션 끊김 이벤트를 구독하여 UI를 초기화합니다.

```tsx
useEffect(() => {
  const onDisconnected = (event: CustomEvent) => {
    // 연결 끊김 시: UI 초기화, 재연결 유도, 캐시 정리 등
  }
  window.addEventListener('appkit_session_disconnected', onDisconnected as EventListener)
  return () =>
    window.removeEventListener('appkit_session_disconnected', onDisconnected as EventListener)
}, [])
```

4. (옵션) 상태 조회/수동 삭제 진입점을 준비합니다.

```tsx
const readStatus = async () => {
  if (!walletProvider?.client?.engine) return
  const result = await (walletProvider.client.engine as any).getSessionStatus()
  // result.total / healthy / disconnected / sessions[] 활용
}

const deleteFirstSession = async () => {
  const sessions = walletProvider?.client?.session?.getAll?.() || []
  if (!sessions.length) return
  await (walletProvider.client.engine as any).deleteSession({
    topic: sessions[0].topic,
    emitEvent: true
  })
}
```

---

### 단계별 적용 가이드

#### 1) 사전 준비

- React SDK를 통해 `walletProvider` 접근 가능해야 합니다.
- 현재 예시에서는 엔진 메서드 접근에 `as any`를 사용합니다. 실제 서비스에서는 엔진 타입을 프로젝트에 선언해 안전하게 사용하세요.

```tsx
const { walletProvider } = useAppKitProvider<UniversalProvider>('eip155')
```

#### 2) 세션 점검/정리 트리거링

- 권장 타이밍: `visibilitychange`, `focus` 시 강제 점검 플래그(`true`)로 호출합니다.
- 엔진 구현(요약): `isSessionCheck === true`면 내부에서 `cleanup()` 후 세션 재확인을 수행합니다.

```3380:3481:packages/sign-client/src/controllers/engine.ts
public validateAndCleanupSessions = async (isSessionCheck = false) => {
  // ...
  if (isSessionCheck) {
    await this.cleanup()
    // cleanup 후 재확인
  }
  // activeSessions 순회
}
```

권장 구현 예시:

```tsx
useEffect(() => {
  const validateAndCleanupSessions = async (isSessionCheck: boolean): Promise<boolean> => {
    if (!walletProvider?.client?.engine) return false
    return (walletProvider.client.engine as any).validateAndCleanupSessions(isSessionCheck)
  }

  const handleVisibilityChange = () => {
    if (!document.hidden) validateAndCleanupSessions(true)
  }
  const handlePageFocus = () => validateAndCleanupSessions(true)

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handlePageFocus)
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handlePageFocus)
  }
}, [walletProvider])
```

Tips:

- 엔진에는 과도 호출 보호 로직(예: 10초 제한)이 있을 수 있습니다. 강제 플래그를 쓰면 즉시 정리 수행이 가능합니다.

#### 3) 세션 상태 조회 (디버깅/운영 모니터링)

```tsx
const getSessionStatus = async () => {
  if (!walletProvider?.client?.engine) return
  const result = await (walletProvider.client.engine as any).getSessionStatus()
  // 빈 결과 방어: 필요 시 client.session.getAll()로 재확인
}
```

UI 예시 가공:

```tsx
const statusText = result.sessions
  .map((s: any) => `${s.status === 'healthy' ? '✅' : '❌'} ${s.topic.slice(0, 8)}...`)
  .join('\n')
```

#### 4) 세션 수동 삭제 (운영 대응용)

```tsx
const deleteSessionByTopic = async (topic: string) => {
  await (walletProvider.client.engine as any).deleteSession({ topic, emitEvent: true })
}
```

- 운영에서는 사용자가 선택한 세션/오류 누적 세션만 삭제하도록 정책화하세요.

#### 5) 끊김 이벤트 구독 및 UI 복구

- AppKit은 내부적으로 끊김 발생 시 `appkit_session_disconnected`를 브라우저 `window`에 디스패치합니다.

```1652:1656:packages/appkit/src/client.ts
window.dispatchEvent(new CustomEvent('appkit_session_disconnected', { detail: event }))
```

구독 예시:

```tsx
useEffect(() => {
  const onDisconnected = (event: CustomEvent) => {
    // 1) 전역 상태 초기화 (계정, 네트워크, 토큰 캐시)
    // 2) 재연결 유도 배너/모달 노출
    // 3) 민감 동작(서명/전송) 차단
  }
  window.addEventListener('appkit_session_disconnected', onDisconnected as EventListener)
  return () =>
    window.removeEventListener('appkit_session_disconnected', onDisconnected as EventListener)
}, [])
```

---

### 체크리스트

- [ ] `walletProvider` 확보 (`useAppKitProvider`)
- [ ] `visibilitychange`/`focus`에 점검 핸들러 연결
- [ ] `validateAndCleanupSessions(true)`로 강제 점검 수행
- [ ] `getSessionStatus()` 디버그/운영 버튼 준비
- [ ] `appkit_session_disconnected` 구독 및 UI 복구 흐름 구현
- [ ] (옵션) `deleteSession({ topic, emitEvent })` 운영 대응 진입점
- [ ] (권장) 엔진 타입 선언 추가로 `(as any)` 제거

---

### 트러블슈팅

- **세션이 0개로 표시되지만 실제로 존재**: `client.session.getAll()`로 교차검증. 엔진 버전/로그 확인.
- **모바일 딥링크 후 복귀 시 끊김**: 복귀 직후 `validateAndCleanupSessions(true)` 호출 경로 확인.
- **확장 프로그램 연결에선 세션 없음**: Universal Provider 세션이 없을 수 있으나 연결은 정상일 수 있음. UI 문구를 분기 처리.

---

### 참고 소스

- 예제: `examples/sdk-react/src/components/action-button.tsx`
- 엔진: `packages/sign-client/src/controllers/engine.ts`
- 이벤트: `packages/appkit/src/client.ts`
- Provider 정리: `providers/universal-provider/src/UniversalProvider.ts`
