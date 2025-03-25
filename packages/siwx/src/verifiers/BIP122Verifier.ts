import { Verifier } from 'bip322-js'

import { ConstantsUtil } from '@to-nexus/appkit-common'
import type { SIWXSession } from '@to-nexus/appkit-core'

import { SIWXVerifier } from '../core/SIWXVerifier.js'

/**
 * Default verifier for BIP122 sessions.
 */
export class BIP122Verifier extends SIWXVerifier {
  public readonly chainNamespace = ConstantsUtil.CHAIN.BITCOIN

  public async verify(session: SIWXSession): Promise<boolean> {
    try {
      return Promise.resolve(
        Verifier.verifySignature(session.data.accountAddress, session.message, session.signature)
      )
    } catch (error) {
      return false
    }
  }
}
