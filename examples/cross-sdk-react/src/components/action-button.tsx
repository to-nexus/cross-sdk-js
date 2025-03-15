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
  useDisconnect
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
  
  const ZENNY_ADDRESS = "eip155:612044:0x35Af8eF840Eda3e93FC8F5167dbd8FF0D6F96580"
  const RECEIVER_ADDRESS = "0x920A31f0E48739C3FbB790D992b0690f7F5C42ea"
  const SEND_ZENNY_AMOUNT = 1
  const SEND_CROSS_AMOUNT = 1

  function openAppKit() {
    // if (account?.isConnected)
    //   return

    appKit.open()
  }

  function handleSendNative() {

    SendController.sendNativeToken({
      receiverAddress: RECEIVER_ADDRESS,
      sendTokenAmount: SEND_CROSS_AMOUNT, // in eth (not wei)
      decimals: '18',
    })
  }

  function handleSendERC20Token() {

    SendController.sendERC20Token({
      receiverAddress: RECEIVER_ADDRESS,
      tokenAddress: ZENNY_ADDRESS,
      sendTokenAmount: SEND_ZENNY_AMOUNT, // in eth (not wei)
      decimals: '18',
    })
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
        <button onClick={openAppKit}>{account?.isConnected ? 'Connected' : 'Open'}</button>
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
