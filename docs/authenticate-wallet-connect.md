# WalletConnect + SIWE 통합 인증 (Connect + Auth)

> [English Version](./authenticate-wallet-connect-en.md)

## 개요

일반적인 지갑 연결 플로우에서는 사용자가 다음과 같은 2단계 과정을 거쳐야 합니다:

1. **Connect**: 지갑 연결 승인
2. **SIWE Sign**: Sign-In with Ethereum 서명 승인

모바일 환경에서 이는 dApp과 지갑 앱 사이를 2번 왕복해야 하는 불편한 UX를 만듭니다.

Cross SDK는 이 두 단계를 하나로 통합하여, **단 한 번의 승인으로 연결과 인증을 동시에 처리**하는 두 가지 방법을 제공합니다:

- **QR Code 연결**: `authenticateWalletConnect()` - WalletConnect 프로토콜 활용
- **Extension 연결**: `authenticateCrossExtensionWallet()` - 브라우저 확장 프로그램 지갑 연결

## 목차

- [QR Code + SIWE 통합 인증](#qr-code--siwe-통합-인증)
- [Extension + SIWE 통합 인증](#extension--siwe-통합-인증)
- [SIWX 설정 간소화 (createDefaultSIWXConfig)](#siwx-설정-간소화)
- [플랫폼별 구현 예제](#플랫폼별-구현-예제)
- [보안 권장사항](#보안-권장사항)
- [버튼 상태 관리](#버튼-상태-관리)
- [자동 재연결](#자동-재연결)
- [API Reference](#api-reference)

---

## QR Code + SIWE 통합 인증

### 작동 원리

WalletConnect의 `wc_sessionAuthenticate` RPC 메서드를 활용합니다:

1. SIWX 메시지를 생성합니다
2. WalletConnect authenticate 요청을 보냅니다
3. 지갑에서 한 번의 승인으로 연결 + 서명이 처리됩니다
4. 세션과 SIWX 인증 정보가 자동으로 저장됩니다

### 사용 방법

#### React

```typescript
import { useAppKit } from '@to-nexus/sdk/react'
import { useState } from 'react'

function ConnectButton() {
  const { authenticateWalletConnect } = useAppKit()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      const result = await authenticateWalletConnect()

      if (result && result.authenticated && result.sessions?.length > 0) {
        console.log('✅ Connected and authenticated!', result.sessions[0])
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleConnect} disabled={isLoading}>
      {isLoading ? 'Authenticating...' : 'Connect + Auth (QR Code)'}
    </button>
  )
}
```

#### Vanilla JS / CDN

```javascript
// Vanilla JS
const { authenticateWalletConnect } = window.CrossSdk

button.addEventListener('click', async () => {
  try {
    const result = await crossSdk.authenticateWalletConnect()
    if (result?.authenticated && result?.sessions?.length > 0) {
      console.log('✅ Connected and authenticated!')
    }
  } catch (error) {
    console.error('Authentication failed:', error)
  }
})
```

#### Wagmi

```typescript
import { useAppKit } from '@to-nexus/appkit/react'

function ConnectButton() {
  const crossAppKit = useAppKit()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      const result = await crossAppKit.authenticateWalletConnect()

      if (result?.authenticated && result?.sessions?.length > 0) {
        alert('🎉 SIWE 인증 성공!')
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleConnect} disabled={isLoading}>
      {isLoading ? 'Authenticating...' : 'Connect + Auth (QR Code)'}
    </button>
  )
}
```

---

## Extension + SIWE 통합 인증

브라우저 확장 프로그램 지갑(예: Cross Extension, MetaMask Extension)에서도 연결과 SIWE 인증을 한 번에 처리할 수 있습니다.

### 작동 원리

1. 확장 프로그램 지갑에 연결 요청
2. 연결 완료 후 SIWX 메시지 자동 생성
3. `signMessage`로 서명 요청
4. 세션 저장 및 검증
5. 중복 모달 방지 플래그 관리

### 사용 방법

#### React

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'
import { useState } from 'react'

function ConnectExtensionButton() {
  const { authenticateCrossExtensionWallet, isInstalledCrossExtensionWallet } = useAppKitWallet()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    if (!isInstalledCrossExtensionWallet()) {
      alert('Cross Extension을 먼저 설치해주세요.')
      return
    }

    try {
      setIsLoading(true)
      const result = await authenticateCrossExtensionWallet()

      if (result?.authenticated && result?.sessions?.length > 0) {
        console.log('✅ Extension connected and authenticated!', result.sessions[0])
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading || !isInstalledCrossExtensionWallet()}
    >
      {isLoading ? 'Authenticating...' : 'Connect + Auth (Extension)'}
    </button>
  )
}
```

#### Vanilla JS / CDN

```javascript
const { ConnectorUtil, isInstalledCrossExtensionWallet } = window.CrossSdk

button.addEventListener('click', async () => {
  if (!ConnectorUtil.isInstalledCrossExtensionWallet()) {
    alert('Cross Extension을 먼저 설치해주세요.')
    return
  }

  try {
    button.disabled = true
    button.textContent = 'Authenticating...'

    const result = await ConnectorUtil.authenticateCrossExtensionWallet()

    if (result?.authenticated && result?.sessions?.length > 0) {
      console.log('✅ Connected and authenticated!')
      alert('인증 성공!')
    }
  } catch (error) {
    console.error('Authentication failed:', error)
    alert('인증 실패: ' + error.message)
  } finally {
    button.disabled = false
    button.textContent = 'Connect + Auth (Extension)'
  }
})
```

#### Wagmi

```typescript
import { sdkWagmiAdapter } from '../utils/wagmi-utils'

function ConnectExtensionButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      const result = await sdkWagmiAdapter.authenticateCrossExtensionWallet()

      if (result?.authenticated && result?.sessions?.length > 0) {
        alert('🎉 Extension 인증 성공!')
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleConnect} disabled={isLoading}>
      {isLoading ? 'Authenticating...' : 'Connect + Auth (Extension)'}
    </button>
  )
}
```

---

## SIWX 설정 간소화

### `createDefaultSIWXConfig()` 유틸리티

모든 DApp이 동일한 SIWX 설정 보일러플레이트를 반복 작성하는 것을 방지하기 위해, SDK는 표준 SIWX 설정을 간편하게 생성하는 유틸리티 함수를 제공합니다.

### 기본 사용법

```typescript
import { createDefaultSIWXConfig } from '@to-nexus/sdk/react'

const siwxConfig = createDefaultSIWXConfig({
  // === 자주 커스터마이즈하는 옵션 ===
  statement: 'Sign in to My DApp',

  getNonce: async () => {
    // ⚠️ 프로덕션에서는 반드시 백엔드에서 nonce를 가져와야 합니다!
    const response = await fetch('/api/siwe/nonce')
    return response.text()
  },

  addSession: async session => {
    // 세션을 저장하는 로직 (localStorage, 백엔드 등)
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },

  getSessions: async (chainId, address) => {
    // 저장된 세션을 가져오는 로직
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (
        session.data.chainId === chainId &&
        session.data.accountAddress.toLowerCase() === address.toLowerCase()
      ) {
        return [session]
      }
    }
    return []
  },

  // === 선택적 커스터마이즈 옵션 ===
  domain: window.location.host, // 기본값: window.location.host
  uri: window.location.origin, // 기본값: window.location.origin
  expirationTime: '2024-12-31T23:59:59Z' // 또는 함수로 동적 생성
})

// SDK 초기화 시 사용
initCrossSdk(projectId, redirectUrl, metadata, 'dark', network, adapters, mobileLink, siwxConfig)
```

### 프로덕션 환경 예제

**⚠️ 보안 경고**: 클라이언트 사이드에서 nonce를 생성하면 재사용 공격에 취약합니다. 반드시 백엔드에서 생성해야 합니다!

```typescript
const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in with your wallet to Cross SDK Sample App',

  // ✅ 백엔드에서 nonce 가져오기 (권장)
  getNonce: async () => {
    const response = await fetch('https://your-api.com/api/siwe/nonce', {
      credentials: 'include' // 쿠키 포함
    })
    if (!response.ok) {
      throw new Error('Failed to get nonce')
    }
    return response.text()
  },

  // ✅ 백엔드에 세션 저장 (권장)
  addSession: async session => {
    const response = await fetch('https://your-api.com/api/siwe/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        message: session.message,
        signature: session.signature,
        data: session.data
      })
    })

    if (!response.ok) {
      throw new Error('Failed to save session')
    }

    // 로컬에도 플래그 저장 (재연결 시 확인용)
    localStorage.setItem('has_siwx_session', 'true')
  },

  // ✅ 백엔드에서 세션 조회 (권장)
  getSessions: async (chainId, address) => {
    const response = await fetch(
      `https://your-api.com/api/siwe/session?chainId=${chainId}&address=${address}`,
      { credentials: 'include' }
    )

    if (!response.ok) {
      return []
    }

    const session = await response.json()
    return session ? [session] : []
  }
})
```

### 옵션 설명

#### 자주 커스터마이즈하는 옵션

- **`statement`**: SIWE 메시지에 표시될 문구
- **`getNonce`**: 백엔드에서 nonce를 가져오는 함수 (필수!)
- **`addSession`**: 세션을 저장하는 함수
- **`getSessions`**: 세션을 조회하는 함수

#### 선택적 옵션

- **`domain`**: SIWE 메시지의 도메인 (기본값: `window.location.host`)
- **`uri`**: SIWE 메시지의 URI (기본값: `window.location.origin`)
- **`expirationTime`**: 세션 만료 시간 (문자열 또는 함수)

#### 고급 옵션 (거의 수정 안 함)

- **`revokeSession`**: 세션을 취소하는 함수
- **`setSessions`**: 여러 세션을 한 번에 저장하는 함수
- **`getRequired`**: SIWE가 필수인지 여부를 반환하는 함수

---

## 플랫폼별 구현 예제

### React SDK

```typescript
import { createDefaultSIWXConfig, initCrossSdk } from '@to-nexus/sdk/react'

