import type { AppKitNetwork, CaipNetwork } from '@to-nexus/appkit-common'
import type { Assign, ChainFormatters, Prettify } from 'viem'

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
