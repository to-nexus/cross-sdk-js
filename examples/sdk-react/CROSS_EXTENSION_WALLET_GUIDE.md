# Cross Extension Wallet Usage Guide (React)

This guide explains how to detect and connect to Cross Extension Wallet in React applications.

## Required Import

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'
```

## 1. Hook and State Setup

```typescript
export function YourComponent() {
  const {
    connectCrossExtensionWallet, // Extension connection function
    isInstalledCrossExtensionWallet // Extension installation check function
  } = useAppKitWallet()

  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
}
```

## 2. Check Extension Installation Status

### 2.1 Create Check Function

```typescript
// Memoize the Extension installation status check function
const checkExtensionInstalled = useCallback(() => {
  try {
    const installed = isInstalledCrossExtensionWallet()
    setIsCrossExtensionInstalled(installed)
  } catch (error) {
    console.error('Error checking Extension installation status:', error)
    setIsCrossExtensionInstalled(false)
  }
}, [isInstalledCrossExtensionWallet])
```

### 2.2 Setup Automatic Check (Optional)

Check periodically as extension can be installed/removed at runtime:

```typescript
useEffect(() => {
  // Initial check
  checkExtensionInstalled()

  // Check every 3 seconds (extension can be installed/removed)
  const interval = setInterval(checkExtensionInstalled, 3000)

  return () => clearInterval(interval)
}, [checkExtensionInstalled])
```

## 3. Extension Connection Function

```typescript
const handleConnectCrossExtension = async () => {
  try {
    setIsLoading(true)

    console.log('🚀 Starting Cross Extension Wallet connection attempt')

    // Execute Extension connection (if completed without error = connection successful)
    await connectCrossExtensionWallet()

    console.log('🎉 connectCrossExtensionWallet completed')

    // Immediately update state after successful connection
    checkExtensionInstalled()

    console.log('✅ Cross Extension Wallet connection successful')
    alert('Cross Extension Wallet successfully connected.')
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
      errorMessage.includes('cancelled')

    const isTimeout = errorMessage.includes('Connection timeout')

    if (isUserRejection) {
      alert('User cancelled wallet connection.')
    } else if (isTimeout) {
      alert('Wallet connection request timed out. Please try again.')
    } else if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
      alert('Cross Extension Wallet is not installed.')
    } else {
      alert(`An error occurred while connecting to the wallet: ${errorMessage}`)
    }

    // Check state even after connection failure
    checkExtensionInstalled()
  } finally {
    setIsLoading(false)
  }
}
```

## 4. Extension Installation Check Button

```typescript
const handleCheckCrossExtension = () => {
  // Update state immediately and then display result
  checkExtensionInstalled()

  // Display message with latest state after slight delay
  setTimeout(() => {
    if (isCrossExtensionInstalled) {
      alert('Cross Extension Wallet is installed.')
    } else {
      alert('Please install Cross Extension Wallet first.')
    }
  }, 100)
}
```

## 5. UI Rendering

```tsx
return (
  <div>
    {/* Extension installation check button */}
    <button onClick={handleCheckCrossExtension}>
      Check Cross Extension ({isCrossExtensionInstalled ? '✅' : '❌'})
    </button>

    {/* Extension connection button */}
    <button
      onClick={handleConnectCrossExtension}
      disabled={!isCrossExtensionInstalled || isLoading}
      style={{
        backgroundColor: isCrossExtensionInstalled ? '#007bff' : '#6c757d',
        color: 'white',
        cursor: isCrossExtensionInstalled && !isLoading ? 'pointer' : 'not-allowed',
        opacity: isCrossExtensionInstalled && !isLoading ? 1 : 0.6
      }}
    >
      {isLoading ? 'Connecting...' : 'Connect Cross Extension'}
    </button>
  </div>
)
```

## Main Features

### `isInstalledCrossExtensionWallet()`

- **Purpose**: Check if Cross Extension Wallet is installed in the browser
- **Return Value**: `boolean` - `true` if installed, `false` otherwise
- **When to Use**:
  - When component mounts
  - Periodic checks (Extension can be installed/removed at runtime)
  - Determining connection button enable/disable state

### `connectCrossExtensionWallet()`

- **Purpose**: Request connection to Cross Extension Wallet
- **Return Value**: `Promise<void>` - Connection success/failure
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

### Recommended Error Handling Method

```typescript
try {
  await connectCrossExtensionWallet()
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
    // Guide Extension installation
  } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
    // Handle user cancellation
  } else if (errorMessage.includes('timeout')) {
    // Guide retry
  } else {
    // Handle other errors
  }
}
```

## Real Usage Example

You can find the complete code example at:

```
examples/sdk-react/src/components/action-button.tsx
```

Refer to lines 139-193, 388-484.

## Tips

1. **Periodic Checks**: It's good to check installation status periodically as users can install/remove Extensions at runtime.

2. **Loading State**: Clearly indicate to users that connection is in progress.

3. **Button Disable**: Disable connection button when Extension is not installed to improve UX.

4. **Error Messages**: Provide user-friendly error messages.

5. **State Verification**: Verify that state actually changed after successful connection.

## Complete Component Example

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useAppKitWallet, useAppKitAccount } from '@to-nexus/sdk/react'

export function CrossExtensionExample() {
  const { connectCrossExtensionWallet, isInstalledCrossExtensionWallet } = useAppKitWallet()
  const account = useAppKitAccount()
  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkExtensionInstalled = useCallback(() => {
    try {
      const installed = isInstalledCrossExtensionWallet()
      setIsCrossExtensionInstalled(installed)
    } catch (error) {
      console.error('Error checking Extension installation status:', error)
      setIsCrossExtensionInstalled(false)
    }
  }, [isInstalledCrossExtensionWallet])

  useEffect(() => {
    checkExtensionInstalled()
    const interval = setInterval(checkExtensionInstalled, 3000)
    return () => clearInterval(interval)
  }, [checkExtensionInstalled])

  const handleConnectCrossExtension = async () => {
    try {
      setIsLoading(true)
      await connectCrossExtensionWallet()
      checkExtensionInstalled()
      alert('Connection successful!')
    } catch (error) {
      console.error('Connection failed:', error)
      alert('Connection failed: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckCrossExtension = () => {
    checkExtensionInstalled()
    setTimeout(() => {
      alert(isCrossExtensionInstalled ? 'Installed ✅' : 'Not Installed ❌')
    }, 100)
  }

  return (
    <div>
      <h2>Cross Extension Wallet</h2>
      <button onClick={handleCheckCrossExtension}>
        Check Extension ({isCrossExtensionInstalled ? '✅' : '❌'})
      </button>
      <button
        onClick={handleConnectCrossExtension}
        disabled={!isCrossExtensionInstalled || isLoading}
        style={{
          backgroundColor: isCrossExtensionInstalled ? '#007bff' : '#6c757d',
          cursor: isCrossExtensionInstalled && !isLoading ? 'pointer' : 'not-allowed',
          opacity: isCrossExtensionInstalled && !isLoading ? 1 : 0.6
        }}
      >
        {isLoading ? 'Connecting...' : 'Connect Extension'}
      </button>
      {account?.isConnected && (
        <div>✅ Connected: {account.address}</div>
      )}
    </div>
  )
}
```