// SIWX 설정
const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in to My App',
  getNonce: async () => {
    const response = await fetch('/api/nonce')
    return response.text()
  },
  addSession: async session => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (
        session.data.chainId === chainId &&
        session.data.accountAddress.toLowerCase() === address.toLowerCase()
      ) {
        return [session]
      }
    }
    return []
  }
})

// SDK 초기화
initCrossSdk(
  projectId,
  redirectUrl,
  metadata,
  'dark',
  defaultNetwork,
  adapters,
  mobileLink,
  siwxConfig // SIWX 설정 추가
)
```

### Vanilla JS SDK

```javascript
import { createDefaultSIWXConfig, initCrossSdkWithParams } from '@to-nexus/sdk'

// SIWX 설정
const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in to My App',
  getNonce: async () => {
    console.warn('⚠️ Using client-side nonce. Use backend nonce for production!')
    return Math.random().toString(36).substring(2, 15)
  },
  addSession: async session => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (
        session.data.chainId === chainId &&
        session.data.accountAddress.toLowerCase() === address.toLowerCase()
      ) {
        return [session]
      }
    }
    return []
  }
})

// SDK 초기화
const crossSdk = initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'dark',
  defaultNetwork,
  adapters,
  mobileLink,
  siwx: siwxConfig // SIWX 설정 추가
})
```

### CDN

```javascript
// SIWX 설정
const siwxConfig = window.CrossSdk.createDefaultSIWXConfig({
  statement: 'Sign in to My App',
  getNonce: async () => {
    console.warn('⚠️ Using client-side nonce. Use backend nonce for production!')
    return Math.random().toString(36).substring(2, 15)
  },
  addSession: async session => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (
        session.data.chainId === chainId &&
        session.data.accountAddress.toLowerCase() === address.toLowerCase()
      ) {
        return [session]
      }
    }
    return []
  }
})

