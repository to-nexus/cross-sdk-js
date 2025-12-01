# CROSSx WebApp SDK - Wallet Integration Guide

CROSSx Wallet에서 WebApp으로 bridge를 통해 전달되는 규격을 정의합니다.

## 📋 기존 Wallet 통신 규격

CROSSx Wallet은 기존에 **Event 기반 메시징 시스템**을 사용합니다:

```typescript
// 기존 Wallet의 메시지 구조
interface W3mFrameEvent {
  type: string // '@w3m-app/...' 또는 '@w3m-frame/...'
  id: string // 요청 ID
  payload?: any // 실제 데이터
}
```

**예제:**

```json
{
  "type": "@w3m-app/RPC_REQUEST",
  "id": "abc123",
  "payload": {
    "method": "personal_sign",
    "params": ["0x..."]
  }
}
```

---

## 🎮 WebApp SDK Bridge 규격 (JSON-RPC 2.0 호환)

WebApp SDK는 **Ethereum JSON-RPC 2.0 표준**을 따릅니다:

### Native → JavaScript (요청)

```typescript
interface JsonRpcRequest {
  jsonrpc: '2.0' // JSON-RPC 버전
  id: string | number // 요청 ID (고유)
  method: string // 메서드명 (eth_* 형식)
  params: any[] | Record<string, any> // 파라미터
}
```

**예제:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "crossx_app_ready",
  "params": []
}
```

### JavaScript → Native (응답)

```typescript
interface JsonRpcResponse {
  jsonrpc: '2.0' // JSON-RPC 버전
  id: string | number // 요청 ID와 매칭
  result?: any // 성공 결과
  error?: {
    // 에러 객체
    code: number // 에러 코드
    message: string // 에러 메시지
    data?: any // 추가 정보
  }
}
```

**예제 (성공):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": true
}
```

**예제 (실패):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

---

## 🔄 Wallet에서 WebApp으로 데이터 전달 방식

### 1️⃣ **방식 A: 직접 Bridge 주입** (현재 WebApp SDK 사용)

Wallet에서 JavaScript로 bridge 객체를 주입:

```typescript
// Wallet (Native 코드)에서 JavaScript로 주입
window.crossxNativeBridge = {
  send(request: NativeBridgeRequest, callback: (response: NativeBridgeResponse) => void) {
    // Native에서 요청 처리
    // 결과를 callback으로 반환
  },
  onEvent(event: string, handler: (data?: any) => void) {
    // 이벤트 리스너 등록
  }
}
```

**흐름:**

```
WebApp SDK
  ↓
window.crossxNativeBridge.send(request, callback)
  ↓
Native (Wallet)
  ↓
callback({ id, result: ... })
  ↓
WebApp SDK Promise 해결
```

### 2️⃣ **방식 B: Event 기반** (기존 Wallet 구조)

기존 W3mFrame의 Event 구조를 유지:

```typescript
// 기존 Wallet 메시지
window.postMessage(
  {
    type: '@w3m-frame/WEBAPP_READY_RESPONSE',
    id: 'abc123',
    payload: { success: true }
  },
  '*'
)
```

---

## 🎯 WebApp → Wallet 연동 시나리오

### Phase 1: Wallet 준비 완료 신호

**WebApp SDK 호출:**

```typescript
CROSSx.WebApp.ready()
```

**내부 흐름:**

```
WebApp.ready()
  ↓
NativeBridge.call('crossx_app_ready', [])
  ↓
window.crossxNativeBridge.send({
  jsonrpc: '2.0',
  id: 1,
  method: 'crossx_app_ready',
  params: []
}, callback)
  ↓
Native Wallet:
  - WebView 준비 완료로 표시
  - UI 업데이트
  - 사용자 상호작용 활성화
  ↓
callback({ jsonrpc: '2.0', id: 1, result: true })
  ↓
Promise 해결
```

### Phase 2: 지갑 연결 요청 (향후)

**향후 추가될 기능:**

```typescript
const account = await CROSSx.WebApp.wallet.connect({
  siwe: true
})
```

**예상 메시지 (JSON-RPC 2.0):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_connect",
  "params": {
    "siwe": true,
    "message": "Sign in to play..."
  }
}
```

**Wallet 응답:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
    "signature": "0x...",
    "message": "..."
  }
}
```

### Phase 2b: 메시지 서명 요청 (향후)

```typescript
const signature = await CROSSx.WebApp.wallet.signMessage({
  message: 'Verify action'
})
```

**메시지 (Ethereum 표준 personal_sign):**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "personal_sign",
  "params": ["0x...", "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb"]
}
```

### Phase 2c: 타입된 데이터 서명 (향후)

```typescript
const signature = await CROSSx.WebApp.wallet.signTypedData({
  // EIP-712 structured data
})
```

**메시지 (Ethereum 표준 eth_signTypedData_v4):**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "eth_signTypedData_v4",
  "params": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
    {
      /* EIP-712 data */
    }
  ]
}
```

### Phase 3: 거래 전송 (향후)

```typescript
const txHash = await CROSSx.WebApp.transaction.send({
  to: '0x...',
  value: '1.5',
  data: '0x...'
})
```

**메시지 (Ethereum 표준 eth_sendTransaction):**

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "eth_sendTransaction",
  "params": [
    {
      "to": "0x...",
      "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
      "value": "0x...",
      "data": "0x...",
      "gas": "0x...",
      "gasPrice": "0x..."
    }
  ]
}
```

---

## 📡 Wallet에서 WebApp으로 이벤트 전송

### 라이프사이클 이벤트

**WebView 닫힘:**

```typescript
// Wallet에서 호출
window.crossxNativeBridge?.onEvent('viewClosed')
```

**WebApp에서 수신:**

```typescript
CROSSx.WebApp.on('viewClosed', () => {
  // 저장, 정리 작업
})
```

**백그라운드 전환:**

```typescript
// Wallet에서
window.crossxNativeBridge?.onEvent('viewBackgrounded')

