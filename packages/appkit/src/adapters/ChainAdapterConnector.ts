import type { CaipNetwork } from '@to-nexus/appkit-common'
import type { Connector } from '@to-nexus/appkit-core'

export interface ChainAdapterConnector extends Connector {
  chains: CaipNetwork[]
}