// SDK 초기화
const crossSdk = window.CrossSdk.initCrossSdkWithParams({
  projectId: '0979fd7c92ec3dbd8e78f433c3e5a523',
  redirectUrl: window.location.origin,
  metadata: {
    name: 'My App',
    description: 'My App Description',
    url: window.location.origin,
    icons: ['https://myapp.com/icon.png']
  },
  themeMode: 'dark',
  defaultNetwork: window.CrossSdk.crossMainnet,
  adapters: [],
  mobileLink: 'https://cross-wallet.crosstoken.io',
  siwx: siwxConfig // SIWX 설정 추가
})
```

### Wagmi

```typescript
import { ToNexusWagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'
import { createDefaultSIWXConfig } from '@to-nexus/appkit/react'

// SIWX 설정
export const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in to My Wagmi App',
  getNonce: async () => {
    const response = await fetch('/api/nonce')
    return response.text()
  },
  addSession: async session => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (
        session.data.chainId === chainId &&
        session.data.accountAddress.toLowerCase() === address.toLowerCase()
      ) {
        return [session]
      }
    }
    return []
  },
  getRequired: () => false // 자동 SIWE 모달 비활성화 (Connect + Auth 버튼 사용 시)
})

// Wagmi Adapter 생성
export const sdkWagmiAdapter = new ToNexusWagmiAdapter({
  projectId,
  networks,
  siwx: siwxConfig // SIWX 설정 추가
})

