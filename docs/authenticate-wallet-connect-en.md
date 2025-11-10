# WalletConnect + SIWE Integrated Authentication (Connect + Auth)

> [한글 버전](./authenticate-wallet-connect.md)

## Overview

In typical wallet connection flows, users must go through a 2-step process:

1. **Connect**: Approve wallet connection
2. **SIWE Sign**: Approve Sign-In with Ethereum signature

In mobile environments, this creates an inconvenient UX where users must switch between the dApp and wallet app twice.

Cross SDK consolidates these two steps into one, providing **single approval for both connection and authentication** through two methods:

- **QR Code Connection**: `authenticateWalletConnect()` - Utilizes WalletConnect protocol
- **Extension Connection**: `authenticateCrossExtensionWallet()` - Browser extension wallet connection

## Table of Contents

- [QR Code + SIWE Integrated Authentication](#qr-code--siwe-integrated-authentication)
- [Extension + SIWE Integrated Authentication](#extension--siwe-integrated-authentication)
- [Simplified SIWX Configuration (createDefaultSIWXConfig)](#simplified-siwx-configuration)
- [Platform-Specific Implementation Examples](#platform-specific-implementation-examples)
- [Security Recommendations](#security-recommendations)
- [Button State Management](#button-state-management)
- [Auto-Reconnection](#auto-reconnection)
- [API Reference](#api-reference)

---

## QR Code + SIWE Integrated Authentication

### How It Works

Utilizes WalletConnect's `wc_sessionAuthenticate` RPC method:

1. Generates a SIWX message
2. Sends a WalletConnect authenticate request
3. Wallet handles connection + signature in a single approval
4. Session and SIWX authentication information are automatically saved

### Usage

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
        alert('🎉 SIWE Authentication successful!')
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

## Extension + SIWE Integrated Authentication

Browser extension wallets (e.g., Cross Extension, MetaMask Extension) can also handle connection and SIWE authentication in a single step.

### How It Works

1. Request connection to extension wallet
2. Automatically generate SIWX message after connection
3. Request signature via `signMessage`
4. Save and verify session
5. Manage duplicate modal prevention flag

### Usage

#### React

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'
import { useState } from 'react'

function ConnectExtensionButton() {
  const { authenticateCrossExtensionWallet, isInstalledCrossExtensionWallet } = useAppKitWallet()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    if (!isInstalledCrossExtensionWallet()) {
      alert('Please install Cross Extension first.')
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
    alert('Please install Cross Extension first.')
    return
  }

  try {
    button.disabled = true
    button.textContent = 'Authenticating...'
    
    const result = await ConnectorUtil.authenticateCrossExtensionWallet()
    
    if (result?.authenticated && result?.sessions?.length > 0) {
      console.log('✅ Connected and authenticated!')
      alert('Authentication successful!')
    }
  } catch (error) {
    console.error('Authentication failed:', error)
    alert('Authentication failed: ' + error.message)
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
        alert('🎉 Extension authentication successful!')
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

## Simplified SIWX Configuration

### `createDefaultSIWXConfig()` Utility

To prevent all DApps from repeatedly writing the same SIWX configuration boilerplate, the SDK provides a utility function to easily create standard SIWX configurations.

### Basic Usage

```typescript
import { createDefaultSIWXConfig } from '@to-nexus/sdk/react'

const siwxConfig = createDefaultSIWXConfig({
  // === Frequently customized options ===
  statement: 'Sign in to My DApp',
  
  getNonce: async () => {
    // ⚠️ In production, you MUST fetch nonce from backend!
    const response = await fetch('/api/siwe/nonce')
    return response.text()
  },
  
  addSession: async (session) => {
    // Logic to save session (localStorage, backend, etc.)
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  
  getSessions: async (chainId, address) => {
    // Logic to retrieve saved session
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (session.data.chainId === chainId && 
          session.data.accountAddress.toLowerCase() === address.toLowerCase()) {
        return [session]
      }
    }
    return []
  },
  
  // === Optional customization options ===
  domain: window.location.host, // Default: window.location.host
  uri: window.location.origin,  // Default: window.location.origin
  expirationTime: '2024-12-31T23:59:59Z', // Or function for dynamic generation
})

// Use in SDK initialization
initCrossSdk(projectId, redirectUrl, metadata, 'dark', network, adapters, mobileLink, siwxConfig)
```

### Production Environment Example

**⚠️ Security Warning**: Generating nonce client-side is vulnerable to replay attacks. It MUST be generated by the backend!

```typescript
const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in with your wallet to Cross SDK Sample App',
  
  // ✅ Fetch nonce from backend (recommended)
  getNonce: async () => {
    const response = await fetch('https://your-api.com/api/siwe/nonce', {
      credentials: 'include' // Include cookies
    })
    if (!response.ok) {
      throw new Error('Failed to get nonce')
    }
    return response.text()
  },
  
  // ✅ Save session to backend (recommended)
  addSession: async (session) => {
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
    
    // Also save flag locally (for reconnection check)
    localStorage.setItem('has_siwx_session', 'true')
  },
  
  // ✅ Retrieve session from backend (recommended)
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

### Option Descriptions

#### Frequently Customized Options

- **`statement`**: Text displayed in SIWE message
- **`getNonce`**: Function to fetch nonce from backend (required!)
- **`addSession`**: Function to save session
- **`getSessions`**: Function to retrieve session

#### Optional Options

- **`domain`**: Domain in SIWE message (default: `window.location.host`)
- **`uri`**: URI in SIWE message (default: `window.location.origin`)
- **`expirationTime`**: Session expiration time (string or function)

#### Advanced Options (rarely modified)

- **`revokeSession`**: Function to revoke session
- **`setSessions`**: Function to save multiple sessions at once
- **`getRequired`**: Function returning whether SIWE is required

---

## Platform-Specific Implementation Examples

### React SDK

```typescript
import { initCrossSdk, createDefaultSIWXConfig } from '@to-nexus/sdk/react'

// SIWX configuration
const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in to My App',
  getNonce: async () => {
    const response = await fetch('/api/nonce')
    return response.text()
  },
  addSession: async (session) => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (session.data.chainId === chainId && 
          session.data.accountAddress.toLowerCase() === address.toLowerCase()) {
        return [session]
      }
    }
    return []
  }
})

// SDK initialization
initCrossSdk(
  projectId,
  redirectUrl,
  metadata,
  'dark',
  defaultNetwork,
  adapters,
  mobileLink,
  siwxConfig // Add SIWX configuration
)
```

### Vanilla JS SDK

```javascript
import { 
  initCrossSdkWithParams, 
  createDefaultSIWXConfig 
} from '@to-nexus/sdk'

// SIWX configuration
const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in to My App',
  getNonce: async () => {
    console.warn('⚠️ Using client-side nonce. Use backend nonce for production!')
    return Math.random().toString(36).substring(2, 15)
  },
  addSession: async (session) => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (session.data.chainId === chainId && 
          session.data.accountAddress.toLowerCase() === address.toLowerCase()) {
        return [session]
      }
    }
    return []
  }
})

// SDK initialization
const crossSdk = initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'dark',
  defaultNetwork,
  adapters,
  mobileLink,
  siwx: siwxConfig // Add SIWX configuration
})
```

### CDN

```javascript
// SIWX configuration
const siwxConfig = window.CrossSdk.createDefaultSIWXConfig({
  statement: 'Sign in to My App',
  getNonce: async () => {
    console.warn('⚠️ Using client-side nonce. Use backend nonce for production!')
    return Math.random().toString(36).substring(2, 15)
  },
  addSession: async (session) => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (session.data.chainId === chainId && 
          session.data.accountAddress.toLowerCase() === address.toLowerCase()) {
        return [session]
      }
    }
    return []
  }
})

