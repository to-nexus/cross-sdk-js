import {
  mainnet, 
  crossTestnet,
  AccountController,
  ConnectionController,
  SendController,
  initCrossSdk,
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useDisconnect,
} from '@cross/sdk/react'

import type { WriteContractArgs, SendTransactionArgs } from '@cross/sdk/react'
import { sampleErc20ABI } from '../contracts/sample-erc20';
import { sampleErc721ABI } from '../contracts/sample-erc721';
import { useEffect, useState } from 'react';
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
  function handleConnect() {
    appKit.connect()
  }

  async function handleDisconnect() {
    try {
      await disconnect()
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  function handleSwitchNetwork() {
    switchNetwork(crossTestnet)
  }

  // used for sending custom transaction
  async function handleSendTransaction() {

    if (!contractArgs) {
      alert('no contract args set')
      return
    }

    const { fromAddress, contractAddress, args, method, abi, chainNamespace } = contractArgs;

    const resTx = await ConnectionController.writeContract({
      fromAddress,
      contractAddress,
      args,
      method,
      abi,
      chainNamespace,
      customData: {
        activity: 'You are about to send custom transaction to the contract.',
        currentFormat: 'This is a JSON formatted custom data.',
        providedFormat: 'Plain text(string), HTML(string), JSON(key value object) are supported.',
        txTime: new Date().toISOString(),
        randomValue: uuidv4(),
      }
    })

    alert(`resTx: ${JSON.stringify(resTx)}`)

    // generate new tokenId for next NFT
    const uuidHex = uuidv4().replace(/-/g, "");
    const tokenId = BigInt(`0x${uuidHex}`).toString();
    const newArgs = [
      FROM_ADDRESS as `0x${string}`,
      tokenId
    ]

    setContractArgs({...contractArgs, args: newArgs})
  }

  // used for sending CROSS
  async function handleSendNative() {

    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    const resTx = await SendController.sendNativeToken({
      receiverAddress: RECEIVER_ADDRESS,
      sendTokenAmount: SEND_CROSS_AMOUNT, // in eth (not wei)
      decimals: '18',
      customData: "You are about to send 1 CROSS to the receiver address. This is plain text formatted custom data."
    })
    alert(`resTx: ${JSON.stringify(resTx)}`)
  }

  // used for sending any of game tokens
  async function handleSendERC20Token() {

    if (!account?.isConnected) {
      alert('Please connect wallet first.')
      return
    }

    const resTx = await SendController.sendERC20Token({
      receiverAddress: RECEIVER_ADDRESS,
      tokenAddress: ERC20_CAIP_ADDRESS,
      sendTokenAmount: SEND_ERC20_AMOUNT, // in eth (not wei)
      decimals: '18',
      customData: `<DOCTYPE html><html><head><title>Game Developer can add custom data to the transaction</title></head><body><h1>Game Developer can add custom data to the transaction</h1><p>This is a HTML text formatted custom data.</p></body></html>`
    })
    alert(`resTx: ${JSON.stringify(resTx)}`)
    getBalanceOfERC20({showResult: false});
  }

  async function getBalanceOfNative () {
    const balance = account?.balance
    alert(`CROSS balance: ${balance}`)
  }

  async function getBalanceOfERC20 ({showResult = true}: {showResult?: boolean} = {}) {

    const amount = await ConnectionController.readContract({
      contractAddress: ERC20_ADDRESS,
      method: 'balanceOf',
      abi: sampleErc20ABI,
      args: [FROM_ADDRESS as `0x${string}`]
    }) as string
    console.log(`getBalanceOfERC20 - amount: ${amount}`)

    const balance = account?.tokenBalance?.map((token) => {
      if (token.address === ERC20_ADDRESS.toLowerCase()) {  // ERC20_ADDRESS is checksum address, so convert to lowercase
        return {
          ...token,
          quantity: {
            ...token.quantity,
            numeric: amount
          }
        };
      }
      return token;
    });

    if (!balance) {
      console.log('balance not found')
      return
    }
    await AccountController.updateTokenBalance(balance)
    if (showResult) 
      alert(`updated erc20 balance: ${JSON.stringify(account?.tokenBalance?.find((token) => token.address === ERC20_ADDRESS.toLowerCase()), (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}`)
  }

  async function getBalanceOfNFT () {
    const amount = await ConnectionController.readContract({
      contractAddress: ERC721_ADDRESS,
      method: 'balanceOf',
      abi: sampleErc721ABI,
      args: [FROM_ADDRESS as `0x${string}`]
    })

    alert(`erc721 balance: ${amount}`)
  }

  useEffect(()=> {
    (() => {
      if (contractArgs || !FROM_ADDRESS || !network?.caipNetwork?.chainNamespace)
        return
  
      const uuidHex = uuidv4().replace(/-/g, "");
      const tokenId = BigInt(`0x${uuidHex}`).toString();
      console.log(`tokenId to create next NFT: ${tokenId}`)

      const buildArgs: WriteContractArgs = {
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
  
      setContractArgs(buildArgs)
    })()
    
  }, [FROM_ADDRESS, network?.caipNetwork?.chainNamespace])

  return (
    <div>
      <div className="action-button-list">
        <button onClick={handleConnect}>{account?.isConnected ? 'Connected' : 'Connect'}</button>
        <button onClick={handleDisconnect}>Disconnect</button>
        <button onClick={handleSwitchNetwork}>Switch to Cross</button>
      </div>
      <div className="action-button-list" style={{marginTop: '10px'}}>
        <button onClick={handleSendNative}>Send 1 CROSS</button>
        <button onClick={handleSendERC20Token}>Send 1 ERC20</button>
        <button onClick={handleSendTransaction}>Send Custom Transaction</button>
      </div>
      <div className="action-button-list" style={{marginTop: '10px'}}>
        <button onClick={getBalanceOfNative}>Get Balance of CROSS</button>
        <button onClick={()=>getBalanceOfERC20()}>Get Balance of ERC20</button>
        <button onClick={getBalanceOfNFT}>Get Balance of NFT</button>
      </div>
    </div>
  )
}

export default ActionButtonList