// Cross SDK 초기화 (Cross Wallet용)
initCrossSdk(
  projectId,
  redirectUrl,
  metadata,
  'dark',
  defaultNetwork,
  [sdkWagmiAdapter],
  mobileLink,
  siwxConfig // SIWX 설정 추가
)
```

---

## 보안 권장사항

### 1. Nonce 생성

**❌ 절대 하지 말아야 할 것:**

```typescript
// 클라이언트에서 nonce 생성 (재사용 공격 취약!)
getNonce: async () => {
  return Math.random().toString(36).substring(2, 15)
}
```

**✅ 반드시 해야 할 것:**

```typescript
// 백엔드에서 nonce 생성 및 검증
getNonce: async () => {
  const response = await fetch('https://your-api.com/api/siwe/nonce', {
    credentials: 'include' // 세션 쿠키 포함
  })
  return response.text()
}
```

**백엔드 구현 예시 (Node.js + Express):**

```javascript
const express = require('express')
const session = require('express-session')
const { generateNonce } = require('siwe')

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: 'strict' }
  })
)

// Nonce 생성 엔드포인트
app.get('/api/siwe/nonce', (req, res) => {
  req.session.nonce = generateNonce()
  res.send(req.session.nonce)
})

// 서명 검증 엔드포인트
app.post('/api/siwe/verify', async (req, res) => {
  const { message, signature } = req.body
  const siweMessage = new SiweMessage(message)

  try {
    await siweMessage.verify({ signature, nonce: req.session.nonce })
    req.session.siwe = { address: siweMessage.address, chainId: siweMessage.chainId }
    req.session.nonce = null // nonce 무효화
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})
```

### 2. 세션 저장

**로컬 개발용 (localStorage):**

```typescript
addSession: async session => {
  localStorage.setItem('siwx_session', JSON.stringify(session))
}
```

**프로덕션용 (백엔드 저장):**

```typescript
addSession: async session => {
  await fetch('https://your-api.com/api/siwe/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(session)
  })
  localStorage.setItem('has_siwx_session', 'true') // 플래그만 저장
}
```

### 3. HTTPS 사용

프로덕션 환경에서는 반드시 HTTPS를 사용하여 중간자 공격을 방지해야 합니다.

### 4. 도메인 검증

백엔드에서 SIWE 메시지의 `domain` 필드가 현재 요청의 도메인과 일치하는지 확인해야 합니다.

---

## 버튼 상태 관리

여러 버튼이 있을 때 개별 loading 상태를 관리하는 패턴입니다.

### React 예제

```typescript
import { useState } from 'react'