// SDK initialization
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
  siwx: siwxConfig // Add SIWX configuration
})
```

### Wagmi

```typescript
import { createDefaultSIWXConfig } from '@to-nexus/appkit/react'
import { ToNexusWagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'

// SIWX configuration
export const siwxConfig = createDefaultSIWXConfig({
  statement: 'Sign in to My Wagmi App',
  getNonce: async () => {
    const response = await fetch('/api/nonce')
    return response.text()
  },
  addSession: async (session) => {
    localStorage.setItem('siwx_session', JSON.stringify(session))
  },
  getSessions: async (chainId, address) => {
    const sessionStr = localStorage.getItem('siwx_session')
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      if (session.data.chainId === chainId && 
          session.data.accountAddress.toLowerCase() === address.toLowerCase()) {
        return [session]
      }
    }
    return []
  },
  getRequired: () => false // Disable auto SIWE modal (when using Connect + Auth buttons)
})

// Create Wagmi Adapter
export const sdkWagmiAdapter = new ToNexusWagmiAdapter({
  projectId,
  networks,
  siwx: siwxConfig // Add SIWX configuration
})

// Initialize Cross SDK (for Cross Wallet)
initCrossSdk(
  projectId,
  redirectUrl,
  metadata,
  'dark',
  defaultNetwork,
  [sdkWagmiAdapter],
  mobileLink,
  siwxConfig // Add SIWX configuration
)
```

---

## Security Recommendations

### 1. Nonce Generation

**❌ What NOT to do:**

```typescript
// Generating nonce on client (vulnerable to replay attacks!)
getNonce: async () => {
  return Math.random().toString(36).substring(2, 15)
}
```

**✅ What you MUST do:**

```typescript
// Generate and verify nonce on backend
getNonce: async () => {
  const response = await fetch('https://your-api.com/api/siwe/nonce', {
    credentials: 'include' // Include session cookies
  })
  return response.text()
}
```

**Backend Implementation Example (Node.js + Express):**

```javascript
const express = require('express')
const session = require('express-session')
const { generateNonce } = require('siwe')

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, sameSite: 'strict' }
}))

