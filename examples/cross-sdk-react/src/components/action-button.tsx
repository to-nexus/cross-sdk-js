import { mainnet, crossTestnet } from '@reown/appkit/networks'

import {
  SendController,
  initCrossSdk,
  useAppKit,
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
  useAppKitNetwork,
  useDisconnect,
  AccountController
} from '@cross/sdk/react'

import type { SendTransactionArgs } from '@cross/sdk/react'

const projectId = import.meta.env['VITE_PROJECT_ID'] // this is a public projectId only to use on localhost
// Initialize SDK here
initCrossSdk(projectId);

export function ActionButtonList() {
  const appKit = useAppKit()
  const account = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { switchNetwork } = useAppKitNetwork()
  
  // erc20 token contract address in caip format - eip155:{chainId}:{address}
  const ZENNY_ADDRESS = "eip155:612044:0x35Af8eF840Eda3e93FC8F5167dbd8FF0D6F96580"
  // address to send erc20 token or cross
  const RECEIVER_ADDRESS = "0x920A31f0E48739C3FbB790D992b0690f7F5C42ea"
  // amount of erc20 token to send
  const SEND_ZENNY_AMOUNT = 1
  // amount of cross to send
  const SEND_CROSS_AMOUNT = 1

  // used for connecting wallet
  function connectWallet() {
    appKit.connect()
  }

  // used for sending CROSS
  async function handleSendNative() {

    await SendController.sendNativeToken({
      receiverAddress: RECEIVER_ADDRESS,
      sendTokenAmount: SEND_CROSS_AMOUNT, // in eth (not wei)
      decimals: '18',
    })
    AccountController.fetchTokenBalance()
  }

  // used for sending any of game tokens
  async function handleSendERC20Token() {

    await SendController.sendERC20Token({
      receiverAddress: RECEIVER_ADDRESS,
      tokenAddress: ZENNY_ADDRESS,
      sendTokenAmount: SEND_ZENNY_AMOUNT, // in eth (not wei)
      decimals: '18',
    })
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

  return (
    <div>
      <div className="action-button-list">
        <button onClick={connectWallet}>{account?.isConnected ? 'Connected' : 'Open'}</button>
        <button onClick={handleDisconnect}>Disconnect</button>
        <button onClick={switchToNetwork}>Switch to Cross</button>
      </div>
      <div className="action-button-list" style={{marginTop: '10px'}}>
        <button onClick={handleSendNative}>Send 1 CROSSx</button>
        <button onClick={handleSendERC20Token}>Send 1 ZENNY</button>
      </div>
    </div>
  )
}

export default ActionButtonList