function WalletButtons() {
  // ✅ 개별 버튼별 loading state 관리
  const [loadingStates, setLoadingStates] = useState({
    connectQR: false,
    connectExtension: false,
    authenticateQR: false,
    authenticateExtension: false
  })

  // 전체 loading 여부 계산
  const isAnyLoading = Object.values(loadingStates).some(state => state)

  const handleAuthenticateQR = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, authenticateQR: true }))
      const result = await authenticateWalletConnect()
      // 처리 로직
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingStates(prev => ({ ...prev, authenticateQR: false }))
    }
  }

  const handleAuthenticateExtension = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, authenticateExtension: true }))
      const result = await authenticateCrossExtensionWallet()
      // 처리 로직
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingStates(prev => ({ ...prev, authenticateExtension: false }))
    }
  }

  return (
    <div>
      <button
        onClick={handleAuthenticateQR}
        disabled={isAnyLoading}
      >
        {loadingStates.authenticateQR ? 'Authenticating...' : 'Connect + Auth (QR)'}
      </button>

      <button
        onClick={handleAuthenticateExtension}
        disabled={isAnyLoading}
      >
        {loadingStates.authenticateExtension ? 'Authenticating...' : 'Connect + Auth (Extension)'}
      </button>
    </div>
  )
}
```

### 모달 취소 시 상태 복구 (React)

AppKit 모달을 취소했을 때 loading 상태를 복구하는 패턴:

```typescript
import { useEffect } from 'react'

import { useAppKitState } from '@to-nexus/sdk/react'

function WalletButtons() {
  const appKitState = useAppKitState() // 모달 상태 구독
  const [loadingStates, setLoadingStates] = useState({
    authenticateQR: false
  })

  // ✅ 모달이 닫힐 때 authenticateQR loading state 리셋
  useEffect(() => {
    if (!appKitState.open && loadingStates.authenticateQR) {
      setLoadingStates(prev => ({ ...prev, authenticateQR: false }))
    }
  }, [appKitState.open, loadingStates.authenticateQR])

  // ... 버튼 핸들러
}
```

### Vanilla JS / CDN 예제

```javascript
const buttons = {
  authenticateQR: document.getElementById('authenticate-qr'),
  authenticateExtension: document.getElementById('authenticate-extension')
}

function setButtonLoading(buttonId, isLoading) {
  const button = buttons[buttonId]
  button.disabled = isLoading
  button.style.opacity = isLoading ? '0.6' : '1'
  button.style.cursor = isLoading ? 'not-allowed' : 'pointer'
}

// QR Code + Auth
buttons.authenticateQR.addEventListener('click', async () => {
  try {
    setButtonLoading('authenticateQR', true)
    buttons.authenticateQR.textContent = 'Authenticating...'

    const result = await crossSdk.authenticateWalletConnect()
    // 처리 로직
  } catch (error) {
    console.error(error)
  } finally {
    setButtonLoading('authenticateQR', false)
    buttons.authenticateQR.textContent = 'Connect + Auth (QR Code)'
  }
})

// Extension + Auth
buttons.authenticateExtension.addEventListener('click', async () => {
  try {
    setButtonLoading('authenticateExtension', true)
    buttons.authenticateExtension.textContent = 'Authenticating...'

    const result = await ConnectorUtil.authenticateCrossExtensionWallet()
    // 처리 로직
  } catch (error) {
    console.error(error)
  } finally {
    setButtonLoading('authenticateExtension', false)
    buttons.authenticateExtension.textContent = 'Connect + Auth (Extension)'
  }
})
```

---

## 자동 재연결

페이지 새로고침 시 이전 연결을 복원하는 로직입니다.

### localStorage 플래그 관리

```typescript
// 연결 성공 시
localStorage.setItem('wallet_connected', 'true')
localStorage.setItem('wallet_type', 'cross') // 또는 'metamask'
localStorage.setItem('has_siwx_session', 'true') // SIWE 인증 완료 시