// WebApp에서
CROSSx.WebApp.on('viewBackgrounded', () => {
  // 일시 중지, 상태 저장
})
```

---

## 🔌 Wallet 구현 체크리스트

### Native App (iOS/Android)에서 해야 할 일

```typescript
// 1. WebView 설정
setupWebView() {
  // WebApp SDK를 로드하거나 주입
  injectWebAppSDK();
}

// 2. Bridge 객체 생성
setupBridge() {
  window.crossxNativeBridge = {
    send: this.handleBridgeRequest.bind(this),
    onEvent: this.registerEventHandler.bind(this)
  };
}

// 3. 요청 처리
async handleBridgeRequest(request, callback) {
  const { id, method, params } = request;

  try {
    switch(method) {
      case 'webapp.ready':
        // WebApp이 준비됨
        this.onWebAppReady();
        callback({ id, result: true });
        break;

      case 'webapp.requestFullScreen':
        // 전체 화면 모드 활성화
        this.enterFullScreen();
        callback({ id, result: true });
        break;

      case 'wallet.connect':
        // 지갑 연결 로직
        const account = await this.connectWallet(params);
        callback({ id, result: account });
        break;

      case 'transaction.send':
        // 거래 전송 로직
        const txHash = await this.sendTransaction(params);
        callback({ id, result: { txHash } });
        break;

      default:
        callback({ id, error: 'Unknown method' });
    }
  } catch(error) {
    callback({ id, error: error.message });
  }
}

// 4. 이벤트 등록 처리
registerEventHandler(event, handler) {
  this.eventHandlers[event] = handler;
}

// 5. 이벤트 전송
notifyWebAppClosed() {
  this.eventHandlers['viewClosed']?.();
}

notifyWebAppBackgrounded() {
  this.eventHandlers['viewBackgrounded']?.();
}
```

---

## 📊 기존 Wallet과 WebApp SDK의 비교

| 항목        | 기존 Wallet                 | WebApp SDK              |
| ----------- | --------------------------- | ----------------------- |
| 메시지 구조 | Event 기반 (`@w3m-app/...`) | Request/Response 기반   |
| 핸들링      | 메시지 type별 처리          | 메서드명(method)별 처리 |
| 응답 방식   | Event 발행                  | Callback 실행           |
| 타임아웃    | 타임아웃 처리 필요          | SDK에서 처리            |
| 에러 처리   | payload.message             | error 필드              |

---

## 🔐 보안 고려사항

### 1. Request ID 추적

```typescript
// 각 요청은 고유 ID로 추적
const id = `req_${Date.now()}_${Math.random()}`

// 응답 시 ID 검증
if (response.id !== request.id) {
  throw new Error('Response ID mismatch')
}
```

### 2. 타임아웃 처리

```typescript
const timeout = 5000 // 5초

// Promise로 타임아웃 구현
Promise.race([
  bridgePromise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
])
```

### 3. 에러 처리

```typescript
// 항상 에러 케이스 처리
if (response.error) {
  throw new Error(response.error)
}
```

---

## 🚀 구현 순서

### Phase 1 (✅ 완료)

- ✅ 기본 Bridge 정의
- ✅ `webapp.ready()` 메서드
- ✅ `webapp.requestFullScreen()` 메서드
- ✅ 라이프사이클 이벤트 (viewClosed, viewBackgrounded)

### Phase 2 (예정)

- [ ] `wallet.connect()` - 지갑 연결
- [ ] `wallet.signMessage()` - 메시지 서명
- [ ] SIWE 통합

### Phase 3 (예정)

- [ ] `transaction.send()` - 거래 전송
- [ ] `transaction.sign()` - 거래 서명
- [ ] 거래 확인 대기

### Phase 4 (예정)

- [ ] `haptics.light()` - 진동 피드백
- [ ] `haptics.heavy()` - 강한 진동
- [ ] 다른 피드백 효과

---

## 📚 참고 자료

### 기존 Wallet 구조

- `packages/wallet/src/W3mFrameProvider.ts` - Wallet Provider
- `packages/wallet/src/W3mFrameTypes.ts` - 메시지 타입 정의
- `packages/wallet/src/W3mFrameSchema.ts` - Zod 스키마

### WebApp SDK

- `packages/webapp/src/webapp/bridge.ts` - Native Bridge 구현
- `packages/webapp/src/webapp/index.ts` - WebApp 메인 로직
- `packages/webapp/NATIVE_BRIDGE.md` - 자세한 규격

---

## ❓ FAQ

### Q: 왜 기존 W3mFrame 구조를 그대로 사용하지 않나?

**A:** WebApp SDK는 더 간단한 게임 앱용이므로:

- 더 간단한 Request/Response 구조
- 낮은 레이턴시 (Callback 직접 호출)
- 타입 안전성 강화
- 향후 다른 SDK와도 호환

### Q: 향후 wallet.connect()는 어떻게 동작할까?

**A:** 같은 Bridge 프로토콜 확장:

```typescript
await CROSSx.WebApp.wallet.connect()
  ↓
{ id: '...', method: 'wallet.connect', params: {...} }
  ↓
Native 처리
  ↓
{ id: '...', result: { address, signature, ... } }
```

### Q: 기존 Wallet과 동시에 작동할 수 있나?

**A:** 네, 둘 다 동시에 작동 가능:

- Wallet은 W3mFrame 메시지 처리
- WebApp은 crossxNativeBridge 사용
- 충돌 없음

---

## 📞 연락처

WebApp SDK 관련 문의: `packages/webapp/`