// Nonce generation endpoint
app.get('/api/siwe/nonce', (req, res) => {
  req.session.nonce = generateNonce()
  res.send(req.session.nonce)
})

// Signature verification endpoint
app.post('/api/siwe/verify', async (req, res) => {
  const { message, signature } = req.body
  const siweMessage = new SiweMessage(message)
  
  try {
    await siweMessage.verify({ signature, nonce: req.session.nonce })
    req.session.siwe = { address: siweMessage.address, chainId: siweMessage.chainId }
    req.session.nonce = null // Invalidate nonce
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})
```

### 2. Session Storage

**For local development (localStorage):**

```typescript
addSession: async (session) => {
  localStorage.setItem('siwx_session', JSON.stringify(session))
}
```

**For production (backend storage):**

```typescript
addSession: async (session) => {
  await fetch('https://your-api.com/api/siwe/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(session)
  })
  localStorage.setItem('has_siwx_session', 'true') // Only save flag
}
```

### 3. Use HTTPS

In production environments, you must use HTTPS to prevent man-in-the-middle attacks.

### 4. Domain Verification

The backend should verify that the SIWE message's `domain` field matches the current request's domain.

---

## Button State Management

Pattern for managing individual loading states when you have multiple buttons.

### React Example

```typescript
import { useState } from 'react'

function WalletButtons() {
  // ✅ Manage loading state for each button individually
  const [loadingStates, setLoadingStates] = useState({
    connectQR: false,
    connectExtension: false,
    authenticateQR: false,
    authenticateExtension: false
  })

  // Calculate if any button is loading
  const isAnyLoading = Object.values(loadingStates).some(state => state)

  const handleAuthenticateQR = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, authenticateQR: true }))
      const result = await authenticateWalletConnect()
      // Handle result
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
      // Handle result
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

### Restore State on Modal Cancel (React)

Pattern to restore loading state when AppKit modal is canceled:

