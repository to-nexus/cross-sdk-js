import type { AppKitNetwork } from '@to-nexus/appkit-common'
import { ConstantsUtil } from '@to-nexus/appkit-common'

import { bscMainnet } from './bsc/bscMainnet.js'
import { bscTestnet } from './bsc/bscTestnet.js'
import { crossMainnet } from './cross/crossMainnet.js'
import { crossTestnet } from './cross/crossTestnet.js'
import { etherMainnet } from './ethereum/etherMainnet.js'
import { etherTestnet } from './ethereum/etherTestnet.js'
import { kaiaMainnet } from './kaia/kaiaMainnet.js'
import { kaiaTestnet } from './kaia/kaiaTestnet.js'
import { mapApiToNetwork } from './mapper.js'
import { roninMainnet } from './ronin/roninMainnet.js'
import { roninTestnet } from './ronin/roninTestnet.js'
import type { ChainApiResponse } from './types.js'

const defaultNetworks: AppKitNetwork[] = [
  crossTestnet,
  crossMainnet,
  bscTestnet,
  bscMainnet,
  kaiaTestnet,
  kaiaMainnet,
  etherTestnet,
  etherMainnet,
  roninMainnet,
  roninTestnet
]

export class NetworkController {
  private networks: AppKitNetwork[] = [...defaultNetworks]
  private apiUrl: string
  private isInitialized = false

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || ConstantsUtil.getWeb3mApiUrl()
  }

  setApiUrl(url: string) {
    this.apiUrl = url
  }

  getNetworks() {
    return this.networks
  }

  async fetchNetworks() {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/public/chain/info?from=crossx-js-sdk`)
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`, {
          cause: { status: response.status, statusText: response.statusText }
        })
      }

      const json: ChainApiResponse = await response.json()

      if (json.code === 200 && Array.isArray(json.data)) {
        const fetchedNetworks = json.data.map(mapApiToNetwork)
        this.mergeNetworks(fetchedNetworks)
        this.isInitialized = true
      }
    } catch (error) {
      // Log error with full details but don't throw - fallback to defaults
      console.warn('Failed to fetch dynamic networks, using defaults:', error)
    }
  }

  private mergeNetworks(newNetworks: AppKitNetwork[]) {
    const networkMap = new Map<string | number, AppKitNetwork>()

    this.networks.forEach(net => networkMap.set(net.id, net))
    newNetworks.forEach(net => networkMap.set(net.id, net))

    this.networks = Array.from(networkMap.values())
  }

  get initialized() {
    return this.isInitialized
  }
}

export const networkController = new NetworkController()
