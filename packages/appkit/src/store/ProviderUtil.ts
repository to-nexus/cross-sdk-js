import type { ChainNamespace } from '@to-nexus/appkit-common'
import type { ConnectorType } from '@to-nexus/appkit-core'
import type UniversalProvider from '@to-nexus/universal-provider'
import { proxy, ref, subscribe } from 'valtio/vanilla'
import { subscribeKey as subKey } from 'valtio/vanilla/utils'

type StateKey = keyof ProviderStoreUtilState

export interface ProviderStoreUtilState {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  providers: Record<ChainNamespace, UniversalProvider | unknown | undefined>
  providerIds: Record<ChainNamespace, ConnectorType | undefined>
}

export type ProviderType =
  | 'walletConnect'
  | 'injected'
  | 'coinbaseWallet'
  | 'eip6963'
  | 'ID_AUTH'
  | 'coinbaseWalletSDK'

const CLEAN_PROVIDERS_STATE = {
  eip155: undefined,
  solana: undefined,
  polkadot: undefined,
  bip122: undefined
}

const state = proxy<ProviderStoreUtilState>({
  providers: { ...CLEAN_PROVIDERS_STATE },
  providerIds: { ...CLEAN_PROVIDERS_STATE }
})

export const ProviderUtil = {
  state,

  subscribeKey<K extends StateKey>(key: K, callback: (value: ProviderStoreUtilState[K]) => void) {
    return subKey(state, key, callback)
  },

  subscribeProviders(callback: (providers: ProviderStoreUtilState['providers']) => void) {
    return subscribe(state.providers, () => callback(state.providers))
  },

  setProvider<T = UniversalProvider>(chainNamespace: ChainNamespace, provider: T) {
    console.log(`###?? ProviderUtil.setProvider : start ${new Date().toISOString()}`)
    console.log(
      `###?? ProviderUtil.setProvider : chainNamespace=${chainNamespace}, providerType=${provider?.constructor?.name || 'unknown'}`
    )
    if (provider) {
      state.providers[chainNamespace] = ref(provider) as T
    }
  },

  getProvider<T = UniversalProvider>(chainNamespace: ChainNamespace): T | undefined {
    console.log(`###?? ProviderUtil.getProvider : start ${new Date().toISOString()}`)
    const provider = state.providers[chainNamespace] as T | undefined
    console.log(
      `###?? ProviderUtil.getProvider : chainNamespace=${chainNamespace}, providerType=${provider?.constructor?.name || 'undefined'}`
    )

    return provider
  },

  setProviderId(chainNamespace: ChainNamespace, providerId: ConnectorType) {
    console.log(`###?? ProviderUtil.setProviderId : start ${new Date().toISOString()}`)
    console.log(
      `###?? ProviderUtil.setProviderId : chainNamespace=${chainNamespace}, providerId=${providerId}`
    )
    if (providerId) {
      state.providerIds[chainNamespace] = providerId
    }
  },

  getProviderId(chainNamespace: ChainNamespace): ConnectorType | undefined {
    console.log(`###?? ProviderUtil.getProviderId : start ${new Date().toISOString()}`)
    const providerId = state.providerIds[chainNamespace]
    console.log(
      `###?? ProviderUtil.getProviderId : chainNamespace=${chainNamespace}, providerId=${providerId}`
    )

    return providerId
  },

  reset() {
    console.log(`###?? ProviderUtil.reset : start ${new Date().toISOString()}`)
    state.providers = { ...CLEAN_PROVIDERS_STATE }
    state.providerIds = { ...CLEAN_PROVIDERS_STATE }
  },

  resetChain(chainNamespace: ChainNamespace) {
    console.log(`###?? ProviderUtil.resetChain : start ${new Date().toISOString()}`)
    console.log(`###?? ProviderUtil.resetChain : chainNamespace=${chainNamespace}`)
    state.providers[chainNamespace] = undefined
    state.providerIds[chainNamespace] = undefined
  }
}
