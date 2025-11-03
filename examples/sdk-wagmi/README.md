# Cross SDK - Wagmi Dual Wallet Example

Cross SDK의 `WagmiAdapter`와 Reown AppKit을 함께 사용하여 **MetaMask**와 **CrossWallet**을 동시에 지원하는 이중 지갑 시스템 예제입니다.

## ✨ 주요 특징

- **🔐 이중 지갑 시스템**: MetaMask와 CrossWallet을 동시 지원
- **🔄 동적 전환**: 지갑을 자유롭게 전환 가능
- **⚡ Wagmi Hooks**: 모든 Wagmi React Hooks 사용 가능 (지갑 무관)
- **🌐 Multi-Chain**: 여러 네트워크 지원 (Ethereum, BSC, Cross, Kaia)
- **🎨 AppKit UI**: Cross SDK와 Reown AppKit의 통합 UI

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                  WalletProvider                      │
├─────────────────────────────────────────────────────┤
│  currentWallet State: 'metamask' | 'cross_wallet'   │
│                                                      │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │  Reown AppKit    │      │  CROSS SDK       │    │
│  │  (MetaMask)      │      │  (CrossWallet)   │    │
│  │                  │      │                  │    │
│  │  config          │      │  crossSdkConfig  │    │
│  └──────────────────┘      └──────────────────┘    │
│           ▲                         ▲               │
│           └──────────┬──────────────┘               │
│                      │                               │
│              WagmiProvider                           │
│              (key={currentWallet})                   │
└─────────────────────────────────────────────────────┘
```

## 프로젝트 사전 요구사항

- Node.js 16.x 이상
- pnpm 8.x 이상

## 환경 설정

### 1. `.env` 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Cross SDK Project ID (다른 examples와 일관성 유지)
VITE_PROJECT_ID=0979fd7c92ec3dbd8e78f433c3e5a523
```

**프로젝트 ID 안내:**

- `VITE_PROJECT_ID`: Cross SDK용 Project ID (다른 examples와 동일하게 사용)
- MetaMask (Reown) Project ID는 코드에 하드코딩되어 있습니다 (`a48aa6e93d89fbc0f047637579e65356`)
- Cross SDK Project ID 발급: Cross 팀에 문의

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 개발 서버 실행

```bash
pnpm run dev
```

서버는 기본적으로 **포트 3014**에서 실행됩니다.

- 개발 모드: `http://localhost:3014`

## 🔐 이중 지갑 시스템 사용법

### 1. 지갑 선택 UI

앱 실행 시 상단에 지갑 선택 UI가 표시됩니다:

- **CrossWallet 버튼**: CrossWallet으로 전환 및 연결
- **MetaMask 버튼**: MetaMask로 전환 및 연결
- **연결 해제 버튼**: 현재 지갑 연결 해제

### 2. 지갑 전환 플로우

```
사용자가 지갑 전환 버튼 클릭
        ↓
쿠키에 새 지갑 저장
        ↓
WagmiProvider 리마운트 (key 변경)
        ↓
새 지갑으로 연결
```

### 3. 하위 컴포넌트 코드 변경 불필요!

**핵심 장점**: 지갑을 변경해도 하위 컴포넌트에서 **Wagmi hooks를 그대로 사용**할 수 있습니다!

```typescript
// 이 코드는 MetaMask든 CrossWallet이든 동일하게 작동합니다
function MyComponent() {
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })
  const { writeContract } = useWriteContract()

  // WalletProvider에서 지갑을 변경하면
  // 자동으로 선택된 지갑의 데이터를 가져옵니다
  return <div>{balance?.formatted} ETH</div>
}
```

## 📦 구현 세부사항

### 1. 이중 WagmiAdapter 설정 (`wagmi-utils.ts`)

```typescript
import { WagmiAdapter as ToNexusWagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'

import { WagmiAdapter as ReownWagmiAdapter } from '@reown/appkit-adapter-wagmi'

// MetaMask용 Reown AppKit Adapter
export const wagmiAdapter = new ReownWagmiAdapter({
  projectId,
  networks
})

// CrossWallet용 CROSS SDK Adapter
export const sdkWagmiAdapter = new ToNexusWagmiAdapter({
  projectId: crossSdkProjectId,
  networks
})

// 각각의 Wagmi Config 추출
export const config = wagmiAdapter.wagmiConfig
export const crossSdkConfig = sdkWagmiAdapter.wagmiConfig
```

### 2. WalletProvider (`providers/WalletProvider.tsx`)

- 현재 지갑 상태 관리 (`currentWallet`)
- 동적 config 선택
- 지갑 전환 시 강제 리마운트 (key prop)
- IndexedDB 완전 삭제
- 연결/해제 핸들러

