import { erc20ABI } from '../contracts/erc20.js'
import { swapABI } from '../contracts/swap.js'
import { usdtABI } from '../contracts/usdt.js'
import { ConstantsUtil } from './ConstantsUtil.js'

export const ContractUtil = {
  getERC20Abi: (contractAddress: string) => {
    // @ts-expect-error Check if the address is a USDT contract
    if (ConstantsUtil.USDT_CONTRACT_ADDRESSES.includes(contractAddress)) {
      return usdtABI
    }

    return erc20ABI
  },

  getSwapAbi: () => swapABI
}
