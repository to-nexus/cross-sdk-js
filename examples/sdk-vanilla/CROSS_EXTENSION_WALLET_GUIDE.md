# Cross Extension Wallet Usage Guide (Vanilla JavaScript)

This guide explains how to detect and connect to Cross Extension Wallet in vanilla JavaScript projects.

## Required Import

```javascript
import { ConnectorUtil } from '@to-nexus/sdk'
```

## 1. SDK Initialization

```javascript
import {
  ConnectorUtil,
  crossMainnet,
  crossTestnet,
  initCrossSdkWithParams,
  useAppKitWallet
} from '@to-nexus/sdk'

const metadata = {
  name: 'Your App Name',
  description: 'Your App Description',
  url: 'https://your-app.com',
  icons: ['https://your-app.com/icon.png']
}

const projectId = 'your-project-id'
const redirectUrl = window.location.href

const crossSdk = initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'light'
})

const appkitWallet = useAppKitWallet()
```

## 2. Check Extension Installation Status

### 2.1 Check Function

```javascript
// Cross Extension Wallet installation check button
const checkCrossExtension = document.getElementById('check-cross-extension')
checkCrossExtension.addEventListener('click', () => {
  const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
  console.log('Cross Extension Wallet installation status:', isInstalled)
  alert(`Cross Extension Wallet ${isInstalled ? 'Installed ✅' : 'Not Installed ❌'}`)
})
```

### 2.2 Periodic Check (Optional)

Check periodically as extension can be installed/removed at runtime:

```javascript
// Extension status check function
function checkExtensionStatus() {
  try {
    const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
    const btn = document.getElementById('connect-cross-extension')

    if (btn) {
      btn.disabled = !isInstalled
      btn.style.opacity = isInstalled ? '1' : '0.6'
      btn.style.cursor = isInstalled ? 'pointer' : 'not-allowed'
      btn.title = isInstalled
        ? 'Connect to Cross Extension Wallet'
        : 'Cross Extension Wallet is not installed'
    }
  } catch (error) {
    console.error('Error checking Extension status:', error)
  }
}

// Initial check
checkExtensionStatus()

// Check every 3 seconds
setInterval(checkExtensionStatus, 3000)
```

## 3. Extension Connection Function

```javascript
// Cross Extension Wallet direct connection button
const connectCrossExtension = document.getElementById('connect-cross-extension')
connectCrossExtension.addEventListener('click', async () => {
  try {
    console.log('🚀 Starting Cross Extension Wallet connection attempt')

    // Execute Extension connection
    const result = await ConnectorUtil.connectCrossExtensionWallet()

    console.log('✅ Cross Extension Wallet connection successful:', result)
    alert('Cross Extension Wallet connection successful!')
  } catch (error) {
    console.error('Cross Extension Wallet connection failed:', error)

    // Analyze error message
    const errorMessage = error?.message || String(error)
    const isUserRejection =
      errorMessage.includes('User rejected') ||
      errorMessage.includes('User denied') ||
      errorMessage.includes('User cancelled') ||
      errorMessage.includes('Connection rejected') ||
      errorMessage.includes('Modal closed') ||
      errorMessage.includes('rejected') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('denied')

    const isTimeout = errorMessage.includes('Connection timeout')

    // Display user-friendly error messages
    if (isUserRejection) {
      alert('❌ Connection Cancelled\n\nUser cancelled wallet connection.')
    } else if (isTimeout) {
      alert('⏰ Connection Timeout\n\nWallet connection request timed out. Please try again.')
    } else if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
      alert('📦 Extension Not Installed\n\nCross Extension Wallet is not installed.')
    } else if (errorMessage.includes('customWallets에 설정되지 않았습니다')) {
      alert('⚙️ Configuration Error\n\nCross Wallet is not properly configured.')
    } else {
      alert(`❌ Connection Failed\n\n${errorMessage}`)
    }
  }
})
```