### 3. SDK 초기화 (`main.tsx`)

```typescript
// Reown AppKit 초기화 (MetaMask용)
createAppKit({
  adapters: [wagmiAdapter], // ← MetaMask용 adapter
  projectId,
  networks
  // ...
})

// CROSS SDK 초기화 (CrossWallet용)
initCrossSdk(
  crossSdkProjectId,
  'http://localhost:3014',
  metadata,
  'dark',
  crossMainnet,
  [sdkWagmiAdapter] // ← CrossWallet용 adapter
)
```

## 🎯 사용 가능한 Wagmi Hooks

이 예제에서 구현된 Wagmi 기능들 (모든 지갑에서 동일하게 작동):

### 연결 관리

- `useAccount()` - 계정 정보 조회
- 연결/해제는 `WalletProvider`의 `handleConnect/handleDisconnect` 사용

### 잔액 및 데이터 조회

- `useBalance()` - Native 토큰 잔액 조회
- `useReadContract()` - ERC20 토큰 잔액 등 컨트랙트 데이터 읽기

### 트랜잭션 및 서명

- `useSignMessage()` - 일반 메시지 서명
- `useSignTypedData()` - EIP-712 구조화된 데이터 서명
- `useSendTransaction()` - Native 토큰 전송
- `useWriteContract()` - ERC20 토큰 전송 등 컨트랙트 쓰기

### 네트워크

- `useSwitchChain()` - 네트워크 전환

## 💡 WalletProvider Hook 사용법

```typescript
import { useWallet } from '../providers/WalletProvider'

function MyComponent() {
  const {
    currentWallet,        // 'cross_wallet' | 'metamask'
    handleConnect,        // (wallet) => Promise<void>
    handleDisconnect,     // () => Promise<void>
    isReady              // boolean
  } = useWallet()

  return (
    <>
      <p>현재 지갑: {currentWallet}</p>
      <button onClick={() => handleConnect('metamask')}>
        MetaMask 연결
      </button>
      <button onClick={() => handleConnect('cross_wallet')}>
        CrossWallet 연결
      </button>
      <button onClick={handleDisconnect}>
        연결 해제
      </button>
    </>
  )
}
```

## 🔧 문제 해결

### 문제 1: 지갑 전환 시 이전 지갑 상태가 남아있음

**해결**: WagmiProvider의 `key` prop으로 강제 리마운트

```tsx
<WagmiProvider key={currentWallet} config={wagmiConfig}>
```

### 문제 2: IndexedDB에 이전 지갑 데이터가 남아있음

**해결**: 연결 해제 시 IndexedDB 완전 삭제

```typescript
const clearIndexedDB = async () => {
  const databases = await window.indexedDB.databases()
  await Promise.all(
    databases.map(db => {
      if (db.name) {
        return new Promise<void>(resolve => {
          const request = window.indexedDB.deleteDatabase(db.name!)
          request.onsuccess = () => resolve()
        })
      }
    })
  )
}
```

### 문제 3: 지갑 전환 중 UI가 깨짐

**해결**: 전환 중 오버레이 표시 (`isTransitioning` 상태)

## 🌟 이중 지갑 시스템의 장점

1. **🔄 유연한 전환**: 사용자가 원하는 지갑을 자유롭게 선택
2. **🎯 코드 재사용**: 지갑별로 다른 코드를 작성할 필요 없음
3. **⚡ 일관된 API**: Wagmi hooks로 모든 지갑 통합 관리
4. **🔒 완전한 격리**: 각 지갑의 상태가 완전히 분리됨
5. **🎨 통합 UX**: 두 지갑 모두 AppKit UI 사용

## WalletConnect 설정

WalletConnect QR 코드가 표시되지 않는 경우:

1. [cloud.reown.com](https://cloud.reown.com)에 접속
2. 프로젝트 설정으로 이동
3. Allowlist에 `http://localhost:3014` 추가

## 📚 더 알아보기

- [Cross SDK Documentation](https://docs.to.nexus)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Reown AppKit Documentation](https://docs.reown.com)

## 🎓 참고: 단일 지갑 vs 이중 지갑

| 구분              | 단일 지갑 (기존) | 이중 지갑 (현재)       |
| ----------------- | ---------------- | ---------------------- |
| **지원 지갑**     | CrossWallet만    | CrossWallet + MetaMask |
| **Config 수**     | 1개              | 2개 (동적 전환)        |
| **Provider 구조** | WagmiProvider    | WalletProvider + Wagmi |
| **지갑 전환**     | 불가능           | 가능                   |
| **코드 복잡도**   | 낮음             | 중간                   |
| **사용자 선택권** | 없음             | 있음                   |
