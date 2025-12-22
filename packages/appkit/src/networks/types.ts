export interface EthChainInfo {
  chain: string
  chain_id: number
  currency_decimals: number
  currency_name: string
  currency_symbol: string
  explorer_url: string
  info_url: string
  name: string
  network_id: number
  rpc: string
  short_name: string
  testnet: boolean
}

export interface ChainApiResponse {
  code: number
  message: string
  data: EthChainInfo[]
}

