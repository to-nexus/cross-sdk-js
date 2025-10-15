# Cross Extension Wallet Usage Guide (Vanilla JavaScript / CDN)

This guide explains how to detect and connect to Cross Extension Wallet in vanilla JavaScript or CDN environments.

## Loading CDN Script

First, load the Cross SDK in your HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Cross SDK Example</title>
  </head>
  <body>
    <!-- Cross SDK CDN -->
    <script type="module" src="./cross-sdk.js"></script>

    <!-- Your app script -->
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

## 1. Wait for SDK to Load

Helper function to wait until SDK is fully loaded:

```javascript
// Function to wait for SDK loading
function waitForSDK() {
  return new Promise(resolve => {
    if (window.CrossSdk) {
      resolve(window.CrossSdk)
    } else {
      const checkSDK = () => {
        if (window.CrossSdk) {
          resolve(window.CrossSdk)
        } else {
          setTimeout(checkSDK, 100)
        }
      }
      checkSDK()
    }
  })
}
```

## 2. Check Extension Installation Status

### 2.1 Implementing Check Function

```javascript
// Function to update Cross Extension Wallet button state
function updateCrossExtensionButtonState() {
  const connectCrossExtension = document.getElementById('connect-cross-extension')

  if (connectCrossExtension && window.CrossSdk?.ConnectorUtil) {
    try {
      // Check if Extension is installed
      const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()

      if (isInstalled) {
        connectCrossExtension.disabled = false
        connectCrossExtension.title = 'Connect to Cross Extension Wallet'
        connectCrossExtension.style.opacity = '1'
        connectCrossExtension.style.cursor = 'pointer'
      } else {
        connectCrossExtension.disabled = true
        connectCrossExtension.title = 'Cross Extension Wallet is not installed'
        connectCrossExtension.style.opacity = '0.6'
        connectCrossExtension.style.cursor = 'not-allowed'
      }
    } catch (error) {
      // Keep default state if SDK is not yet loaded
      console.log('SDK not ready for extension check:', error.message)
    }
  }
}
```

### 2.2 Setting Up Periodic Checks

Check periodically as extension can be installed/removed at runtime:

```javascript
// Periodically check Extension status after SDK loads
setTimeout(() => {
  updateCrossExtensionButtonState()
  // Check every 3 seconds
  setInterval(updateCrossExtensionButtonState, 3000)
}, 1000) // Start after 1 second
```

## 3. Extension Connection Function

```javascript
// Extension connection button event listener
document.getElementById('connect-cross-extension')?.addEventListener('click', async () => {
  try {
    console.log('🚀 Starting Cross Extension Wallet connection attempt')

    // Execute Extension connection
    const result = await window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()

    console.log('✅ Cross Extension Wallet connection successful:', result)
    alert(`✅ Cross Extension Wallet connection successful!\n\nAddress: ${result.address}`)
  } catch (error) {
    console.error('Cross Extension Wallet connection failed:', error)

    // Analyze error message
    const errorMessage = error instanceof Error ? error.message : String(error)
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
      alert(
        '📦 Extension Not Installed\n\nCross Extension Wallet is not installed. Please install the extension first.'
      )
    } else if (errorMessage.includes('customWallets에 설정되지 않았습니다')) {
      alert(
        '⚙️ Configuration Error\n\nCross Wallet is not properly configured. Please contact the developer.'
      )
    } else {
      alert(
        `❌ Connection Failed\n\nAn error occurred while connecting to the wallet: ${errorMessage}`
      )
    }
  }
})
```

## 4. Extension Installation Check Button

```javascript
// Extension installation status check button
document.getElementById('check-cross-extension')?.addEventListener('click', () => {
  const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()
  alert(
    `Cross Extension Wallet Installation Status: ${isInstalled ? '✅ Installed' : '❌ Not Installed'}`
  )
})
```

## 5. HTML Button Configuration

