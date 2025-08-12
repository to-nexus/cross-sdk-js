import { useEffect } from 'react'

import {
  AccountController,
  CoreHelperUtil,
  type UseAppKitNetworkReturn
} from '@to-nexus/appkit-core'
import { useAppKitNetworkCore } from '@to-nexus/appkit-core/react'
import type { AppKitNetwork } from '@to-nexus/appkit/networks'

import { AppKit } from '../src/client.js'
import { getAppKit } from '../src/library/react/index.js'
import type { AppKitOptions } from '../src/utils/TypesUtil.js'
import { PACKAGE_VERSION } from './constants.js'

// -- Views ------------------------------------------------------------
export * from '@to-nexus/appkit-scaffold-ui'

// -- Hooks ------------------------------------------------------------
export * from '../src/library/react/index.js'

// -- Utils & Other -----------------------------------------------------
export * from '../src/utils/index.js'
export type * from '@to-nexus/appkit-core'
export type { CaipNetwork, CaipAddress, CaipNetworkId } from '@to-nexus/appkit-common'
export { CoreHelperUtil, AccountController } from '@to-nexus/appkit-core'

export let modal: AppKit | undefined = undefined

export type CreateAppKit = Omit<AppKitOptions, 'sdkType' | 'sdkVersion'>

export function createAppKit(options: CreateAppKit) {
  console.log('getDefaultChain ::: createAppKit ::: options ', options)

  if (!modal) {
    modal = new AppKit({
      ...options,
      sdkVersion: CoreHelperUtil.generateSdkVersion(
        options.adapters ?? [],
        'react',
        PACKAGE_VERSION
      )
    })
    getAppKit(modal)
  }

  return modal
}

export { AppKit }
export type { AppKitOptions }

// -- Hooks ------------------------------------------------------------
export * from '../src/library/react/index.js'

export function useAppKitNetwork(): UseAppKitNetworkReturn {
  const { caipNetwork, caipNetworkId, chainId } = useAppKitNetworkCore()

  function switchNetwork(network: AppKitNetwork) {
    modal?.switchNetwork(network)
  }

  return {
    caipNetwork,
    caipNetworkId,
    chainId,
    switchNetwork
  }
}

export { useAppKitAccount } from '@to-nexus/appkit-core/react'
export { useAppKitWallet } from '@to-nexus/appkit-wallet-button/react'
