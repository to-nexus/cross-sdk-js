# Cross Extension Wallet 사용 가이드 (React)

Cross Extension Wallet을 React 애플리케이션에서 감지하고 연결하는 방법을 설명합니다.

## 필수 Import

```typescript
import { useAppKitWallet } from '@to-nexus/sdk/react'
```

## 1. Hook 및 상태 설정

```typescript
export function YourComponent() {
  const {
    connectCrossExtensionWallet, // Extension 연결 함수
    isInstalledCrossExtensionWallet // Extension 설치 확인 함수
  } = useAppKitWallet()

  const [isCrossExtensionInstalled, setIsCrossExtensionInstalled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
}
```

## 2. Extension 설치 상태 확인

### 2.1 확인 함수 생성

```typescript
// Extension 설치 상태 확인 함수를 메모이제이션
const checkExtensionInstalled = useCallback(() => {
  try {
    const installed = isInstalledCrossExtensionWallet()
    setIsCrossExtensionInstalled(installed)
  } catch (error) {
    console.error('Extension 설치 상태 확인 중 오류:', error)
    setIsCrossExtensionInstalled(false)
  }
}, [isInstalledCrossExtensionWallet])
```

### 2.2 자동 확인 설정 (선택사항)

Extension이 런타임에 설치/제거될 수 있으므로 주기적으로 확인:

```typescript
useEffect(() => {
  // 초기 확인
  checkExtensionInstalled()

  // 3초마다 확인 (익스텐션이 설치/제거될 수 있음)
  const interval = setInterval(checkExtensionInstalled, 3000)

  return () => clearInterval(interval)
}, [checkExtensionInstalled])
```

## 3. Extension 연결 함수

```typescript
const handleConnectCrossExtension = async () => {
  try {
    setIsLoading(true)

    // 연결 시작 전 현재 연결 상태 저장
    const wasConnectedBefore = account?.isConnected
    const addressBefore = account?.address

    console.log('🚀 Cross Extension Wallet 연결 시도 시작')
    console.log('연결 전 상태:', { wasConnectedBefore, addressBefore })

    // Extension 연결 실행
    const result = await connectCrossExtensionWallet()

    console.log('🎉 connectCrossExtensionWallet 완료:', result)

    // 연결 성공 후 실제로 새로운 연결이 이루어졌는지 확인
    await new Promise(resolve => setTimeout(resolve, 500))

    const isNowConnected = account?.isConnected
    const addressAfter = account?.address

    console.log('연결 후 상태:', { isNowConnected, addressAfter })

    // 실제로 연결 상태가 변경되었는지 확인
    if (!isNowConnected || (wasConnectedBefore && addressBefore === addressAfter)) {
      throw new Error('Connection verification failed - no state change detected')
    }

    // 연결 성공 후 상태 즉시 업데이트
    checkExtensionInstalled()

    console.log('✅ Cross Extension Wallet 연결 성공')
    alert('Cross Extension Wallet이 성공적으로 연결되었습니다.')
  } catch (error) {
    console.error('Cross Extension Wallet 연결 실패:', error)

    // 에러 메시지 분석
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
      alert('사용자가 지갑 연결을 취소했습니다.')
    } else if (isTimeout) {
      alert('지갑 연결 요청이 시간 초과되었습니다. 다시 시도해주세요.')
    } else if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
      alert('Cross Extension Wallet이 설치되지 않았습니다.')
    } else {
      alert(`지갑 연결 중 오류가 발생했습니다: ${errorMessage}`)
    }

    // 연결 실패 후에도 상태 확인
    checkExtensionInstalled()
  } finally {
    setIsLoading(false)
  }
}
```

## 4. Extension 설치 확인 버튼

```typescript
const handleCheckCrossExtension = () => {
  // 즉시 상태 업데이트 후 결과 표시
  checkExtensionInstalled()

  // 약간의 지연 후 최신 상태로 메시지 표시
  setTimeout(() => {
    if (isCrossExtensionInstalled) {
      alert('Cross Extension Wallet이 설치되어 있습니다.')
    } else {
      alert('Cross Extension Wallet을 먼저 설치해주세요.')
    }
  }, 100)
}
```

## 5. UI 렌더링

```tsx
return (
  <div>
    {/* Extension 설치 여부 확인 버튼 */}
    <button onClick={handleCheckCrossExtension}>
      Check Cross Extension ({isCrossExtensionInstalled ? '✅' : '❌'})
    </button>

    {/* Extension 연결 버튼 */}
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

## 주요 기능

### `isInstalledCrossExtensionWallet()`

- **역할**: Cross Extension Wallet이 브라우저에 설치되어 있는지 확인
- **반환값**: `boolean` - 설치되어 있으면 `true`, 아니면 `false`
- **사용 시기**:
  - 컴포넌트 마운트 시
  - 주기적 확인 (Extension이 런타임에 설치/제거될 수 있음)
  - 연결 버튼 활성화/비활성화 결정

### `connectCrossExtensionWallet()`

- **역할**: Cross Extension Wallet 연결 요청
- **반환값**: `Promise<void>` - 연결 성공/실패
- **주의사항**:
  - Extension이 설치되어 있지 않으면 에러 발생
  - 사용자가 연결을 거부하면 에러 발생
  - 연결 타임아웃 가능
  - 적절한 에러 핸들링 필수

## 에러 처리

### 일반적인 에러 케이스

1. **Extension 미설치**: "익스텐션이 설치되지 않았습니다"
2. **사용자 거부**: "User rejected", "User cancelled", "Modal closed"
3. **타임아웃**: "Connection timeout"
4. **설정 오류**: "customWallets에 설정되지 않았습니다"

### 권장 에러 처리 방법

```typescript
try {
  await connectCrossExtensionWallet()
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('익스텐션이 설치되지 않았습니다')) {
    // Extension 설치 안내
  } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
    // 사용자 취소 처리
  } else if (errorMessage.includes('timeout')) {
    // 재시도 안내
  } else {
    // 기타 에러 처리
  }
}
```

## 실제 사용 예제

전체 코드 예제는 다음 경로에서 확인할 수 있습니다:

```
examples/sdk-react/src/components/action-button.tsx
```

라인 139-193, 388-484를 참조하세요.

## 팁

1. **주기적 확인**: Extension은 사용자가 런타임에 설치/제거할 수 있으므로 주기적으로 설치 상태를 확인하는 것이 좋습니다.

2. **로딩 상태**: 연결 중임을 사용자에게 명확히 표시하세요.

3. **버튼 비활성화**: Extension이 설치되지 않았을 때 연결 버튼을 비활성화하여 UX를 개선하세요.

4. **에러 메시지**: 사용자 친화적인 에러 메시지를 제공하세요.

5. **상태 확인**: 연결 성공 후 실제로 상태가 변경되었는지 확인하세요.

## 완전한 컴포넌트 예제

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
      console.error('Extension 설치 상태 확인 중 오류:', error)
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
      alert('연결 성공!')
    } catch (error) {
      console.error('연결 실패:', error)
      alert('연결 실패: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckCrossExtension = () => {
    checkExtensionInstalled()
    setTimeout(() => {
      alert(isCrossExtensionInstalled ? '설치됨 ✅' : '미설치 ❌')
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
