import type { SessionTypes } from '@walletconnect/types'
import type { Namespace, NamespaceConfig } from '@to-nexus/universal-provider'

import type { CaipNetwork, CaipNetworkId, ChainNamespace } from '@to-nexus/appkit-common'
import { EnsController } from '@to-nexus/appkit-core'

import { solana, solanaDevnet } from '../networks/index.js'

export const WcHelpersUtil = {
  getMethodsByChainNamespace(chainNamespace: ChainNamespace): string[] {
    switch (chainNamespace) {
      case 'solana':
        return [
          'solana_signMessage',
          'solana_signTransaction',
          'solana_requestAccounts',
          'solana_getAccounts',
          'solana_signAllTransactions',
          'solana_signAndSendTransaction'
        ]
      case 'eip155':
        return [
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
          // EIP-5792
          'wallet_getCallsStatus',
          'wallet_showCallsStatus',
          'wallet_sendCalls',
          'wallet_getCapabilities',
          // EIP-7715
          'wallet_grantPermissions',
          'wallet_revokePermissions',
          //EIP-7811
          'wallet_getAssets'
        ]
      case 'bip122':
        return ['sendTransfer', 'signMessage', 'signPsbt', 'getAccountAddresses']
      default:
        return []
    }
  },

  createNamespaces(caipNetworks: CaipNetwork[]): NamespaceConfig {
    return caipNetworks.reduce<NamespaceConfig>((acc, chain) => {
      const { id, chainNamespace, rpcUrls } = chain
      const rpcUrl = rpcUrls.default.http[0]

      const methods = this.getMethodsByChainNamespace(chainNamespace)

      if (!acc[chainNamespace]) {
        acc[chainNamespace] = {
          methods,
          events: ['accountsChanged', 'chainChanged'],
          chains: [],
          rpcMap: {}
        } satisfies Namespace
      }

      const caipNetworkId = `${chainNamespace}:${id}`

      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      const namespace = acc[chainNamespace]

      namespace.chains.push(caipNetworkId)

      // Workaround for wallets that only support deprecated Solana network ID
      switch (caipNetworkId) {
        case solana.caipNetworkId:
          namespace.chains.push(solana.deprecatedCaipNetworkId)
          break
        case solanaDevnet.caipNetworkId:
          namespace.chains.push(solanaDevnet.deprecatedCaipNetworkId)
          break
        default:
      }

      if (namespace?.rpcMap && rpcUrl) {
        namespace.rpcMap[id] = rpcUrl
      }

      return acc
    }, {})
  },

  resolveReownName: async (name: string) => {
    const wcNameAddress = await EnsController.resolveName(name)
    const networkNameAddresses = Object.values(wcNameAddress?.addresses) || []

    return networkNameAddresses[0]?.address || false
  },

  getChainsFromNamespaces(namespaces: SessionTypes.Namespaces = {}): CaipNetworkId[] {
    return Object.values(namespaces).flatMap<CaipNetworkId>(namespace => {
      const chains = (namespace.chains || []) as CaipNetworkId[]
      const accountsChains = namespace.accounts.map(account => {
        const [chainNamespace, chainId] = account.split(':')

        return `${chainNamespace}:${chainId}` as CaipNetworkId
      })

      return Array.from(new Set([...chains, ...accountsChains]))
    })
  },

  isSessionEventData(data: unknown): data is WcHelpersUtil.SessionEventData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'topic' in data &&
      'params' in data &&
      typeof data.params === 'object' &&
      data.params !== null &&
      'chainId' in data.params &&
      'event' in data.params &&
      typeof data.params.event === 'object' &&
      data.params.event !== null
    )
  }
}

export namespace WcHelpersUtil {
  export type SessionEventData = {
    id: string
    topic: string
    params: { chainId: string; event: { data: unknown; name: string } }
  }
}
