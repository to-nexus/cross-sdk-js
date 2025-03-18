/* eslint-disable max-params */
import {
  BrowserProvider,
  Contract,
  InfuraProvider,
  JsonRpcSigner,
  formatUnits,
  hexlify,
  isHexString,
  parseUnits,
  toUtf8Bytes
} from 'ethers'

import { WcHelpersUtil } from '@reown/appkit'
import { type CaipNetwork, isReownName } from '@reown/appkit-common'
import type {
  EstimateGasTransactionArgs,
  Provider,
  ReadContractArgs,
  SendTransactionArgs,
  WriteContractArgs
} from '@reown/appkit-core'
import type { TransactionRequest } from 'ethers'

async function pollingTx(hash: `0x${string}`, provider: Provider, signer: JsonRpcSigner) {
  return await (new Promise((resolve: (hash: `0x${string}`) => void, reject: (error: Error) => void) => {
    console.log(`pollingTx with hash: ${hash}`)
    const timeouts = [ 1000, 100 ];

    const checkTx = async () => {
        try {
            const tx = await signer.provider.getTransaction(hash);

            if (tx != null) {
                console.log(`tx found: ${JSON.stringify(tx, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)  }`)
                resolve(hash as `0x${string}`);
                return;
            }

        } catch (error) {
            console.log(`pollingTx error: ${error} just return result with hash`)
            resolve(hash as `0x${string}`)
        }

        // Wait another 4 seconds
        signer.provider._setTimeout(() => { checkTx(); }, timeouts.pop() || 4000);
    };
    checkTx();
  }));
}

export const EthersMethods = {
  signMessage: async (message: string, provider: Provider, address: string) => {
    if (!provider) {
      throw new Error('signMessage - provider is undefined')
    }
    const hexMessage = isHexString(message) ? message : hexlify(toUtf8Bytes(message))
    const signature = await provider.request({
      method: 'personal_sign',
      params: [hexMessage, address]
    })

    return signature as `0x${string}`
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
    const txParams: TransactionRequest = {
      to: data.to,
      value: data.value,
      data: data.data,
      type: 0,
      customData: data.customData
    }

    const browserProvider = new BrowserProvider(provider, networkId)
    const signer = new JsonRpcSigner(browserProvider, address)

    const gasLimit = txParams.gasLimit ?? await browserProvider.estimateGas({ ...txParams, from: await signer.getAddress()});
    const from = await signer.getAddress()
    const txToSign = { ...txParams, from, gasLimit }
    const hexSign = browserProvider.getRpcTransaction(txToSign)

    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [ hexSign, txParams.customData ]
    }) as `0x${string}`

    return await pollingTx(hash, provider, signer)

    // const txResponse = await signer.sendTransaction(txParams)
    // console.log('txResponse', JSON.stringify(txResponse, (key, value) => typeof value === 'bigint' ? value.toString() : value))
    // const txReceipt = await txResponse.wait()
    // return (txReceipt?.hash as `0x${string}`) || null
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
      const gasLimit = await browserProvider.estimateGas({ ...txContract, from: await signer.getAddress()});
      const from = await signer.getAddress()
      const txToSign = { ...txContract, from, gasLimit }
      const hexSign = browserProvider.getRpcTransaction(txToSign)

      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [ hexSign, data.customData ]
      }) as `0x${string}`
  
      return await pollingTx(hash, provider, signer)
    }
    throw new Error('Contract method is undefined')
  },

  readContract: async (
    data: ReadContractArgs,
    provider: Provider,
    chainId: number
  ) => {
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
  formatUnits,
}