## 4. HTML Button Configuration

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cross SDK Example</title>
    <link rel="stylesheet" href="./main.css" />
  </head>
  <body>
    <div class="container">
      <h1>Cross Extension Wallet Example</h1>

      <!-- Buttons displayed when not connected -->
      <div id="connection-buttons">
        <button id="connect-wallet">Connect Wallet</button>
        <button id="connect-cross-extension">Connect Cross Extension</button>
        <button id="check-cross-extension">Check Extension Status</button>
      </div>

      <!-- Buttons displayed when connected -->
      <div id="connected-buttons" style="display: none;">
        <button id="disconnect-wallet">Disconnect</button>
      </div>
    </div>

    <!-- Load script with module type -->
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

## 5. CSS Styling

```css
/* main.css */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

button {
  padding: 12px 24px;
  margin: 5px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

#connect-cross-extension {
  background-color: #007bff;
  color: white;
}

#connect-cross-extension:not(:disabled):hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

#connect-cross-extension:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

#check-cross-extension {
  background-color: #28a745;
  color: white;
}

#check-cross-extension:hover {
  background-color: #218838;
}

#disconnect-wallet {
  background-color: #dc3545;
  color: white;
}

#disconnect-wallet:hover {
  background-color: #c82333;
}
```

## 6. Button Visibility Management

```javascript
let accountState = {}

// Button visibility update function
function updateButtonVisibility(isConnected) {
  const connectionButtons = document.getElementById('connection-buttons')
  const connectedButtons = document.getElementById('connected-buttons')
  const connectCrossExtension = document.getElementById('connect-cross-extension')

  if (isConnected) {
    // Connected: hide connection buttons and show disconnect button
    connectionButtons.style.display = 'none'
    connectedButtons.style.display = 'block'
  } else {
    // Not connected: show connection buttons and hide disconnect button
    connectionButtons.style.display = 'block'
    connectedButtons.style.display = 'none'

    // Check Extension status to enable/disable button
    checkExtensionStatus()
  }
}

// Subscribe to account state
crossSdk.subscribeAccount(state => {
  accountState = state
  updateButtonVisibility(state.isConnected)
  console.log('Account state updated:', state)
})
```

## Main APIs

### `ConnectorUtil.isInstalledCrossExtensionWallet()`

- **Purpose**: Check if Cross Extension Wallet is installed in the browser
- **Return Value**: `boolean` - `true` if installed, `false` otherwise
- **When to Use**:
  - During app initialization
  - Periodic checks (Extension can be installed/removed at runtime)
  - Determining button enable/disable state

### `ConnectorUtil.connectCrossExtensionWallet()`

- **Purpose**: Request connection to Cross Extension Wallet
- **Return Value**: `Promise<{ address: string }>` - Returns address and other information on successful connection
- **Precautions**:
  - Throws error if Extension is not installed
  - Throws error if user rejects connection
  - Connection timeout possible
  - Proper error handling essential

## Error Handling

### Common Error Cases

1. **Extension Not Installed**: "익스텐션이 설치되지 않았습니다"
2. **User Rejection**: "User rejected", "User cancelled", "Modal closed"
3. **Timeout**: "Connection timeout"
4. **Configuration Error**: "customWallets에 설정되지 않았습니다"

### Recommended Error Handling Pattern

```javascript
try {
  const result = await ConnectorUtil.connectCrossExtensionWallet()
  console.log('Connection successful:', result)
  alert('✅ Connection successful!')
} catch (error) {
  const errorMessage = error?.message || String(error)

  if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
    console.error('Extension not installed')
    alert('❌ Please install Extension first.')
  } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
    console.log('User cancelled connection')
    alert('❌ Connection was cancelled.')
  } else if (errorMessage.includes('timeout')) {
    console.error('Connection timeout')
    alert('⏰ Connection timed out.')
  } else {
    console.error('Connection failed:', error)
    alert(`❌ Connection failed: ${errorMessage}`)
  }
}
```

## Real Usage Example

