import type { CaipNetwork } from '@to-nexus/appkit-common'
import type { Assign, ChainFormatters, Prettify } from 'viem'

import { bscMainnet } from './bsc/bscMainnet.js'
import { bscTestnet } from './bsc/bscTestnet.js'
import { crossMainnet } from './cross/crossMainnet.js'
import { crossTestnet } from './cross/crossTestnet.js'

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

export const contractData = {
  612044: {
    erc20: '0xe934057Ac314cD9bA9BC17AE2378959fd39Aa2E3',
    erc721: '0xaD31a95fE6bAc89Bc4Cf84dEfb23ebBCA080c013',
    network: crossTestnet
  },
  612055: {
    erc20: '0xe9013a5231BEB721f4F801F2d07516b8ca19d953',
    erc721: '',
    network: crossMainnet
  },
  97: {
    erc20: '',
    erc721: '',
    network: bscTestnet
  },
  56: {
    erc20: '',
    erc721: '',
    network: bscMainnet
  }
}
