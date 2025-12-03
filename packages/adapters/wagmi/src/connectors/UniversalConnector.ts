/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable func-style */
/* eslint-disable init-declarations */
import type { AppKit, AppKitOptions } from '@to-nexus/appkit'
import { WcHelpersUtil } from '@to-nexus/appkit'
import type { CaipNetwork, ChainNamespace } from '@to-nexus/appkit-common'
import { ConstantsUtil } from '@to-nexus/appkit-common'
import { StorageUtil } from '@to-nexus/appkit-core'
import { type UniversalProvider as UniversalProviderType } from '@to-nexus/universal-provider'
import {
  ChainNotConfiguredError,
  type Connector,
  ProviderNotFoundError,
  createConnector
} from '@wagmi/core'
import {
  type AddEthereumChainParameter,
  type Address,
  type ProviderConnectInfo,
  type ProviderRpcError,
  type RpcError,
  SwitchChainError,
  UserRejectedRequestError,
  getAddress,
  numberToHex
} from 'viem'

type UniversalConnector = Connector & {
  onDisplayUri(uri: string): void
  onSessionDelete(data: { topic: string }): void
}

export type AppKitOptionsParams = AppKitOptions & {
  isNewChainsStale?: boolean
  siwx?: AppKitOptions['siwx']
}

