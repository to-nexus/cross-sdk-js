import { type CaipNetwork } from '@to-nexus/appkit-common'
import { solana, solanaDevnet, solanaTestnet } from '@to-nexus/appkit/networks'

export const solanaChains = {
  'solana:mainnet': solana,
  'solana:testnet': solanaTestnet,
  'solana:devnet': solanaDevnet
} as Record<`${string}:${string}`, CaipNetwork>
