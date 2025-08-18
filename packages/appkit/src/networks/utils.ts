import type { AppKitNetwork, CaipNetwork } from '@to-nexus/appkit-common'
import type { Assign, ChainFormatters, Prettify } from 'viem'

import { bscMainnet } from './bsc/bscMainnet.js'
import { bscTestnet } from './bsc/bscTestnet.js'
import { crossMainnet } from './cross/crossMainnet.js'
import { crossTestnet } from './cross/crossTestnet.js'
import { etherMainnet } from './ethereum/etherMainnet.js'
import { etherTestnet } from './ethereum/etherTestnet.js'
import { kaiaMainnet } from './kaia/kaiaMainnet.js'
import { kaiaTestnet } from './kaia/kaiaTestnet.js'

export function defineChain<
  formatters extends ChainFormatters,
  const chain extends CaipNetwork<formatters>
>(chain: chain): Prettify<Assign<CaipNetwork<undefined>, chain>> {
  return {
    formatters: undefined,
    fees: undefined,
    serializers: undefined,
    ...chain
  } as Assign<CaipNetwork<undefined>, chain>
}

export const networkList: [AppKitNetwork, ...AppKitNetwork[]] = [
  crossTestnet,
  crossMainnet,
  bscTestnet,
  bscMainnet,
  kaiaTestnet,
  kaiaMainnet,
  etherTestnet,
  etherMainnet
]
