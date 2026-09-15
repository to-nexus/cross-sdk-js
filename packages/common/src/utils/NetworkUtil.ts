import type { CaipNetwork, CaipNetworkId, ChainNamespace } from './TypeUtil.js'

// Values a wallet may report before its internal network state is initialized
const PLACEHOLDER_CHAIN_IDS = ['', 'nan', 'undefined', 'null']

export const NetworkUtil = {
  caipNetworkIdToNumber(caipnetworkId?: CaipNetworkId) {
    return caipnetworkId ? Number(caipnetworkId.split(':')[1]) : undefined
  },

  /**
   * Guards against chain ids a wallet reports before it finished initializing
   * (0, NaN, empty string). Non-numeric ids (solana, bip122) are left as-is.
   */
  isValidChainId(chainId: string | number | undefined | null) {
    if (typeof chainId === 'number') {
      return Number.isFinite(chainId) && chainId > 0
    }

    if (typeof chainId !== 'string') {
      return false
    }

    const value = chainId.trim()

    if (PLACEHOLDER_CHAIN_IDS.includes(value.toLowerCase())) {
      return false
    }

    // Zero in any notation ('0', '00', '0x0') is never a real chain id
    if (/^(?:0x)?0+$/iu.test(value)) {
      return false
    }

    // Decimal ids (eip155) must be positive
    if (/^-?\d+$/u.test(value)) {
      return Number(value) > 0
    }

    /*
     * Anything else is a non-decimal id (solana base58, bip122 block hash) —
     * leave it alone, only placeholders are being filtered here.
     */
    return true
  },

  isValidCaipNetworkId(caipNetworkId: string | undefined | null) {
    if (typeof caipNetworkId !== 'string') {
      return false
    }

    const [namespace, ...rest] = caipNetworkId.split(':')
    const chainId = rest.join(':')

    if (!namespace || rest.length !== 1) {
      return false
    }

    return this.isValidChainId(chainId)
  },

  parseEvmChainId(chainId: string | number) {
    return typeof chainId === 'string'
      ? this.caipNetworkIdToNumber(chainId as CaipNetworkId)
      : chainId
  },

  getNetworksByNamespace(networks: CaipNetwork[] | undefined, namespace: ChainNamespace) {
    return networks?.filter(network => network.chainNamespace === namespace) || []
  },

  getFirstNetworkByNamespace(networks: CaipNetwork[] | undefined, namespace: ChainNamespace) {
    return this.getNetworksByNamespace(networks, namespace)[0]
  }
}
