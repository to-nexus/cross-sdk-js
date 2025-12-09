// -- Controller -------------------------------------------------------------
import { networkController } from './controller.js'

/*
 * -- Networks ---------------------------------------------------------------
 * export * from 'viem/chains'
 */
export * from './solana/index.js'
export * from './bitcoin.js'
export * from './cross/index.js'
export * from './bsc/index.js'
export * from './kaia/index.js'
export * from './ethereum/index.js'
export * from './ronin/index.js'

// -- Utils ------------------------------------------------------------------
export * from './utils.js'

export { networkController, NetworkController, DEFAULT_API_URL } from './controller.js'
export { mapApiToNetwork } from './mapper.js'
export * from './types.js'

export async function initializeNetworks() {
  await networkController.fetchNetworks()

  return networkController.getNetworks()
}

// -- Types ---------------------------------------------------------------
export type { AppKitNetwork } from '@to-nexus/appkit-common'