// 연결 해제 시
localStorage.removeItem('wallet_connected')
localStorage.removeItem('wallet_type')
localStorage.removeItem('has_siwx_session')
localStorage.removeItem('siwx_session')
```

### 자동 재연결 조건

```typescript
// Cross Wallet의 경우 SDK가 자동으로 재연결을 처리합니다.
// 다음 조건을 모두 만족할 때 자동 재연결:
// 1. wallet_connected === 'true'
// 2. WalletConnect 세션이 유효함
// 3. SIWX 세션이 있으면 getSessions()로 조회 가능
```

### MetaMask Extension 자동 재연결 (예제)

```typescript
async function autoReconnectMetaMask() {
  try {
    const wasConnected = localStorage.getItem('wallet_connected') === 'true'
    const walletType = localStorage.getItem('wallet_type')

    if (!wasConnected || walletType !== 'metamask') {
      return // 이전에 연결된 적 없음
    }

    const provider = findMetaMaskProvider()
    if (!provider) {
      localStorage.removeItem('wallet_connected')
      return
    }

    // eth_accounts는 이미 연결된 계정만 반환 (사용자 승인 불필요)
    const accounts = await provider.request({ method: 'eth_accounts' })

    if (accounts && accounts.length > 0) {
      // 연결 복원
      metamaskProvider = provider
      metamaskAccount = accounts[0]

      // 네트워크 정보 가져오기
      const chainIdHex = await provider.request({ method: 'eth_chainId' })
      metamaskChainId = parseInt(chainIdHex, 16)

      // 이벤트 리스너 재설정
      provider.on('chainChanged', handleChainChanged)
      provider.on('accountsChanged', handleAccountsChanged)

      console.log('✅ Auto-reconnected to MetaMask')
    } else {
      localStorage.removeItem('wallet_connected')
    }
  } catch (error) {
    console.error('Auto-reconnect failed:', error)
    localStorage.removeItem('wallet_connected')
  }
}

// 페이지 로드 시 실행
autoReconnectMetaMask()
```

---

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

#### QR Code

```typescript
const { authenticateWalletConnect } = useAppKit()

// 한번에 처리
await authenticateWalletConnect() // 지갑으로 이동 → 승인 → dApp으로 복귀 (끝!)
```

#### Extension

```typescript
const { authenticateCrossExtensionWallet } = useAppKitWallet()

// 한번에 처리
await authenticateCrossExtensionWallet() // Extension에서 연결 + 서명 한 번에!
```

---

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
1. dApp에서 "Connect + Auth" 버튼 클릭
2. 지갑 앱으로 이동
3. 연결 + 서명 한번에 승인
4. dApp으로 복귀
```

**약 50% 단계 감소! 🚀**

---

## API Reference

### `authenticateWalletConnect()`

WalletConnect를 통해 연결과 SIWE 인증을 동시에 수행합니다.

**Returns**: `Promise<{ authenticated: boolean; sessions: SIWXSession[] }>`

- `authenticated`: 인증 성공 여부
- `sessions`: SIWX 세션 배열

**Throws**:

- 연결 실패
- 인증 실패
- SIWX 미설정

**Usage**:

```typescript
// React Hook
const { authenticateWalletConnect } = useAppKit()
const result = await authenticateWalletConnect()

// AppKit Instance
await modal.authenticateWalletConnect()

// ConnectionController (고급 사용)
await ConnectionController.authenticateWalletConnect()
```

### `authenticateCrossExtensionWallet()`

브라우저 확장 프로그램 지갑을 통해 연결과 SIWE 인증을 동시에 수행합니다.

**Returns**: `Promise<{ authenticated: boolean; sessions: SIWXSession[] }>`

- `authenticated`: 인증 성공 여부
- `sessions`: SIWX 세션 배열

**Throws**:

- 확장 프로그램 미설치
- 연결 실패
- 인증 실패
- SIWX 미설정

**Usage**:

