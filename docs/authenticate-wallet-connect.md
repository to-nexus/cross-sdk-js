# WalletConnect + SIWE 통합 인증 (Authenticate & Connect)

## 개요

일반적인 WalletConnect 연결 플로우에서는 사용자가 다음과 같은 2단계 과정을 거쳐야 합니다:

1. **Connect**: 지갑 연결 승인
2. **SIWE Sign**: Sign-In with Ethereum 서명 승인

모바일 환경에서 이는 dApp과 지갑 앱 사이를 2번 왕복해야 하는 불편한 UX를 만듭니다.

`authenticateWalletConnect()` 메서드는 이 두 단계를 하나로 통합하여, **단 한 번의 승인으로 연결과 인증을 동시에 처리**합니다.

## 작동 원리

이 기능은 WalletConnect의 `authenticate` RPC 메서드를 활용합니다:

1. SIWX 메시지를 생성합니다
2. WalletConnect authenticate 요청을 보냅니다
3. 지갑에서 한 번의 승인으로 연결 + 서명이 처리됩니다
4. 세션과 SIWX 인증 정보가 자동으로 저장됩니다

## 사용 방법

### React에서 사용

```typescript
import { useAppKit } from '@to-nexus/sdk/react'
import { useState } from 'react'

function ConnectButton() {
  const { authenticateWalletConnect } = useAppKit()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 연결 + SIWE 인증을 한번에 처리
      const isAuthenticated = await authenticateWalletConnect()

      if (isAuthenticated) {
        console.log('Successfully connected and authenticated!')
      } else {
        console.log('Authentication was not completed')
      }
    } catch (err) {
      console.error('Failed to authenticate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleConnect} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Connect & Authenticate'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

### Vanilla JS에서 사용

```typescript
import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import { createAppKit } from '@to-nexus/sdk'

// SDK 초기화
const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [
    /* your networks */
  ],
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'My App',
    description: 'My App Description',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png']
  },
  // SIWX 설정 필수
  siwx: siweClient.mapToSIWX()
})

// 연결 + 인증 실행
async function connectAndAuthenticate() {
  try {
    const isAuthenticated = await modal.authenticateWalletConnect()

    if (isAuthenticated) {
      console.log('✅ Connected and authenticated successfully!')
      // 이제 사용자는 연결되고 인증된 상태입니다
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error)
  }
}
```

### ConnectionController 직접 사용

```typescript
import { ConnectionController } from '@to-nexus/appkit-core'

// 연결 + 인증 실행
async function authenticate() {
  try {
    const result = await ConnectionController.authenticateWalletConnect()
    return result
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}
```

## 필수 조건

이 기능을 사용하려면 다음 조건이 필요합니다:

### 1. SIWX 설정

AppKit 초기화 시 SIWX 클라이언트를 반드시 설정해야 합니다:

```typescript
import { AppKitSIWEClient } from '@to-nexus/appkit-siwe'

import { createSIWEConfig, formatMessage } from '@reown/appkit-siwe'

// SIWE 클라이언트 생성
const siweClient = new AppKitSIWEClient({
  getNonce: async () => {
    // 서버에서 nonce 가져오기
    const response = await fetch('/api/siwe/nonce')
    return response.text()
  },
  createMessage: ({ nonce, address, chainId }) => {
    // SIWE 메시지 생성
    return formatMessage({
      address,
      chainId,
      nonce,
      domain: window.location.host,
      uri: window.location.origin,
      version: '1',
      statement: 'Sign in with Ethereum to the app.'
    })
  },
  verifyMessage: async ({ message, signature }) => {
    // 서버에서 서명 검증
    const response = await fetch('/api/siwe/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature })
    })
    return response.ok
  },
  getSession: async () => {
    // 현재 세션 가져오기
    const response = await fetch('/api/siwe/session')
    if (!response.ok) return null
    return response.json()
  },
  onSignIn: session => {
    console.log('User signed in:', session)
  },
  onSignOut: () => {
    console.log('User signed out')
  }
})

