import { CoreHelperUtil } from '@to-nexus/appkit-core'

import { AppKit } from '../src/client.js'
import type { AppKitOptions } from '../src/utils/TypesUtil.js'
import { PACKAGE_VERSION } from './constants.js'


// -- Views ------------------------------------------------------------
export * from '@to-nexus/appkit-scaffold-ui'

// -- Utils & Other -----------------------------------------------------
export * from '../src/utils/index.js'
export type * from '@to-nexus/appkit-core'
export type { CaipNetwork, CaipAddress, CaipNetworkId } from '@to-nexus/appkit-common'
export { CoreHelperUtil, AccountController, SendController, ConnectionController } from '@to-nexus/appkit-core'

export type CreateAppKit = Omit<AppKitOptions, 'sdkType' | 'sdkVersion'>

export function createAppKit(options: CreateAppKit) {
  return new AppKit({
    ...options,
    sdkVersion: CoreHelperUtil.generateSdkVersion(options.adapters ?? [], 'html', PACKAGE_VERSION)
  })
}

export { AppKit }
export type { AppKitOptions }