```html
<!-- Buttons displayed when not connected -->
<div id="connection-buttons">
  <button id="connect-wallet">Connect Wallet</button>
  <button id="connect-cross-extension" disabled>Connect Cross Extension</button>
  <button id="check-cross-extension">Check Extension Status</button>
</div>

<!-- Buttons displayed when connected -->
<div id="connected-buttons" style="display: none;">
  <button id="disconnect-wallet">Disconnect</button>
</div>
```

## 6. Button Visibility Management

```javascript
// Function to update button visibility and state
function updateButtonVisibility() {
  const isConnected = accountState?.isConnected || false

  // Connection related buttons
  const connectWallet = document.getElementById('connect-wallet')
  const connectCrossExtension = document.getElementById('connect-cross-extension')
  const checkCrossExtension = document.getElementById('check-cross-extension')
  const disconnectWallet = document.getElementById('disconnect-wallet')

  if (isConnected) {
    // Connected state: show only disconnect button
    if (connectWallet) connectWallet.style.display = 'none'
    if (connectCrossExtension) connectCrossExtension.style.display = 'none'
    if (checkCrossExtension) checkCrossExtension.style.display = 'none'
    if (disconnectWallet) disconnectWallet.style.display = 'inline-block'
  } else {
    // Not connected state: show connection buttons
    if (connectWallet) connectWallet.style.display = 'inline-block'
    if (connectCrossExtension) connectCrossExtension.style.display = 'inline-block'
    if (checkCrossExtension) checkCrossExtension.style.display = 'inline-block'
    if (disconnectWallet) disconnectWallet.style.display = 'none'

    // Update Cross Extension Wallet button enable/disable state
    updateCrossExtensionButtonState()
  }
}
```

## 7. Initialization and Event Subscription

```javascript
async function initializeApp() {
  try {
    console.log('Waiting for SDK to load...')
    const CrossSdk = await waitForSDK()
    console.log('SDK loaded successfully:', CrossSdk)

    // Initialize SDK
    const crossSdk = CrossSdk.initCrossSdkWithParams({
      projectId: 'your-project-id',
      redirectUrl: window.location.href,
      metadata: {
        name: 'Your App Name',
        description: 'Your App Description',
        url: 'https://your-app.com',
        icons: ['https://your-app.com/icon.png']
      },
      themeMode: 'light'
    })

    // Subscribe to account state
    crossSdk.subscribeAccount(state => {
      accountState = state
      updateButtonVisibility()
      console.log('Account state updated:', state)
    })

    // Periodically update Cross Extension Wallet button state
    setTimeout(() => {
      updateCrossExtensionButtonState()
      setInterval(updateCrossExtensionButtonState, 3000)
    }, 1000)

    // Set initial button state
    updateButtonVisibility()

    console.log('App initialized successfully!')
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
}

// Initialize app after DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp)
```

## Main APIs

### `window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()`

- **Purpose**: Check if Cross Extension Wallet is installed in the browser
- **Return Value**: `boolean` - `true` if installed, `false` otherwise
- **When to Use**:
  - During app initialization
  - Periodic checks (Extension can be installed/removed at runtime)
  - Determining button enable/disable state

### `window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()`

- **Purpose**: Request connection to Cross Extension Wallet
- **Return Value**: `Promise<{ address: string }>` - Returns address on successful connection
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
  const result = await window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()
  console.log('Connection successful:', result)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
    console.error('Extension not installed')
    alert('Please install Cross Extension Wallet first.')
  } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
    console.log('User cancelled connection')
    alert('Connection was cancelled.')
  } else if (errorMessage.includes('timeout')) {
    console.error('Connection timeout')
    alert('Connection timed out. Please try again.')
  } else {
    console.error('Connection failed:', error)
    alert(`Connection failed: ${errorMessage}`)
  }
}
```

## CSS Styling Example

```css
/* Extension connection button */
#connect-cross-extension {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: opacity 0.3s;
}

#connect-cross-extension:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

#connect-cross-extension:not(:disabled):hover {
  background-color: #0056b3;
}

/* Status display */
.extension-status {
  display: inline-block;
  margin-left: 10px;
  font-size: 14px;
}

.extension-status.installed {
  color: #28a745;
}