export function walletConnect(
  parameters: AppKitOptionsParams,
  appKit: AppKit,
  caipNetworks: [CaipNetwork, ...CaipNetwork[]]
) {
  // ✅ Extract siwx from parameters
  const { siwx } = parameters
  const isNewChainsStale = parameters.isNewChainsStale ?? true
  type Provider = Awaited<ReturnType<(typeof UniversalProviderType)['init']>>
  type Properties = {
    // eslint-disable-next-line no-shadow
    connect(parameters?: { chainId?: number; pairingTopic?: string }): Promise<{
      accounts: readonly Address[]
      chainId: number
    }>
    getNamespaceChainsIds(): number[]
    getRequestedChainsIds(): Promise<number[]>
    isChainsStale(): Promise<boolean>
    onConnect(connectInfo: ProviderConnectInfo): void
    onDisplayUri(uri: string): void
    onSessionDelete(data: { topic: string }): void
    setRequestedChainsIds(chains: number[]): void
    requestedChainsStorageKey: `${string}.requestedChains`
  }
  type StorageItem = {
    [_ in Properties['requestedChainsStorageKey']]: number[]
  }

  let provider_: Provider | undefined

  let accountsChanged: UniversalConnector['onAccountsChanged'] | undefined
  let chainChanged: UniversalConnector['onChainChanged'] | undefined
  let connect: UniversalConnector['onConnect'] | undefined
  let displayUri: UniversalConnector['onDisplayUri'] | undefined
  let sessionDelete: UniversalConnector['onSessionDelete'] | undefined
  let disconnect: UniversalConnector['onDisconnect'] | undefined

  return createConnector<Provider, Properties, StorageItem>((config: any) => ({
    id: 'walletConnect',
    name: 'WalletConnect',
    type: 'walletConnect' as const,

    // ✅ Add authenticate method for SIWX support
    async authenticate() {
      const provider = (await this.getProvider()) as any
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      if (siwx) {
        // Use SIWXUtil for authentication
        const { SIWXUtil } = await import('@to-nexus/appkit-core')
        const chains = caipNetworks.map(network => network.caipNetworkId)
        const OPTIONAL_METHODS = [
          'eth_accounts',
          'eth_requestAccounts',
          'eth_sendRawTransaction',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
          'eth_sendTransaction',
          'personal_sign',
          'wallet_switchEthereumChain',
          'wallet_addEthereumChain',
          'wallet_getPermissions',
          'wallet_requestPermissions',
          'wallet_registerOnboarding',
          'wallet_watchAsset',
          'wallet_scanQRCode',
          'wallet_getCallsStatus',
          'wallet_sendCalls',
          'wallet_getCapabilities',
          'wallet_grantPermissions',
          'wallet_revokePermissions',
          'wallet_getAssets'
        ]

        return SIWXUtil.universalProviderAuthenticate({
          universalProvider: provider,
          chains,
          methods: OPTIONAL_METHODS
        })
      }

      // Fallback to regular connect
      throw new Error('SIWX not configured')
    },

    async setup() {
      const provider = (await this.getProvider().catch(() => null)) as any
      if (!provider) {
        return
      }
      if (!connect) {
        connect = this.onConnect.bind(this)
        provider.on('connect', connect)
      }
      if (!sessionDelete) {
        sessionDelete = this.onSessionDelete.bind(this)
        provider.on('session_delete', sessionDelete)
      }
    },

    async connect({ ...rest } = {}) {
      try {
        const provider = (await this.getProvider()) as any
        if (!provider) {
          throw new ProviderNotFoundError()
        }
        if (!displayUri) {
          displayUri = this.onDisplayUri
          provider.on('display_uri', displayUri)
        }

        const isChainsStale = await this.isChainsStale()
        // If there is an active session with stale chains, disconnect current session.
        if (provider.session && isChainsStale) {
          await provider.disconnect()
        }
        // If there isn't an active session or chains are stale, connect.
        if (!provider.session || isChainsStale) {
          const namespaces = WcHelpersUtil.createNamespaces(caipNetworks)
          await provider.connect({
            optionalNamespaces: namespaces,
            ...('pairingTopic' in rest ? { pairingTopic: rest.pairingTopic as string } : {})
          })

          this.setRequestedChainsIds(caipNetworks.map((x: any) => Number(x.id)))
        }

        // If session exists and chains are authorized, enable provider for required chain
        const accounts = (await provider.enable()).map((x: string) => getAddress(x))
        const currentChainId = await this.getChainId()

        if (displayUri) {
          provider.removeListener('display_uri', displayUri)
          displayUri = undefined
        }
        if (connect) {
          provider.removeListener('connect', connect)
          connect = undefined
        }
        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
          provider.on('accountsChanged', accountsChanged)
        }
        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this)
          provider.on('chainChanged', chainChanged)
        }
        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this)
          provider.on('disconnect', disconnect)
        }
        if (!sessionDelete) {
          sessionDelete = this.onSessionDelete.bind(this)
          provider.on('session_delete', sessionDelete)
        }

        provider.setDefaultChain(`eip155:${currentChainId}`)

        return { accounts, chainId: currentChainId }
      } catch (error) {
        if (
          // eslint-disable-next-line prefer-named-capture-group, require-unicode-regexp
          /(user rejected|connection request reset)/i.test((error as ProviderRpcError)?.message)
        ) {
          throw new UserRejectedRequestError(error as Error)
        }
        throw error
      }
    },
    async disconnect() {
      const provider = (await this.getProvider()) as any
      try {
        await provider?.disconnect()
      } catch (error) {
        // eslint-disable-next-line require-unicode-regexp
        if (!/No matching key/i.test((error as Error).message)) {
          throw error
        }
      } finally {
        if (chainChanged) {
          provider?.removeListener('chainChanged', chainChanged)
          chainChanged = undefined
        }
        if (disconnect) {
          provider?.removeListener('disconnect', disconnect)
          disconnect = undefined
        }
        if (!connect) {
          connect = this.onConnect.bind(this)
          provider?.on('connect', connect)
        }
        if (accountsChanged) {
          provider?.removeListener('accountsChanged', accountsChanged)
          accountsChanged = undefined
        }
        if (sessionDelete) {
          provider?.removeListener('session_delete', sessionDelete)
          sessionDelete = undefined
        }

        this.setRequestedChainsIds([])
      }
    },
    async getAccounts() {
      const provider = (await this.getProvider()) as any

      if (!provider?.session?.namespaces) {
        return []
      }

      const accountsList = provider?.session?.namespaces[ConstantsUtil.CHAIN.EVM]?.accounts

      const accounts = accountsList?.map((account: string) => account.split(':')[2]) ?? []

      return accounts as `0x${string}`[]
    },
    async getProvider({ chainId }: { chainId?: number } = {}) {
      if (!provider_) {
        provider_ = await appKit.getUniversalProvider()
        provider_?.events.setMaxListeners(Number.POSITIVE_INFINITY)
      }

      const activeNamespace = StorageUtil.getActiveNamespace()
      const currentChainId = appKit.getCaipNetwork()?.id

      if (chainId && currentChainId !== chainId && activeNamespace) {
        const storedCaipNetworkId = StorageUtil.getStoredActiveCaipNetworkId()
        const appKitCaipNetworks = appKit?.getCaipNetworks(activeNamespace as ChainNamespace)
        const storedCaipNetwork = appKitCaipNetworks?.find(n => n.id === storedCaipNetworkId)

        if (storedCaipNetwork && storedCaipNetwork.chainNamespace === ConstantsUtil.CHAIN.EVM) {
          await this.switchChain?.({
            chainId: Number(storedCaipNetwork.id),
            addEthereumChainParameter: undefined
          })
        }
      }

      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      return provider_ as Provider
    },
    async getChainId() {
      // 먼저 provider session에서 체인 확인
      const provider = (await this.getProvider()) as any
      const chain = provider.session?.namespaces[ConstantsUtil.CHAIN.EVM]?.chains?.[0]

      if (chain) {
        const chainIdStr = chain.split(':')[1]
        const network = caipNetworks.find(
          (c: any) => String(c.id) === chainIdStr || c.id === Number(chainIdStr)
        )
        if (network) {
          return network.id as number
        }

        return Number(chainIdStr)
      }

      // Provider session이 없으면 AppKit 상태 사용 (기존 로직)
      const chainId = appKit.getCaipNetwork()?.id
      if (chainId) {
        return chainId as number
      }

      // 둘 다 없으면 첫 번째 네트워크
      return (caipNetworks[0]?.id as number) || 1
    },
    async isAuthorized() {
      try {
        const [accounts, provider] = await Promise.all([this.getAccounts(), this.getProvider()])

        // If an account does not exist on the session, then the connector is unauthorized.
        if (!accounts.length) {
          return false
        }

        // If the chains are stale on the session, then the connector is unauthorized.
        const isChainsStale = await this.isChainsStale()
        if (isChainsStale && (provider as any).session) {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          await (provider as any).disconnect().catch(() => {})

          return false
        }

        return true
      } catch {
        return false
      }
    },
    async switchChain({
      addEthereumChainParameter,
      chainId
    }: {
      addEthereumChainParameter?: any
      chainId: number
    }) {
      const provider = (await this.getProvider()) as any
      if (!provider) {
        throw new ProviderNotFoundError()
      }

      const chainToSwitch = caipNetworks.find((x: any) => x.id === chainId)

      if (!chainToSwitch) {
        throw new SwitchChainError(new ChainNotConfiguredError())
      }

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: numberToHex(chainId) }]
        })

        if (chainToSwitch?.caipNetworkId) {
          provider.setDefaultChain(chainToSwitch?.caipNetworkId as string)
        }
        config.emitter.emit('change', { chainId: Number(chainId) })

        const requestedChains = await this['getRequestedChainsIds']()
        this['setRequestedChainsIds']([...requestedChains, chainId])

        return { ...chainToSwitch, id: chainToSwitch.id as number } as any
      } catch (err) {
        const error = err as RpcError

        if (/(?:user rejected)/iu.test(error.message)) {
          throw new UserRejectedRequestError(error)
        }

        try {
          let blockExplorerUrls: string[] | undefined

          if (addEthereumChainParameter?.blockExplorerUrls) {
            blockExplorerUrls = addEthereumChainParameter.blockExplorerUrls
          } else {
            blockExplorerUrls = (chainToSwitch as any).blockExplorers?.default.url
              ? [(chainToSwitch as any).blockExplorers?.default.url]
              : []
          }

          // Use original rpc to prevent leaking project ID
          const rpcUrls = (chainToSwitch as any).rpcUrls?.['chainDefault']?.http || []

          const addEthereumChain = {
            blockExplorerUrls,
            chainId: numberToHex(chainId),
            chainName: (chainToSwitch as any).name,
            iconUrls: addEthereumChainParameter?.iconUrls,
            nativeCurrency: (chainToSwitch as any).nativeCurrency,
            rpcUrls
          } satisfies AddEthereumChainParameter

          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [addEthereumChain]
          })

          const requestedChains = await this['getRequestedChainsIds']()
          this['setRequestedChainsIds']([...requestedChains, chainId])

          return { ...chainToSwitch, id: (chainToSwitch as any).id as number } as any
        } catch (e) {
          throw new UserRejectedRequestError(e as Error)
        }
      }
    },
    onAccountsChanged(accounts: string[]) {
      if (accounts.length === 0) {
        this.onDisconnect(new Error('Accounts changed to empty'))
      } else {
        config.emitter.emit('change', {
          accounts: accounts.map((x: string) => getAddress(x))
        })
      }
    },
    onChainChanged(chain: string) {
      const chainId = Number(chain)

      config.emitter.emit('change', { chainId })
    },
    onConnect(_connectInfo: any) {
      this['setRequestedChainsIds'](caipNetworks.map((x: any) => Number(x.id)))
    },
    async onDisconnect(_error?: Error) {
      this['setRequestedChainsIds']([])
      config.emitter.emit('disconnect')

      const provider = (await this.getProvider()) as any
      if (accountsChanged) {
        provider.removeListener('accountsChanged', accountsChanged)
        accountsChanged = undefined
      }
      if (chainChanged) {
        provider.removeListener('chainChanged', chainChanged)
        chainChanged = undefined
      }
      if (disconnect) {
        provider.removeListener('disconnect', disconnect)
        disconnect = undefined
      }
      if (sessionDelete) {
        provider.removeListener('session_delete', sessionDelete)
        sessionDelete = undefined
      }
      if (!connect) {
        connect = this['onConnect'].bind(this)
        provider.on('connect', connect)
      }
    },
    onDisplayUri(uri: string) {
      config.emitter.emit('message', { type: 'display_uri', data: uri })
    },
    onSessionDelete() {
      this.onDisconnect(new Error('Session deleted'))
    },
    getNamespaceChainsIds() {
      if (!provider_?.session?.namespaces) {
        return []
      }

      const accounts = provider_?.session?.namespaces[ConstantsUtil.CHAIN.EVM]?.accounts

      // eslint-disable-next-line radix
      const chainIds = accounts?.map(account => Number.parseInt(account.split(':')[1] ?? '')) ?? []

      return chainIds
    },

    async getRequestedChainsIds() {
      const chainIds = (await config.storage?.getItem(this.requestedChainsStorageKey)) ?? []

      return [...new Set(chainIds)] as number[]
    },
    /**
     * Checks if the target chains match the chains that were
     * initially requested by the connector for the WalletConnect session.
     * If there is a mismatch, this means that the chains on the connector
     * are considered stale, and need to be revalidated at a later point (via
     * connection).
     *
     * There may be a scenario where a dapp adds a chain to the
     * connector later on, however, this chain will not have been approved or rejected
     * by the wallet. In this case, the chain is considered stale.
     */
    async isChainsStale() {
      if (!isNewChainsStale) {
        return false
      }

      const connectorChains = config.chains.map((x: any) => x.id)

      const namespaceChains = this['getNamespaceChainsIds']()

      if (
        namespaceChains.length &&
        !namespaceChains.some((id: number) => connectorChains.includes(id))
      ) {
        return false
      }

      const requestedChains = await this['getRequestedChainsIds']()

      return !connectorChains.every((id: any) => requestedChains.includes(Number(id)))
    },
    async setRequestedChainsIds(chains: number[]) {
      await config.storage?.setItem(this['requestedChainsStorageKey'], chains)
    },
    get requestedChainsStorageKey() {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      return `${this.id}.requestedChains` as Properties['requestedChainsStorageKey']
    }
  }))
}

walletConnect.type = 'walletConnect' as const
