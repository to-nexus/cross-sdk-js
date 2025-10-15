# 🎮 Cocos Creator Cross SDK Integration Guide

A comprehensive guide for integrating Cross SDK into Cocos Creator 3.8.7 game projects to implement blockchain functionality.
This detailed documentation is designed for developers who want to integrate Cross SDK into their web games.

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🛠 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🔧 SDK Integration](#-sdk-integration)
- [📝 Core Code Analysis](#-core-code-analysis)
- [🚀 Build & Deployment](#-build--deployment)
- [📱 Mobile Optimization](#-mobile-optimization)
- [🐛 Troubleshooting](#-troubleshooting)

## 🎯 Overview

This project demonstrates how to integrate Cross SDK into Cocos Creator web games:

- **Wallet Connection**: Cross Wallet connection support
- **Network Switching**: Multi-chain support for Cross, Ethereum, BSC, Kaia, etc.
- **Token Transfer**: Native token and ERC-20 token transfers
- **Smart Contracts**: Contract read/write functionality
- **Signing**: Message signing and EIP-712 typed data signing
- **Session Management**: Wallet connection state management and auto-reconnection

### Supported Features

✅ **Wallet Connect/Disconnect**  
✅ **Multi-chain Network Switching**  
✅ **Token Transfer (Native, ERC-20)**  
✅ **Smart Contract Interaction**  
✅ **Message Signing (EIP-191, EIP-712)**  
✅ **ENS Domain Lookup**  
✅ **Gas Estimation**  
✅ **Session State Management**  
✅ **Mobile Responsive UI**

## 🛠 Project Structure

```
cocos-creator/
├── assets/                          # Game assets
│   ├── scripts/
│   │   └── CrossInit.ts             # SDK initialization script
│   ├── SdkActions.ts                # SDK functionality implementation
│   └── scene/                       # Game scene files
├── build-templates/                 # Build templates
│   ├── web-desktop/                 # Desktop web build template
│   │   ├── index.html              # HTML template
│   │   ├── style.css               # CSS styles
│   │   └── external/               # SDK files
│   │       ├── cross-sdk.js        # Main SDK file
│   │       ├── index.es-*.js       # SDK core modules
│   │       └── w3m-modal-*.js      # WalletConnect modal
│   └── web-mobile/                 # Mobile web build template
│       ├── index.html              # Mobile optimized HTML
│       ├── style.css               # Responsive CSS
│       └── external/               # SDK files
│           ├── cross-sdk.js        # Main SDK file
│           ├── index.es-*.js       # SDK core modules
│           └── w3m-modal-*.js      # WalletConnect modal
├── settings/                       # Cocos Creator project settings
│   ├── packages/
│   │   └── project-setting.json    # Project settings
│   └── v2/packages/
│       └── project.json            # Project metadata
└── package.json                    # Build scripts
```

### Core Files Description

| File             | Role                                 | Priority |
| ---------------- | ------------------------------------ | -------- |
| `CrossInit.ts`   | SDK loading and initialization       | ⭐⭐⭐   |
| `SdkActions.ts`  | SDK functionality and UI integration | ⭐⭐⭐   |
| `index.html`     | SDK loading and HTML setup           | ⭐⭐⭐   |
| `cross-sdk.js`   | Cross SDK main file                  | ⭐⭐⭐   |
| `index.es-*.js`  | SDK core modules (dependencies)      | ⭐⭐⭐   |
| `w3m-modal-*.js` | WalletConnect modal UI               | ⭐⭐⭐   |
| `style.css`      | Responsive UI styles                 | ⭐⭐     |

## ⚡ Quick Start

### 1. Project Setup

```bash
# 1. Install Cocos Creator 3.8.7
# https://www.cocos.com/en/creator/download

# 2. Open project
# Open this folder as a project in Cocos Creator

# 3. Build (optional)
npm run build
```

### 2. Development Environment

1. **Open project in Cocos Creator**
2. **Select Scene**: `assets/scene/home.scene`
3. **Run Preview**: Top menu → Preview → Browser
4. **Test Wallet Connection**: Click "Cross Connect" button

### 3. Production Build

```bash
# Full build (desktop + mobile)
npm run build

# Individual platform builds
npm run build:web-desktop   # For desktop
npm run build:web-mobile    # For mobile

# Check build results
ls dist/
```

## 🔧 SDK Integration

### Step 1: Prepare Cross SDK Files

The first step to integrate Cross SDK into your project.

```bash
# 1. Download Cross SDK build files
# https://github.com/your-org/cross-sdk-js/releases

# 2. Place required SDK files in build templates
# Main SDK file
cp cross-sdk.js build-templates/web-desktop/external/
cp cross-sdk.js build-templates/web-mobile/external/

# Dependency files (provided with SDK)
cp index.es-*.js build-templates/web-desktop/external/
cp index.es-*.js build-templates/web-mobile/external/

# WalletConnect modal files (provided with SDK)
cp w3m-modal-*.js build-templates/web-desktop/external/
cp w3m-modal-*.js build-templates/web-mobile/external/
```

#### Required Files List

Cross SDK requires all of the following files to work properly:

| File             | Description                             | Required |
| ---------------- | --------------------------------------- | -------- |
| `cross-sdk.js`   | Main SDK file                           | ⭐⭐⭐   |
| `index.es-*.js`  | SDK core modules (bundled dependencies) | ⭐⭐⭐   |
| `w3m-modal-*.js` | WalletConnect modal UI                  | ⭐⭐⭐   |

> **⚠️ Important**: The `*` part in filenames may vary depending on build version (e.g., `index.es-CDAPa9-C.js`, `w3m-modal-nO5exNeY.js`)

### Step 2: HTML Template Setup

Configure `build-templates/web-mobile/index.html` and `web-desktop/index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Your Game Title</title>

    <!-- Mobile optimization meta tags -->
    <meta
      name="viewport"
      content="width=device-width,user-scalable=no,initial-scale=1,minimum-scale=1,maximum-scale=1,minimal-ui=true,viewport-fit=cover"
    />
    <meta name="screen-orientation" content="landscape" />
    <meta name="apple-mobile-web-app-capable" content="yes" />

    <!-- CSS styles -->
    <link rel="stylesheet" type="text/css" href="./style.css" />
  </head>
  <body>
    <!-- Game container -->
    <div id="GameDiv" cc_exact_fit_screen="true" style="width: 100vw; height: 100vh">
      <div id="Cocos3dGameContainer">
        <canvas id="GameCanvas" width="1280" height="720" tabindex="99"></canvas>
      </div>
    </div>

    <!-- Cocos Creator system files -->
    <script src="src/polyfills.bundle.js"></script>
    <script src="src/system.bundle.js"></script>
    <script src="src/import-map.json" type="systemjs-importmap"></script>

    <!-- Cross SDK loading -->
    <script type="module">
      import * as CrossSdk from './external/cross-sdk.js'

      // Register SDK to global object
      window.CrossSdk = CrossSdk
      console.log('[SDK] Cross SDK loaded:', !!window.CrossSdk)
    </script>

    <!-- Start game -->
    <script>
      System.import('./index.js').catch(function (err) {
        console.error('Game load error:', err)
      })
    </script>
  </body>
</html>
```

### Step 3: Implement CrossInit.ts

Component responsible for SDK initialization.

```typescript
// assets/scripts/CrossInit.ts
import { Component, _decorator } from 'cc'

const { ccclass } = _decorator

declare global {
  interface Window {
    CrossSdk: any
    CrossSdkInstance?: any
    System?: any
  }
}

@ccclass('CrossInit')
export class CrossInit extends Component {
  async start() {
    // 1) Wait for SDK loading (max 8 seconds)
    await this.waitForSdkLoad()

    // 2) Initialize SDK
    await this.initializeSdk()
  }

  private async waitForSdkLoad(): Promise<void> {
    return new Promise<void>(resolve => {
      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        if (window.CrossSdk || Date.now() - startTime > 8000) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }

  private async initializeSdk(): Promise<void> {
    // Fallback: Try direct loading via SystemJS
    if (!window.CrossSdk && window.System?.import) {
      try {
        const basePath = location.pathname.replace(/index\.html?$/, '')
        const sdkPath = `${basePath}external/cross-sdk.js`
        const sdkModule = await window.System.import(sdkPath)
        window.CrossSdk = sdkModule
      } catch (error) {
        console.error('Failed to load SDK via SystemJS:', error)
      }
    }

    if (!window.CrossSdk) {
      throw new Error('Cross SDK not found. Check external/cross-sdk.js')
    }

    // SDK initialization
    const config = {
      projectId: 'YOUR_PROJECT_ID', // Project ID issued by Cross team
      redirectUrl: window.location.href,
      metadata: {
        name: 'Your Game Name',
        description: 'Your Game Description',
        url: 'https://yourgame.com',
        icons: ['https://yourgame.com/icon.png']
      },
      themeMode: 'dark' // 'light' | 'dark'
    }

    const instance = window.CrossSdk.initCrossSdk(
      config.projectId,
      config.redirectUrl,
      config.metadata,
      config.themeMode
    )

    window.CrossSdkInstance = instance
    console.log('✅ Cross SDK initialized successfully')
  }
}
```

### Step 4: Implement SdkActions.ts

Component that actually uses SDK functionality.

```typescript
// assets/SdkActions.ts
import { Component, Label, _decorator } from 'cc'

const { ccclass, property } = _decorator

@ccclass('SdkActions')
export class SdkActions extends Component {
  @property(Label) connectButtonLabel: Label = null!
  @property(Label) addressLabel: Label = null!
  @property(Label) chainIdLabel: Label = null!
  @property(Label) balanceLabel: Label = null!

  // Wallet connection
  async onClickConnect() {
    if (!window.CrossSdk) {
      console.error('SDK not loaded')
      return
    }

    try {
      // Connect Cross Wallet
      await window.CrossSdk.useAppKitWallet().connect('cross_wallet')

      // Update UI
      this.updateUI()
      console.log('✅ Wallet connected')
    } catch (error) {
      console.error('❌ Connection failed:', error)
    }
  }

  // Wallet disconnect
  async onClickDisconnect() {
    if (!window.CrossSdk) return

    try {
      await window.CrossSdk.ConnectionController.disconnect()
      this.updateUI()
      console.log('✅ Wallet disconnected')
    } catch (error) {
      console.error('❌ Disconnect failed:', error)
    }
  }

  // Network switching
  async onClickSwitchNetwork() {
    const instance = window.CrossSdkInstance
    if (!instance) return

    try {
      // Switch to Cross testnet
      await instance.switchNetwork(window.CrossSdk.crossTestnet)
      this.updateUI()
      console.log('✅ Network switched')
    } catch (error) {
      console.error('❌ Network switch failed:', error)
    }
  }

  // Token transfer
  async onClickSendToken() {
    if (!window.CrossSdk) return

    try {
      const result = await window.CrossSdk.SendController.sendNativeToken({
        receiverAddress: '0x742d35Cc6634C0532925a3b8D400e5e5c8c6c5e8',
        sendTokenAmount: 0.01, // 0.01 CROSS
        decimals: '18',
        customData: { metadata: 'Game reward' }
      })

      console.log('✅ Token sent:', result)
    } catch (error) {
      console.error('❌ Send failed:', error)
    }
  }

  // UI update
  private async updateUI() {
    try {
      const account = window.CrossSdk?.AccountController?.state
      const isConnected = account?.status === 'connected' && account?.address

      // Update connection status
      if (this.connectButtonLabel) {
        this.connectButtonLabel.string = isConnected ? 'Connected' : 'Connect'
      }

      // Display address
      if (this.addressLabel) {
        this.addressLabel.string = isConnected
          ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
          : 'Not Connected'
      }

      // Display chain ID
      if (this.chainIdLabel && isConnected) {
        const provider = await window.CrossSdkInstance?.getUniversalProvider()
        const chainId = await provider?.request({ method: 'eth_chainId' })
        this.chainIdLabel.string = chainId ? `Chain: ${parseInt(chainId, 16)}` : 'Unknown'
      }

      // Display balance
      if (this.balanceLabel) {
        this.balanceLabel.string = account?.balance || '0'
      }
    } catch (error) {
      console.error('UI update failed:', error)
    }
  }

  // Update UI when component starts
  start() {
    // Update UI after SDK loading
    setTimeout(() => {
      this.updateUI()

      // Subscribe to state changes
      if (window.CrossSdk?.AccountController?.subscribeKey) {
        window.CrossSdk.AccountController.subscribeKey('status', () => {
          this.updateUI()
        })
        window.CrossSdk.AccountController.subscribeKey('address', () => {
          this.updateUI()
        })
      }
    }, 1000)
  }
}
```

### Step 5: Cocos Creator Editor Setup

1. **Add components to Scene**:

   ```
   Canvas
   ├── CrossInit (Node + CrossInit component)
   └── UI
       └── SdkActions (Node + SdkActions component)
           ├── ConnectButton (Button)
           ├── AddressLabel (Label)
           ├── ChainLabel (Label)
           └── BalanceLabel (Label)
   ```

2. **Connect components**:

   - Connect each Label property in SdkActions to corresponding Label nodes
   - Connect Button Click Events to SdkActions methods

3. **Build settings**:
   - Project → Build Panel
   - Platform: Select Web Mobile/Desktop
   - Template: Select Custom (use build-templates)

## 📝 Core Code Analysis

### CrossInit.ts Detailed Analysis

```typescript
export class CrossInit extends Component {
  async start() {
    // 🔄 Wait for SDK loading
    await this.waitForSdkLoad()

    // ⚙️ Initialize SDK
    await this.initializeSdk()
  }

  private async waitForSdkLoad(): Promise<void> {
    // Wait for SDK loaded from HTML for max 8 seconds
    // Support dynamic loading via SystemJS as fallback
  }

  private async initializeSdk(): Promise<void> {
    // 1. Check SDK existence
    // 2. Configure project settings
    // 3. Create SDK instance and register globally
  }
}
```

**Key Features**:

- ✅ **Stable Loading**: Support multiple loading methods (HTML import, SystemJS)
- ✅ **Error Handling**: Clear error messages on loading failure
- ✅ **Global Access**: Accessible anywhere via `window.CrossSdkInstance`

### SdkActions.ts Detailed Analysis

```typescript
@ccclass('SdkActions')
export class SdkActions extends Component {
  // 🎯 UI binding
  @property(Label) connectButtonLabel: Label = null!
  @property(Label) addressLabel: Label = null!

  // 🔗 Wallet connection
  async onClickConnect() {
    await window.CrossSdk.useAppKitWallet().connect('cross_wallet')
    this.updateUI()
  }

  // 🔄 Network switching
  async onClickSwitchNetwork() {
    await instance.switchNetwork(window.CrossSdk.crossTestnet)
  }

  // 💰 Token transfer
  async onClickSendToken() {
    await window.CrossSdk.SendController.sendNativeToken({...})
  }
}
```

**Key Features**:

- ✅ **UI Integration**: Direct connection with Cocos Creator Labels
- ✅ **State Management**: Auto-detect SDK state changes and update UI
- ✅ **Error Handling**: Independent error handling for each feature

### Supported SDK Features

#### 1. Wallet Management

```typescript
// Wallet connection
await CrossSdk.useAppKitWallet().connect('cross_wallet')
await CrossSdk.useAppKitWallet().connect('metamask')

// Wallet disconnect
await CrossSdk.ConnectionController.disconnect()

// Check connection status
const account = CrossSdk.AccountController.state
const isConnected = account.status === 'connected'
```

#### 2. Network Switching

```typescript
// Supported networks
const networks = {
  crossTestnet: CrossSdk.crossTestnet, // Cross testnet
  crossMainnet: CrossSdk.crossMainnet, // Cross mainnet
  ethereum: CrossSdk.etherMainnet, // Ethereum
  bsc: CrossSdk.bscMainnet, // BSC
  kaia: CrossSdk.kaiaMainnet // Kaia
}

// Switch network
await instance.switchNetwork(networks.crossTestnet)
```

#### 3. Token Transfer

```typescript
// Native token transfer
await CrossSdk.SendController.sendNativeToken({
  receiverAddress: '0x...',
  sendTokenAmount: 1.0,
  decimals: '18',
  customData: { metadata: 'Game reward' }
})

// ERC-20 token transfer
await CrossSdk.SendController.sendERC20Token({
  receiverAddress: '0x...',
  contractAddress: 'eip155:1:0x...',
  sendTokenAmount: 100,
  decimals: '18'
})
```

#### 4. Smart Contracts

```typescript
// Contract reading
const result = await CrossSdk.ConnectionController.readContract({
  contractAddress: '0x...',
  method: 'balanceOf',
  abi: contractABI,
  args: ['0x...']
})

// Contract writing
const tx = await CrossSdk.ConnectionController.writeContract({
  fromAddress: '0x...',
  contractAddress: '0x...',
  method: 'transfer',
  abi: contractABI,
  args: ['0x...', '1000000000000000000']
})
```

#### 5. Message Signing

```typescript
// Simple message signing
const signature = await CrossSdk.ConnectionController.signMessage({
  message: 'Hello World',
  customData: { metadata: 'Game login' }
})

// EIP-712 typed data signing
const typedSignature = await CrossSdk.ConnectionController.signTypedDataV4({
  types: { ... },
  primaryType: 'Mail',
  domain: { ... },
  message: { ... }
})
```

## 🚀 Build & Deployment

### Local Build Process

```bash
# 1. Build project
npm run build

# 2. Check build results
ls dist/
# dist/
# ├── web-desktop/    # Desktop web build
# └── web-mobile/     # Mobile web build

# 3. Run local server (for testing)
cd dist/web-mobile
python -m http.server 8000
# or
npx serve .
```

### Build Template System

Cocos Creator uses the contents of the `build-templates/` folder during build:

```
build-templates/
├── web-desktop/
│   ├── index.html          # 🔧 HTML template
│   ├── style.css           # 🎨 CSS styles
│   └── external/           # 📦 SDK files
│       ├── cross-sdk.js    # Main SDK file
│       ├── index.es-*.js   # SDK core modules
│       └── w3m-modal-*.js  # WalletConnect modal
└── web-mobile/
    ├── index.html          # 📱 Mobile optimized HTML
    ├── style.css           # 📱 Responsive CSS
    └── external/           # 📦 SDK files
        ├── cross-sdk.js    # Main SDK file
        ├── index.es-*.js   # SDK core modules
        └── w3m-modal-*.js  # WalletConnect modal
```

**Build Process**:

1. Cocos Creator compiles game logic
2. Copy `build-templates/` contents to build results
3. SDK files are automatically included from `external/` folder
4. HTML template connects game and SDK

## 📱 Mobile Optimization

### Responsive Design Setup

This project is optimized for mobile landscape mode:

#### 1. Screen Settings

```json
// settings/packages/project-setting.json
{
  "general": {
    "designResolution": {
      "width": 1280, // Landscape resolution
      "height": 720,
      "fitWidth": true, // Fit width
      "fitHeight": true // Fit height
    }
  }
}
```

#### 2. HTML Meta Tags

```html
<!-- Mobile optimization -->
<meta
  name="viewport"
  content="width=device-width,user-scalable=no,initial-scale=1,minimum-scale=1,maximum-scale=1,minimal-ui=true,viewport-fit=cover"
/>
<meta name="screen-orientation" content="landscape" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

#### 3. CSS Responsive Styles

```css
/* Full screen usage */
#GameDiv {
  width: 100vw !important;
  height: 100vh !important;
}

/* Support various screen ratios */
@media screen and (orientation: landscape) {
  /* Landscape optimization */
}

@media screen and (orientation: portrait) {
  /* Portrait support */
}

/* Notch support */
@supports (padding: max(0px)) {
  body {
    padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right))
      max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. SDK Loading Failure

```
❌ Error: Cross SDK not found on window
```

**Solution**:

```bash
# 1. Check all required SDK files exist
ls build-templates/web-mobile/external/
# Required files: cross-sdk.js, index.es-*.js, w3m-modal-*.js

# 2. Check HTML template
grep "cross-sdk.js" build-templates/web-mobile/index.html

# 3. Check in browser console
console.log(window.CrossSdk)

# 4. Check file loading in Network tab
# Developer Tools → Network tab to verify all SDK files load with 200 status
```

#### 2. SDK Not Working After Build

**Solution**:

```bash
# 1. Check all files exist in build template
ls build-templates/web-mobile/external/
# Required files: cross-sdk.js, index.es-*.js, w3m-modal-*.js

# 2. Check all files copied to build results
ls dist/web-mobile/external/
# Should have same files as build template

# 3. Check relative paths
# Verify './external/cross-sdk.js' path is correct in HTML

# 4. Check file permissions and MIME types
# Verify web server serves .js files with correct Content-Type
```

### Debugging Tools

#### 1. SDK Status Check

```typescript
// Run in developer console
console.log('SDK Status:', {
  loaded: !!window.CrossSdk,
  initialized: !!window.CrossSdkInstance,
  account: window.CrossSdk?.AccountController?.state,
  network: window.CrossSdk?.NetworkController?.state
})
```

#### 2. Network Request Monitoring

```typescript
// Network request logging
const originalFetch = window.fetch
window.fetch = function (...args) {
  console.log('Fetch request:', args[0])
  return originalFetch.apply(this, args)
}
```

#### 3. Error Tracking

```typescript
// Global error handlers
window.addEventListener('error', event => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
})
```

## 📞 Support & Contact

- **Technical Inquiries**: [Cross Developer Portal](https://developers.cross.io)
- **SDK Documentation**: [Cross SDK Guide](https://docs.cross.io/sdk)
- **Community**: [Discord](https://discord.gg/cross)
- **Issue Reports**: [GitHub Issues](https://github.com/cross-org/cross-sdk-js/issues)

---

We hope this guide helps you successfully integrate Cross SDK into your Cocos Creator web game! 🚀
