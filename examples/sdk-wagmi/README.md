# Cross SDK - Wagmi Example

Cross SDK의 `WagmiAdapter`를 사용하여 Wagmi와 통합한 예제입니다.

## ✨ 주요 특징

- **WagmiAdapter**: Cross SDK와 Wagmi를 통합한 어댑터 사용
- **AppKit**: Cross SDK의 AppKit UI 지원
- **Wagmi Hooks**: 모든 Wagmi React Hooks 사용 가능
- **Multi-Chain**: 여러 네트워크 지원 (Ethereum, BSC, Cross, Kaia)

## 🏗️ 아키텍처

```
┌─────────────────────────────────────┐
│      Cross SDK (AppKit)             │
├─────────────────────────────────────┤
│      WagmiAdapter                   │
├─────────────────────────────────────┤
│      Wagmi Core                     │
├─────────────────────────────────────┤
│      Viem                           │
└─────────────────────────────────────┘
```

## 프로젝트 사전 요구사항

- Node.js 16.x 이상
- pnpm 8.x 이상

## 환경 설정

### 1. `.env` 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
VITE_PROJECT_ID=your_project_id_here
```

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

## 📦 WagmiAdapter 사용 방법

```typescript
import { createAppKit } from '@to-nexus/appkit'
import { WagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'
import { mainnet, sepolia } from 'viem/chains'
import { WagmiProvider } from 'wagmi'
import { http } from 'viem'

// 1. WagmiAdapter 생성
const wagmiAdapter = new WagmiAdapter({
  projectId: 'YOUR_PROJECT_ID',
  networks: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  }
})

// 2. AppKit 생성
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia],
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'My App',
    description: 'My App Description',
    url: 'http://localhost:3014',
    icons: ['https://...']
  }
})

// 3. WagmiProvider로 감싸기
<WagmiProvider config={wagmiAdapter.wagmiConfig}>
  <App />
</WagmiProvider>
```

## 🎯 사용 가능한 Wagmi Hooks

이 예제에서 구현된 Wagmi 기능들:

### 연결 관리

- `useConnect()` - 지갑 연결 (Cross Extension, MetaMask, WalletConnect 등)
- `useDisconnect()` - 지갑 연결 해제
- `useAccount()` - 계정 정보 조회

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

## 💡 순수 Wagmi vs WagmiAdapter

| 구분               | 순수 Wagmi            | WagmiAdapter         |
| ------------------ | --------------------- | -------------------- |
| **설정**           | `createConfig()` 직접 | `new WagmiAdapter()` |
| **Connector**      | 수동 설정 필요        | 자동 포함            |
| **AppKit UI**      | 없음                  | 포함                 |
| **Cross SDK 통합** | 별도                  | 완전 통합            |
| **권장 사용**      | Wagmi만 사용          | Cross SDK + Wagmi    |

## WalletConnect 설정

WalletConnect QR 코드가 표시되지 않는 경우:

1. [cloud.reown.com](https://cloud.reown.com)에 접속
2. 프로젝트 설정으로 이동
3. Allowlist에 `http://localhost:3014` 추가

## 📚 더 알아보기

- [Cross SDK Documentation](https://docs.to.nexus)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
