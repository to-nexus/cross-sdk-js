/* eslint-disable max-params */
import { WcHelpersUtil } from '@to-nexus/appkit'
import { type CaipNetwork, type CustomData, isReownName } from '@to-nexus/appkit-common'
import {
  ConstantsUtil,
  type EstimateGasTransactionArgs,
  type Provider,
  type ReadContractArgs,
  type SendTransactionArgs,
  type SignEIP712Args,
  type SignTypedDataV4Args,
  type WriteContractArgs
} from '@to-nexus/appkit-core'
import {
  BrowserProvider,
  Contract,
  InfuraProvider,
  JsonRpcSigner,
  ethers,
  formatUnits,
  hexlify,
  isHexString,
  parseUnits,
  toUtf8Bytes
} from 'ethers'
import type { TransactionRequest } from 'ethers'
import { getBigInt, toQuantity } from 'ethers/utils'


async function pollingTx(hash: `0x${string}`, signer: JsonRpcSigner) {
  return await new Promise(
    (resolve: (hash: `0x${string}`) => void, reject: (error: Error) => void) => {
      console.log(`pollingTx with hash: ${hash}`)
      const timeouts = [1000, 100]

      const checkTx = async () => {
        try {
          const tx = await signer.provider.getTransaction(hash)

          if (tx != null) {
            console.log(
              `tx found: ${JSON.stringify(tx, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}`
            )
            resolve(hash)

            return
          }
        } catch (error) {
          console.log(`pollingTx error: ${error} just return result with hash`)
          resolve(hash)
        }

        // Wait another 4 seconds
        signer.provider._setTimeout(() => {
          checkTx()
        }, timeouts.pop() || 4000)
      }
      checkTx()
    }
  )
}