```typescript
import { useAppKitState } from '@to-nexus/sdk/react'
import { useEffect } from 'react'

function WalletButtons() {
  const appKitState = useAppKitState() // Subscribe to modal state
  const [loadingStates, setLoadingStates] = useState({
    authenticateQR: false
  })

  // ✅ Reset authenticateQR loading state when modal closes
  useEffect(() => {
    if (!appKitState.open && loadingStates.authenticateQR) {
      setLoadingStates(prev => ({ ...prev, authenticateQR: false }))
    }
  }, [appKitState.open, loadingStates.authenticateQR])

  // ... button handlers
}
```

### Vanilla JS / CDN Example

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
    // Handle result
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
    // Handle result
  } catch (error) {
    console.error(error)
  } finally {
    setButtonLoading('authenticateExtension', false)
    buttons.authenticateExtension.textContent = 'Connect + Auth (Extension)'
  }
})
```

---

## Auto-Reconnection

Logic to restore previous connection on page refresh.

### localStorage Flag Management

```typescript
// On successful connection
localStorage.setItem('wallet_connected', 'true')
localStorage.setItem('wallet_type', 'cross') // or 'metamask'
localStorage.setItem('has_siwx_session', 'true') // When SIWE authentication is complete

// On disconnection
localStorage.removeItem('wallet_connected')
localStorage.removeItem('wallet_type')
localStorage.removeItem('has_siwx_session')
localStorage.removeItem('siwx_session')
```

### Auto-Reconnection Conditions

```typescript
// For Cross Wallet, the SDK handles auto-reconnection automatically.
// Auto-reconnect when ALL conditions are met:
// 1. wallet_connected === 'true'
// 2. WalletConnect session is valid
// 3. If SIWX session exists, it's retrievable via getSessions()
```

### MetaMask Extension Auto-Reconnect (Example)

```typescript
async function autoReconnectMetaMask() {
  try {
    const wasConnected = localStorage.getItem('wallet_connected') === 'true'
    const walletType = localStorage.getItem('wallet_type')
    
    if (!wasConnected || walletType !== 'metamask') {
      return // Not previously connected
    }
    
    const provider = findMetaMaskProvider()
    if (!provider) {
      localStorage.removeItem('wallet_connected')
      return
    }
    
    // eth_accounts only returns already connected accounts (no user approval needed)
    const accounts = await provider.request({ method: 'eth_accounts' })
    
    if (accounts && accounts.length > 0) {
      // Restore connection
      metamaskProvider = provider
      metamaskAccount = accounts[0]
      
      // Get network info
      const chainIdHex = await provider.request({ method: 'eth_chainId' })
      metamaskChainId = parseInt(chainIdHex, 16)
      
      // Re-setup event listeners
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

// Execute on page load
autoReconnectMetaMask()
```

---

## Comparison with Regular Connect

### Traditional Approach (2 steps)

```typescript
const { connect } = useAppKit()

// Step 1: Connect
await connect() // Switch to wallet → approve → return to dApp

// Step 2: SIWE Sign (modal appears automatically)
// Switch to wallet → sign → return to dApp
```

### New Approach (1 step)

#### QR Code

```typescript
const { authenticateWalletConnect } = useAppKit()

// Single step
await authenticateWalletConnect() // Switch to wallet → approve → return to dApp (done!)
```

#### Extension

```typescript
const { authenticateCrossExtensionWallet } = useAppKitWallet()

// Single step
await authenticateCrossExtensionWallet() // Connect + sign in extension at once!
```

---

## Mobile UX Improvement

### Before (Traditional Approach)

```
1. Click "Connect" button on dApp
2. Switch to wallet app
3. Approve connection
4. Return to dApp
5. SIWE sign modal appears
6. Click "Sign" button
7. Switch to wallet app
8. Approve signature
9. Return to dApp
```

### After (Integrated Authentication)

```
1. Click "Connect + Auth" button on dApp
2. Switch to wallet app
3. Approve connection + signature at once
4. Return to dApp
```

**Approximately 50% reduction in steps! 🚀**

---

## API Reference

### `authenticateWalletConnect()`

Performs connection and SIWE authentication simultaneously via WalletConnect.

**Returns**: `Promise<{ authenticated: boolean; sessions: SIWXSession[] }>`

- `authenticated`: Whether authentication was successful
- `sessions`: Array of SIWX sessions

**Throws**:

- Connection failure
- Authentication failure
- SIWX not configured

**Usage**:

```typescript
// React Hook
const { authenticateWalletConnect } = useAppKit()
const result = await authenticateWalletConnect()

// AppKit Instance
await modal.authenticateWalletConnect()

// ConnectionController (advanced usage)
await ConnectionController.authenticateWalletConnect()
```

### `authenticateCrossExtensionWallet()`

Performs connection and SIWE authentication simultaneously via browser extension wallet.

**Returns**: `Promise<{ authenticated: boolean; sessions: SIWXSession[] }>`

- `authenticated`: Whether authentication was successful
- `sessions`: Array of SIWX sessions

**Throws**:

- Extension not installed
- Connection failure
- Authentication failure
- SIWX not configured

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

Creates a standard SIWX configuration.

**Parameters**:

```typescript
interface CreateSIWXConfigOptions {
  // === Frequently customized options ===
  statement?: string
  getNonce?: () => Promise<string>
  addSession?: (session: SIWXSession) => Promise<void>
  getSessions?: (chainId: string, address: string) => Promise<SIWXSession[]>
  
  // === Optional options ===
  domain?: string
  uri?: string
  expirationTime?: string | ((issuedAt: Date) => string)
  
  // === Advanced options ===
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

## Limitations

1. **EIP-155 chains only**: Does not work on other chains like Solana
2. **SIWX required**: Error will occur if SIWX is not configured
3. **`authenticateWalletConnect` is WalletConnect-only**: For browser extensions, use `authenticateCrossExtensionWallet`

---

## Troubleshooting

### Duplicate SIWE modal appears

The SDK tries to automatically show SIWE modal after connection. When using `authenticateWalletConnect()` or `authenticateCrossExtensionWallet()`, authentication is already complete, so an internal flag (`_isAuthenticating`) prevents duplicate modals.

**Solution**: Use the integrated authentication methods provided by the SDK, and it will be handled automatically.

### SIWE modal appears again after refresh

Your `getSessions()` function may not be implemented correctly.

**Solution**:

```typescript
getSessions: async (chainId, address) => {
  // Check localStorage.getItem('siwx_session')
  const sessionStr = localStorage.getItem('siwx_session')
  if (sessionStr) {
    const session = JSON.parse(sessionStr)
    if (session.data.chainId === chainId && 
        session.data.accountAddress.toLowerCase() === address.toLowerCase()) {
      return [session]
    }
  }
  
  // Check localStorage.getItem('siwx_sessions') (for QR Code authentication)
  const sessionsStr = localStorage.getItem('siwx_sessions')
  if (sessionsStr) {
    const sessions = JSON.parse(sessionsStr)
    return sessions.filter(
      (s: any) => s.data.chainId === chainId && 
                  s.data.accountAddress.toLowerCase() === address.toLowerCase()
    )
  }
  
  return []
}
```

### Button stuck in loading state

Loading state may not have been restored when modal was canceled.

**Solution**: Refer to the "Restore State on Modal Cancel" pattern in the [Button State Management](#button-state-management) section.

---

## Related Documentation

- [Cross SDK Documentation](https://cross.readme.io/update/docs/js/)
- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [WalletConnect Documentation](https://docs.walletconnect.com/)

---

## Example Code

Full examples are available in the following directories:

- [React Example](../examples/sdk-react/)
- [Vanilla JS Example](../examples/sdk-vanilla/)
- [CDN Example](../examples/sdk-cdn/)
- [Wagmi Example](../examples/sdk-wagmi/)

