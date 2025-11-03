import { WagmiAdapter as ToNexusWagmiAdapter } from '@to-nexus/appkit-adapter-wagmi'
import {
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  kaiaMainnet,
  kaiaTestnet
} from '@to-nexus/appkit/networks'
import type { AppKitNetwork } from '@to-nexus/appkit/networks'

import { WagmiAdapter as ReownWagmiAdapter } from '@reown/appkit-adapter-wagmi'

// 프로젝트 ID들
// VITE_PROJECT_ID는 Cross SDK용 (다른 examples와 일관성 유지)
export const crossSdkProjectId =
  import.meta.env['VITE_PROJECT_ID'] || '0979fd7c92ec3dbd8e78f433c3e5a523'
// MetaMask (Reown)용은 하드코딩 (sdk-react와 동일)
export const projectId = 'a48aa6e93d89fbc0f047637579e65356'

// 지원하는 네트워크 정의
export const networks = [
  etherMainnet,
  etherTestnet,
  bscMainnet,
  bscTestnet,
  crossTestnet,
  crossMainnet,
  kaiaMainnet,
  kaiaTestnet
]

// MetaMask용 Reown AppKit Adapter
export const wagmiAdapter = new ReownWagmiAdapter({
  projectId, // Reown 프로젝트 ID
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]]
})

// CrossWallet용 CROSS SDK Adapter
export const sdkWagmiAdapter = new ToNexusWagmiAdapter({
  projectId: crossSdkProjectId, // CROSS SDK 프로젝트 ID
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]]
})

// 각각의 Wagmi Config 추출
export const config = wagmiAdapter.wagmiConfig
export const crossSdkConfig = sdkWagmiAdapter.wagmiConfig
