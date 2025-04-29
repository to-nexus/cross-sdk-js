/* eslint-disable max-params */
import { WcHelpersUtil } from '@to-nexus/appkit'
import { type CaipNetwork, type CustomData, isReownName } from '@to-nexus/appkit-common'
import type {
  EstimateGasTransactionArgs,
  Provider,
  ReadContractArgs,
  SendTransactionArgs,
  SignEIP712Args,
  WriteContractArgs
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
    const hexMessage = isHexString(message) ? message : hexlify(toUtf8Bytes(message))
    const signature = await provider.request({
      method: 'personal_sign',
      params: [hexMessage, address, customData]
    })

    return signature as `0x${string}`
  },

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

    if (data) {
      console.log(`sendTransaction - data: `, data)
    }
    const txParams: TransactionRequest = {
      to: data.to,
      value: data.value,
      data: data.data,
      gasLimit: data.gas,
      ...(data.gasPrice && { gasPrice: data.gasPrice }),
      ...(data.maxFee && { maxFeePerGas: data.maxFee }),
      ...(data.maxPriorityFee && { maxPriorityFeePerGas: data.maxPriorityFee }),
      type: 0
    }

    const browserProvider = new BrowserProvider(provider, networkId)
    const signer = new JsonRpcSigner(browserProvider, address)

    /*
     * Const gasLimit = txParams.gasLimit ?? await browserProvider.estimateGas({ ...txParams, from: await signer.getAddress()});
     * const gasPrice = txParams.gasPrice ?? (await browserProvider.getFeeData()).gasPrice;
     */
    const from = await signer.getAddress()
    const txToSign = { ...txParams, from }
    const hexSign = browserProvider.getRpcTransaction(txToSign)

    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [hexSign, data.customData]
    })

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
    const browserProvider = new BrowserProvider(provider, chainId)
    const signer = new JsonRpcSigner(browserProvider, address)
    const contract = new Contract(data.contractAddress, data.abi, signer)
    if (!contract || !data.method) {
      throw new Error('Contract method is undefined')
    }
    const method = contract[data.method]
    if (method) {
      const txContract = await method.populateTransaction(...data.args)
      const gasLimit = await browserProvider.estimateGas({
        ...txContract,
        from: await signer.getAddress()
      })
      const from = await signer.getAddress()
      const txToSign = { ...txContract, from, gasLimit }
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