export const EthersMethods = {
  signMessage: async (
    message: string,
    provider: Provider,
    address: string,
    customData?: CustomData
  ) => {
    if (!provider) {
      throw new Error('signMessage - provider is undefined')
    }
    console.log('###?? signMessage : start EthersMethods : ', new Date().toLocaleTimeString())
    const hexMessage = isHexString(message) ? message : hexlify(toUtf8Bytes(message))
    const signature = await provider.request({
      method: 'personal_sign',
      params: [hexMessage, address, customData]
    })
    console.log('###?? signMessage : end EthersMethods : ', new Date().toLocaleTimeString())

    return signature as `0x${string}`
  },

  /**
   * @description Generic EIP-712 typed data signing method
   * 
   * This method replaces the limited signEIP712 function, which was specifically designed
   * for ERC-2612 permit signatures only. signTypedDataV4 is a universal solution that can
   * handle any EIP-712 structured data from servers or client-side generation.
   * 
   * Key improvements over signEIP712:
   * - Accepts any EIP-712 structure, not just permit signatures  
   * - Works with server-generated typed data or client-generated data
   * - Follows standard eth_signTypedData_v4 RPC specification
   * - Maintains backward compatibility by keeping signEIP712 intact
   * 
   * @param paramsData - Tuple of [signerAddress, typedDataStructure] matching RPC params
   * @param provider - Ethereum provider instance for wallet communication
   * @param customData - Optional custom data to pass to the wallet
   * @returns Promise resolving to the signature string
   * 
   * @example
   * // Using pre-formatted typed data (e.g., from API response)
   * const apiResponse = await fetch('/api/signature-request');
   * const signature = await EthersMethods.signTypedDataV4(
   *   apiResponse.data.params,
   *   provider,
   *   customData
   * );
   * 
   * @example  
   * // Using manually constructed typed data
   * const paramsData = {
   *   domain: { name: "MyApp", version: "1", chainId: 1, verifyingContract: "0x..." },
   *   types: { EIP712Domain: [...], MyType: [...] },
   *   primaryType: "MyType",
   *   message: { field1: "value1", field2: 123 }
   * };
   * const signature = await EthersMethods.signTypedDataV4(paramsData, provider);
   */
  signTypedDataV4: async (
    paramsData: SignTypedDataV4Args,
    provider: Provider,
    customData?: CustomData
  ) => {
    if (!provider) {
      throw new Error('signTypedDataV4 - provider is undefined')
    }
    if (!paramsData) {
      throw new Error('signTypedDataV4 - paramsData is required')
    }

    try {
      console.log(`signTypedDataV4 - paramsData: ${JSON.stringify(paramsData, null, 2)}`)

      const signature = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [paramsData, customData]
      })

      return signature as `0x${string}`
    } catch (error) {
      console.error('signTypedDataV4 error:', error)
      throw error
    }
  },

  /**
   * @description Legacy EIP-712 signing method for ERC-2612 permit signatures only
   * 
   * ⚠️ DEPRECATED: This method is limited to ERC-2612 permit signatures and should not be used
   * for new implementations. Use signTypedDataV4 instead for a generic, standards-compliant solution.
   * 
   * This method was originally designed specifically for token permit signatures and has several limitations:
   * - Hardcoded for ERC-2612 permit structure only
   * - Cannot handle arbitrary EIP-712 typed data
   * - Not compatible with server-generated typed data structures
   * - Limited flexibility for different use cases
   * 
   * @param data - ERC-2612 permit-specific signature data  
   * @param provider - Ethereum provider instance
   * @returns Promise resolving to the permit signature
   * 
   * @deprecated Use signTypedDataV4 for new implementations
   * @see signTypedDataV4 for the improved, generic alternative
   */
  signEIP712: async (data: SignEIP712Args, provider: Provider) => {
    if (!provider) {
      throw new Error('signEIP712 - provider is undefined')
    }

    try {
      const {
        contractAddress,
        fromAddress,
        spenderAddress,
        value,
        name,
        nonce,
        deadline,
        customData
      } = data

      const domain = {
        name,
        version: '1',
        chainId: data.chainId,
        verifyingContract: contractAddress
      }

      console.log(`signEIP712 - domain: ${JSON.stringify(domain)}`)

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const message = {
        owner: fromAddress,
        spender: spenderAddress,
        nonce: toQuantity(getBigInt(nonce)),
        value: toQuantity(getBigInt(value)),
        deadline: toQuantity(getBigInt(deadline))
      }

      console.log(`signEIP712 with hexSign: ${JSON.stringify(message)}`)

      const signature = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [{ domain, types, message }, customData]
      })

      return signature as `0x${string}`
    } catch (error) {
      console.log(`signEIP712 error: ${error}`)
      throw error
    }
  },

  estimateGas: async (
    data: EstimateGasTransactionArgs,
    provider: Provider,
    address: string,
    networkId: number
  ) => {
    if (!provider) {
      throw new Error('estimateGas - provider is undefined')
    }
    if (!address) {
      throw new Error('estimateGas - address is undefined')
    }
    if (data.chainNamespace && data.chainNamespace !== 'eip155') {
      throw new Error('estimateGas - chainNamespace is not eip155')
    }

    const txParams = {
      from: data.address,
      to: data.to,
      data: data.data,
      type: 0
    }
    const browserProvider = new BrowserProvider(provider, networkId)
    const signer = new JsonRpcSigner(browserProvider, address)

    return await signer.estimateGas(txParams)
  },

  sendTransaction: async (
    data: SendTransactionArgs,
    provider: Provider,
    address: string,
    networkId: number
  ) => {
    if (!provider) {
      throw new Error('sendTransaction - provider is undefined')
    }
    if (!address) {
      throw new Error('sendTransaction - address is undefined')
    }
    if (data.chainNamespace && data.chainNamespace !== 'eip155') {
      throw new Error('sendTransaction - chainNamespace is not eip155')
    }
    const type = data.type ?? ConstantsUtil.TRANSACTION_TYPE.LEGACY
    if (
      type !== ConstantsUtil.TRANSACTION_TYPE.LEGACY &&
      type !== ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
    ) {
      throw new Error('sendTransaction - invalid transaction type')
    }

    if (data) {
      console.log(`sendTransaction - data: `, data)
    }
    let txParams: TransactionRequest = {
      to: data.to,
      value: data.value,
      data: data.data
    }

    const browserProvider = new BrowserProvider(provider, networkId)
    const signer = new JsonRpcSigner(browserProvider, address)
    const from = await signer.getAddress()

    const gasLimit =
      data.gas ??
      (await browserProvider.estimateGas({ ...txParams, from: await signer.getAddress() }))

    txParams = {
      ...txParams,
      gasLimit
    }

    if (type === ConstantsUtil.TRANSACTION_TYPE.LEGACY) {
      const gasPrice =
        data.gasPrice ?? (await browserProvider.getFeeData()).gasPrice ?? BigInt(2000000000)
      txParams = {
        ...txParams,
        gasPrice
      }
    } else if (type === ConstantsUtil.TRANSACTION_TYPE.DYNAMIC) {
      const maxFee =
        data.maxFee ?? (await browserProvider.getFeeData()).maxFeePerGas ?? BigInt(3200000000)
      const maxPriorityFee =
        data.maxPriorityFee ??
        (await browserProvider.getFeeData()).maxPriorityFeePerGas ??
        BigInt(2000000000)
      txParams = {
        ...txParams,
        maxFeePerGas: maxFee,
        maxPriorityFeePerGas: maxPriorityFee
      }
    }

    const txToSign = { ...txParams, from }
    const hexSign = browserProvider.getRpcTransaction(txToSign)
    console.log('###?? sendTransaction : hexSign : ', hexSign)
    console.log('Provider:', provider)
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [hexSign, data.customData]
    })
    console.log('###?? sendTransaction : hash : ', hash)

    return await pollingTx(hash as `0x${string}`, signer)
  },

  writeContract: async (
    data: WriteContractArgs,
    provider: Provider,
    address: string,
    chainId: number
  ) => {
    if (!provider) {
      throw new Error('writeContract - provider is undefined')
    }
    if (!address) {
      throw new Error('writeContract - address is undefined')
    }
    const type = data.type ?? ConstantsUtil.TRANSACTION_TYPE.LEGACY
    if (
      type !== ConstantsUtil.TRANSACTION_TYPE.LEGACY &&
      type !== ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
    ) {
      throw new Error('sendTransaction - invalid transaction type')
    }

    const browserProvider = new BrowserProvider(provider, chainId)
    const signer = new JsonRpcSigner(browserProvider, address)
    const contract = new Contract(data.contractAddress, data.abi, signer)
    if (!contract || !data.method) {
      throw new Error('Contract method is undefined')
    }

    const method = contract[data.method]
    if (method) {
      const txContract = await method.populateTransaction(...data.args)
      const gasLimit =
        data.gas ??
        (await browserProvider.estimateGas({
          ...txContract,
          from: await signer.getAddress()
        }))
      const from = await signer.getAddress()
      let txToSign = { ...txContract, from, gasLimit }

      if (data.type === ConstantsUtil.TRANSACTION_TYPE.LEGACY) {
        const gasPrice =
          data.gasPrice ?? (await browserProvider.getFeeData()).gasPrice ?? BigInt(2000000000)
        txToSign = {
          ...txToSign,
          gasPrice
        }
      } else if (data.type === ConstantsUtil.TRANSACTION_TYPE.DYNAMIC) {
        const maxFee =
          data.maxFee ?? (await browserProvider.getFeeData()).maxFeePerGas ?? BigInt(3200000000)
        const maxPriorityFee =
          data.maxPriorityFee ??
          (await browserProvider.getFeeData()).maxPriorityFeePerGas ??
          BigInt(2000000000)
        txToSign = {
          ...txToSign,
          maxFeePerGas: maxFee,
          maxPriorityFeePerGas: maxPriorityFee
        }
      }

      const hexSign = browserProvider.getRpcTransaction(txToSign)

      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [hexSign, data.customData]
      })

      return await pollingTx(hash as `0x${string}`, signer)
    }
    throw new Error('Contract method is undefined')
  },

  readContract: async (data: ReadContractArgs, provider: Provider, chainId: number) => {
    if (!provider) {
      throw new Error('writeContract - provider is undefined')
    }

    const browserProvider = new BrowserProvider(provider, chainId)
    const contract = new Contract(data.contractAddress, data.abi, browserProvider)
    if (!contract || !data.method) {
      throw new Error('Contract method is undefined')
    }
    const method = contract[data.method]
    if (method) {
      const result = await method(...data.args)

      return result
    }
    throw new Error('Contract method is undefined')
  },

  getEnsAddress: async (value: string, caipNetwork: CaipNetwork) => {
    try {
      const chainId = Number(caipNetwork.id)
      let ensName: string | null = null
      let wcName: boolean | string = false

      if (isReownName(value)) {
        wcName = (await WcHelpersUtil.resolveReownName(value)) || false
      }

      // If on mainnet, fetch from ENS
      if (chainId === 1) {
        const ensProvider = new InfuraProvider('mainnet')
        ensName = await ensProvider.resolveName(value)
      }

      return ensName || wcName || false
    } catch {
      return false
    }
  },

  getEnsAvatar: async (value: string, chainId: number) => {
    if (chainId === 1) {
      const ensProvider = new InfuraProvider('mainnet')
      const avatar = await ensProvider.getAvatar(value)

      return avatar || false
    }

    return false
  },

  parseWalletCapabilities: (str: string) => {
    try {
      return JSON.parse(str)
    } catch (error) {
      throw new Error('Error parsing wallet capabilities')
    }
  },

  parseUnits,
  formatUnits
}