.extension-status.not-installed {
  color: #dc3545;
}
```

## Real Usage Example

You can find the complete code example at:

```
examples/sdk-cdn/app.js
```

Refer to lines 218-240 (status check), 988-1026 (connection), 1028-1031 (installation check).

## Tips

1. **Wait for SDK Load**: Wait for `window.CrossSdk` to load before calling APIs.

2. **Periodic Checks**: Check installation status periodically as users can install/remove Extensions at runtime.

3. **Button State Management**: Disable button when Extension is not installed to improve UX.

4. **Visual Feedback**: Adjust button opacity and cursor styles to clearly indicate active/inactive states.

5. **Error Messages**: Provide user-friendly error messages.

6. **State Subscription**: Use `crossSdk.subscribeAccount()` to detect connection state changes and update UI.

## Complete Example Code

```javascript
// Wait for SDK to load
function waitForSDK() {
  return new Promise(resolve => {
    if (window.CrossSdk) {
      resolve(window.CrossSdk)
    } else {
      const checkSDK = () => {
        if (window.CrossSdk) {
          resolve(window.CrossSdk)
        } else {
          setTimeout(checkSDK, 100)
        }
      }
      checkSDK()
    }
  })
}

// App state
let accountState = {}

// Check Extension status
function updateCrossExtensionButtonState() {
  const btn = document.getElementById('connect-cross-extension')
  if (btn && window.CrossSdk?.ConnectorUtil) {
    try {
      const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()
      btn.disabled = !isInstalled
      btn.style.opacity = isInstalled ? '1' : '0.6'
      btn.title = isInstalled ? 'Connect' : 'Extension not installed'
    } catch (error) {
      console.log('SDK not ready:', error)
    }
  }
}

// Connect Extension
async function connectExtension() {
  try {
    const result = await window.CrossSdk.ConnectorUtil.connectCrossExtensionWallet()
    alert(`✅ Connected: ${result.address}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('익스텐션이 설치되지 않았습니다')) {
      alert('❌ Extension not installed')
    } else if (msg.includes('rejected') || msg.includes('cancelled')) {
      alert('❌ Connection cancelled')
    } else {
      alert(`❌ Error: ${msg}`)
    }
  }
}

// Check Extension installation
function checkExtension() {
  const isInstalled = window.CrossSdk.ConnectorUtil.isInstalledCrossExtensionWallet()
  alert(isInstalled ? '✅ Installed' : '❌ Not installed')
}

// Initialize
async function initializeApp() {
  try {
    const CrossSdk = await waitForSDK()

    const crossSdk = CrossSdk.initCrossSdkWithParams({
      projectId: 'your-project-id',
      redirectUrl: window.location.href,
      metadata: {
        name: 'Your App',
        description: 'Description',
        url: 'https://your-app.com',
        icons: ['https://your-app.com/icon.png']
      }
    })

    // Register event listeners
    document.getElementById('connect-cross-extension')?.addEventListener('click', connectExtension)
    document.getElementById('check-cross-extension')?.addEventListener('click', checkExtension)

    // Subscribe to account state
    crossSdk.subscribeAccount(state => {
      accountState = state
      console.log('Account state:', state)
    })

    // Periodically check Extension status
    setTimeout(() => {
      updateCrossExtensionButtonState()
      setInterval(updateCrossExtensionButtonState, 3000)
    }, 1000)

    console.log('✅ App initialized')
  } catch (error) {
    console.error('❌ Initialization failed:', error)
  }
}

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', initializeApp)
```

## Complete HTML Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cross Extension Wallet Example</title>
    <style>
      button {
        padding: 10px 20px;
        margin: 5px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      #connect-cross-extension {
        background-color: #007bff;
        color: white;
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
    </style>
  </head>
  <body>
    <h1>Cross Extension Wallet Example</h1>

    <div>
      <button id="connect-cross-extension" disabled>Connect Extension</button>
      <button id="check-cross-extension">Check Extension</button>
    </div>

    <!-- Cross SDK CDN -->
    <script type="module" src="./cross-sdk.js"></script>

    <!-- Your app script -->
    <script type="module" src="./app.js"></script>
  </body>
</html>
```