```typescript
// React Hook
const { authenticateCrossExtensionWallet } = useAppKitWallet()
const result = await authenticateCrossExtensionWallet()

// Vanilla JS / CDN
const result = await window.CrossSdk.ConnectorUtil.authenticateCrossExtensionWallet()

// Wagmi Adapter
const result = await sdkWagmiAdapter.authenticateCrossExtensionWallet()
```

### `createDefaultSIWXConfig(options)`

표준 SIWX 설정을 생성합니다.

**Parameters**:

```typescript
interface CreateSIWXConfigOptions {
  // === 자주 커스터마이즈하는 옵션 ===
  statement?: string
  getNonce?: () => Promise<string>
  addSession?: (session: SIWXSession) => Promise<void>
  getSessions?: (chainId: string, address: string) => Promise<SIWXSession[]>

  // === 선택적 옵션 ===
  domain?: string
  uri?: string
  expirationTime?: string | ((issuedAt: Date) => string)

  // === 고급 옵션 ===
  revokeSession?: (chainId: string, address: string) => Promise<void>
  setSessions?: (sessions: SIWXSession[]) => Promise<void>
  getRequired?: () => boolean
}
```

**Returns**: `SIWXConfig`

**Usage**:

```typescript
import { createDefaultSIWXConfig } from '@to-nexus/sdk/react'

const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in to My App',
  getNonce: async () => {
    const response = await fetch('/api/nonce')
    return response.text()
  }
})
```

---

## 제한사항

1. **EIP-155 체인만 지원**: Solana 등 다른 체인에서는 작동하지 않습니다
2. **SIWX 필수**: SIWX가 설정되지 않으면 에러가 발생합니다
3. **`authenticateWalletConnect`는 WalletConnect 전용**: 브라우저 확장 프로그램에서는 `authenticateCrossExtensionWallet`을 사용하세요

---

## 문제 해결

### 중복 SIWE 모달이 표시됨

SDK는 연결 후 자동으로 SIWE 모달을 표시하려고 시도합니다. `authenticateWalletConnect()` 또는 `authenticateCrossExtensionWallet()`을 사용하면 이미 인증이 완료되었으므로 중복 모달을 방지하는 내부 플래그(`_isAuthenticating`)가 관리됩니다.

**해결책**: SDK가 제공하는 통합 인증 메서드를 사용하면 자동으로 처리됩니다.

### 새로고침 시 SIWE 모달이 다시 표시됨

`getSessions()` 함수가 올바르게 구현되지 않았을 수 있습니다.

**해결책**:

```typescript
getSessions: async (chainId, address) => {
  // localStorage.getItem('siwx_session') 확인
  const sessionStr = localStorage.getItem('siwx_session')
  if (sessionStr) {
    const session = JSON.parse(sessionStr)
    if (
      session.data.chainId === chainId &&
      session.data.accountAddress.toLowerCase() === address.toLowerCase()
    ) {
      return [session]
    }
  }

  // localStorage.getItem('siwx_sessions') 확인 (QR Code 인증 시)
  const sessionsStr = localStorage.getItem('siwx_sessions')
  if (sessionsStr) {
    const sessions = JSON.parse(sessionsStr)
    return sessions.filter(
      (s: any) =>
        s.data.chainId === chainId && s.data.accountAddress.toLowerCase() === address.toLowerCase()
    )
  }

  return []
}
```

### 버튼이 loading 상태에서 멈춤

모달을 취소했을 때 loading 상태가 복구되지 않았을 수 있습니다.

**해결책**: [버튼 상태 관리](#버튼-상태-관리) 섹션의 "모달 취소 시 상태 복구" 패턴을 참고하세요.

---

## 관련 문서

- [Cross SDK Documentation](https://cross.readme.io/update/docs/js/)
- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [WalletConnect Documentation](https://docs.walletconnect.com/)

---

## 예제 코드

전체 예제는 다음 디렉토리에서 확인하실 수 있습니다:

- [React Example](../examples/sdk-react/)
- [Vanilla JS Example](../examples/sdk-vanilla/)
- [CDN Example](../examples/sdk-cdn/)
- [Wagmi Example](../examples/sdk-wagmi/)
