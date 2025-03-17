import {
  mainnet, 
  crossTestnet,
  SendController,
  initCrossSdk,
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useDisconnect,
  AccountController,
  ConnectionController
} from '@cross/sdk/react'

import type { WriteContractArgs, SendTransactionArgs } from '@cross/sdk/react'
import { sampleErc20ABI } from '../contracts/sample-erc20';
import { sampleErc721ABI } from '../contracts/sample-erc721';
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 }from "uuid";

// Your unique project id provided by Cross Team. If you don't have one, please contact us.
const projectId = import.meta.env['VITE_PROJECT_ID']
// Initialize SDK here
initCrossSdk(projectId);

export function ActionButtonList() {
  const appKit = useAppKit()
  const account = useAppKitAccount()
  const network = useAppKitNetwork()
  const { disconnect } = useDisconnect()
  const { switchNetwork } = useAppKitNetwork()
  const [ contractArgs, setContractArgs ] = useState<WriteContractArgs | null>(null)
  
  // erc20 token contract address
  const ERC20_ADDRESS = "0x35Af8eF840Eda3e93FC8F5167dbd8FF0D6F96580"
  // define decimals of erc20 token (ERC20 standard is 18)
  const ERC20_DECIMALS = 18;
  // erc20 token contract address in caip format - eip155:{chainId}:{address}
  const ERC20_CAIP_ADDRESS = `${network.caipNetworkId}:${ERC20_ADDRESS}`
    // erc721 token contract address
  const ERC721_ADDRESS = "0x219eF07b171282040996AbA38b73c465085FE9E1"
  // address to send erc20 token or cross
  const RECEIVER_ADDRESS = "0x920A31f0E48739C3FbB790D992b0690f7F5C42ea"
  // address of wallet owner
  const FROM_ADDRESS = AccountController.state.address as `0x${string}`
  // amount of erc20 token in eth to send
  const SEND_ERC20_AMOUNT = 1
  // amount of erc20 token in wei to send
  const SEND_ERC20_AMOUNT_IN_WEI = ConnectionController.parseUnits(SEND_ERC20_AMOUNT.toString(), ERC20_DECIMALS)
  // amount of cross to send
  const SEND_CROSS_AMOUNT = 1

  // used for connecting wallet
  function connectWallet() {
    appKit.connect()
  }

  // used for sending custom transaction
  async function handleSendTransaction() {

    if (!contractArgs) {
      alert('no contract args set')
      return
    }

    const { fromAddress, contractAddress, args, method, abi, chainNamespace } = contractArgs;

    const txHash = await ConnectionController.writeContract({
      fromAddress,
      contractAddress,
      args,
      method,
      abi,
      chainNamespace
    })

    alert(`Transaction sent: ${txHash}`)
  }
  // used for sending CROSS
  async function handleSendNative() {

    await SendController.sendNativeToken({
      receiverAddress: RECEIVER_ADDRESS,
      sendTokenAmount: SEND_CROSS_AMOUNT, // in eth (not wei)
      decimals: '18',
    })
    alert(`Send Cross completed. Now fetch token balance.`)
    AccountController.fetchTokenBalance()
  }

  // used for sending any of game tokens
  async function handleSendERC20Token() {

    await SendController.sendERC20Token({
      receiverAddress: RECEIVER_ADDRESS,
      tokenAddress: ERC20_CAIP_ADDRESS,
      sendTokenAmount: SEND_ERC20_AMOUNT, // in eth (not wei)
      decimals: '18',
    })
    alert(`Send ERC20 completed. Now fetch token balance.`)
    AccountController.fetchTokenBalance()
  }

  function switchToNetwork() {
    switchNetwork(crossTestnet)
  }

  async function handleDisconnect() {
    try {
      await disconnect()
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  useEffect(()=> {
    (() => {
      if (contractArgs || !FROM_ADDRESS || !network?.caipNetwork?.chainNamespace)
        return
  
      const uuidHex = uuidv4().replace(/-/g, ""); // '-' 제거하여 32자리 16진수 값으로 변환
      const tokenId = BigInt(`0x${uuidHex}`).toString(); // 16진수를 10진수로 변환
      console.log(`nft tokenId: ${tokenId}`)

      const args: WriteContractArgs = {
        fromAddress: FROM_ADDRESS,
        contractAddress: ERC721_ADDRESS,
        args: [   // arguments to pass to the specific method of contract
          FROM_ADDRESS as `0x${string}`,  // address of token that will take the NFT
          tokenId
        ],  
        method: 'mint',   // method to call on the contract
        abi: sampleErc721ABI,         // abi of the contract
        chainNamespace: network?.caipNetwork?.chainNamespace
      }
  
      setContractArgs(args)
    })()
    
  }, [FROM_ADDRESS, network?.caipNetwork?.chainNamespace])

  return (
    <div>
      <div className="action-button-list">
        <button onClick={connectWallet}>{account?.isConnected ? 'Connected' : 'Connect'}</button>
        <button onClick={handleDisconnect}>Disconnect</button>
        <button onClick={switchToNetwork}>Switch to Cross</button>
      </div>
      <div className="action-button-list" style={{marginTop: '10px'}}>
        <button onClick={handleSendNative}>Send 1 CROSS</button>
        <button onClick={handleSendERC20Token}>Send 1 ERC20 Token</button>
        <button onClick={handleSendTransaction}>Send Custom Transaction</button>
      </div>
    </div>
  )
}

export default ActionButtonList