// AppKit에 SIWX 설정 추가
const modal = createAppKit({
  // ... 다른 설정들
  siwx: siweClient.mapToSIWX()
})
```

### 2. 지원되는 체인

현재 이 기능은 **EIP-155 (Ethereum) 체인**만 지원합니다. 다른 체인(Solana 등)에서는 자동으로 일반 연결로 폴백됩니다.

## 에러 처리

```typescript
const { authenticateWalletConnect } = useAppKit()

async function handleAuthenticate() {
  try {
    const result = await authenticateWalletConnect()

    if (!result) {
      // 인증이 완료되지 않음 (사용자가 취소했거나 조건이 맞지 않음)
      console.log('Authentication was not completed')
    }
  } catch (error) {
    if (error.message.includes('not available')) {
      // authenticateWalletConnect 메서드를 사용할 수 없음
      console.error('Feature not supported')
    } else if (error.message.includes('SIWX')) {
      // SIWX 관련 에러
      console.error('SIWX configuration error')
    } else {
      // 기타 에러
      console.error('Connection error:', error)
    }
  }
}
```

## 일반 connect와의 비교

### 기존 방식 (2단계)

```typescript
const { connect } = useAppKit()

// 1단계: 연결
await connect() // 지갑으로 이동 → 승인 → dApp으로 복귀

// 2단계: SIWE 서명 (자동으로 모달 표시)
// 지갑으로 이동 → 서명 → dApp으로 복귀
```

### 새로운 방식 (1단계)

```typescript
const { authenticateWalletConnect } = useAppKit()

// 한번에 처리
await authenticateWalletConnect() // 지갑으로 이동 → 승인 → dApp으로 복귀 (끝!)
```

## 이벤트 추적

성공적인 인증 시 다음 이벤트가 발생합니다:

- `CONNECT_SUCCESS`: 연결 성공
- `SIWX_AUTH_SUCCESS`: SIWX 인증 성공

실패 시:

- `CONNECT_ERROR`: 연결 실패
- `SIWX_AUTH_ERROR`: SIWX 인증 실패

## 제한사항

1. **EIP-155 체인만 지원**: Solana 등 다른 체인에서는 작동하지 않습니다
2. **SIWX 필수**: SIWX가 설정되지 않으면 에러가 발생합니다
3. **WalletConnect 전용**: 브라우저 확장 프로그램 지갑에서는 사용할 수 없습니다

## 모바일 UX 개선 효과

### Before (기존 방식)

```
1. dApp에서 "Connect" 버튼 클릭
2. 지갑 앱으로 이동
3. 연결 승인
4. dApp으로 복귀
5. SIWE 서명 모달 표시
6. "Sign" 버튼 클릭
7. 지갑 앱으로 이동
8. 서명 승인
9. dApp으로 복귀
```

### After (통합 인증)

```
1. dApp에서 "Connect & Authenticate" 버튼 클릭
2. 지갑 앱으로 이동
3. 연결 + 서명 한번에 승인
4. dApp으로 복귀
```

**약 50% 단계 감소! 🚀**

## API Reference

### `authenticateWalletConnect()`

WalletConnect를 통해 연결과 SIWE 인증을 동시에 수행합니다.

**Returns**: `Promise<boolean>`

- `true`: 인증 성공
- `false`: 인증이 완료되지 않음 (SIWX 미설정 또는 지원하지 않는 체인)

**Throws**:

- 연결 실패
- 인증 실패
- 클라이언트 설정 오류

**Usage**:

```typescript
// React Hook
const { authenticateWalletConnect } = useAppKit()
await authenticateWalletConnect()

// AppKit Instance
await modal.authenticateWalletConnect()

// ConnectionController
await ConnectionController.authenticateWalletConnect()
```

## 관련 문서

- [SIWE/SIWX 설정 가이드](./siwe-setup.md)
- [WalletConnect 통합](./walletconnect-integration.md)
- [모바일 딥링크 설정](./mobile-deeplink.md)
