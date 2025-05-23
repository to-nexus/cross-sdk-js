import { type Ref, onUnmounted, ref } from 'vue'

import { ChainController, CoreHelperUtil, type UseAppKitNetworkReturn } from '@to-nexus/appkit-core'
import type { AppKitNetwork } from '@to-nexus/appkit/networks'

import { AppKit } from '../src/client.js'
import { getAppKit } from '../src/library/vue/index.js'
import type { AppKitOptions } from '../src/utils/TypesUtil.js'
import { PACKAGE_VERSION } from './constants.js'

// -- Views ------------------------------------------------------------
export * from '@to-nexus/appkit-scaffold-ui'

// -- Hooks ------------------------------------------------------------
export * from '../src/library/vue/index.js'

// -- Utils & Other -----------------------------------------------------
export * from '../src/utils/index.js'
export type * from '@to-nexus/appkit-core'
export type { CaipNetwork, CaipAddress, CaipNetworkId } from '@to-nexus/appkit-common'
export { CoreHelperUtil, AccountController } from '@to-nexus/appkit-core'

let modal: AppKit | undefined = undefined

export type CreateAppKit = Omit<AppKitOptions, 'sdkType' | 'sdkVersion'>

export function createAppKit(options: CreateAppKit) {
  if (!modal) {
    modal = new AppKit({
      ...options,
      sdkVersion: CoreHelperUtil.generateSdkVersion(options.adapters ?? [], 'html', PACKAGE_VERSION)
    })
    getAppKit(modal)
  }

  return modal
}

export { AppKit }
export type { AppKitOptions }

// -- Hooks ------------------------------------------------------------
export function useAppKitNetwork(): Ref<UseAppKitNetworkReturn> {
  const state = ref({
    caipNetwork: ChainController.state.activeCaipNetwork,
    chainId: ChainController.state.activeCaipNetwork?.id,
    caipNetworkId: ChainController.state.activeCaipNetwork?.caipNetworkId,
    switchNetwork: (network: AppKitNetwork) => {
      modal?.switchNetwork(network)
    }
  })

  const unsubscribe = ChainController.subscribeKey('activeCaipNetwork', val => {
    state.value.caipNetwork = val
    state.value.chainId = val?.id
    state.value.caipNetworkId = val?.caipNetworkId
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return state
}

export * from '../src/library/vue/index.js'