You can find the complete code example at:

```
examples/sdk-vanilla/src/main.js
```

Refer to lines 964-1011.

## Complete Example Code

```javascript
// main.js
import {
  ConnectorUtil,
  crossMainnet,
  crossTestnet,
  initCrossSdkWithParams,
  useAppKitWallet
} from '@to-nexus/sdk'

// Initialize SDK
const crossSdk = initCrossSdkWithParams({
  projectId: 'your-project-id',
  redirectUrl: window.location.href,
  metadata: {
    name: 'Your App',
    description: 'Description',
    url: 'https://your-app.com',
    icons: ['https://your-app.com/icon.png']
  },
  themeMode: 'light'
})

const appkitWallet = useAppKitWallet()
let accountState = {}

// Check Extension status
function checkExtensionStatus() {
  try {
    const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
    const btn = document.getElementById('connect-cross-extension')

    if (btn) {
      btn.disabled = !isInstalled
      btn.style.opacity = isInstalled ? '1' : '0.6'
      btn.title = isInstalled ? 'Connect' : 'Extension not installed'
    }
  } catch (error) {
    console.error('Error checking extension:', error)
  }
}

// Update button visibility
function updateButtonVisibility(isConnected) {
  const connectionButtons = document.getElementById('connection-buttons')
  const connectedButtons = document.getElementById('connected-buttons')

  if (isConnected) {
    connectionButtons.style.display = 'none'
    connectedButtons.style.display = 'block'
  } else {
    connectionButtons.style.display = 'block'
    connectedButtons.style.display = 'none'
    checkExtensionStatus()
  }
}

// Connect Extension
const connectBtn = document.getElementById('connect-cross-extension')
connectBtn.addEventListener('click', async () => {
  try {
    const result = await ConnectorUtil.connectCrossExtensionWallet()
    console.log('✅ Connection successful:', result)
    alert('✅ Connected!')
  } catch (error) {
    const msg = error?.message || String(error)
    if (msg.includes('익스텐션이 설치되지 않았습니다')) {
      alert('❌ Extension not installed')
    } else if (msg.includes('rejected') || msg.includes('cancelled')) {
      alert('❌ Connection cancelled')
    } else {
      alert(`❌ Error: ${msg}`)
    }
  }
})

// Check Extension installation
const checkBtn = document.getElementById('check-cross-extension')
checkBtn.addEventListener('click', () => {
  const isInstalled = ConnectorUtil.isInstalledCrossExtensionWallet()
  alert(isInstalled ? '✅ Installed' : '❌ Not installed')
})

// Disconnect
const disconnectBtn = document.getElementById('disconnect-wallet')
disconnectBtn.addEventListener('click', async () => {
  try {
    await appkitWallet.disconnect()
    console.log('✅ Disconnected')
  } catch (error) {
    console.error('❌ Disconnect failed:', error)
  }
})

// Subscribe to account state
crossSdk.subscribeAccount(state => {
  accountState = state
  updateButtonVisibility(state.isConnected)
})

// Periodically check Extension status
checkExtensionStatus()
setInterval(checkExtensionStatus, 3000)

// Set initial button state
window.addEventListener('DOMContentLoaded', () => {
  updateButtonVisibility(false)
})
```

## Build Configuration (Vite)

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
```

## Package Configuration

```json
{
  "name": "cross-sdk-vanilla-example",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@to-nexus/sdk": "^1.17.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

## Tips

1. **Import Method**: Import in ES module format (`type="module"`).

2. **Periodic Checks**: Check status periodically as users can install/remove Extensions at runtime.

3. **Button State Management**: Disable button when Extension is not installed to improve UX.

4. **Visual Feedback**: Adjust opacity and cursor styles to clearly indicate active/inactive states.

5. **Error Messages**: Provide user-friendly error messages.

6. **State Subscription**: Use `crossSdk.subscribeAccount()` to detect connection state changes and update UI.

7. **Logging**: Use console.log during development to track the connection process.
