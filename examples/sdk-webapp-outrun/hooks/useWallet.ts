import { useCallback, useEffect, useState } from 'react'

import { useAppKitAccount, useAppKitWallet, useDisconnect } from '@to-nexus/sdk/react'

export interface CrossWallet {
  address: string
  isConnected: boolean
  balance?: string
}

export const useWallet = () => {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { connect, connectCrossExtensionWallet, isInstalledCrossExtensionWallet } =
    useAppKitWallet()

  let account: any = null
  let disconnect: any = null

  try {
    account = useAppKitAccount()
    const result = useDisconnect()
    disconnect = result?.disconnect || (() => {})
  } catch (e) {
    console.warn('SDK hooks not available yet:', e)
    setError('SDK not initialized')
  }

  useEffect(() => {
    setIsReady(true)
  }, [])

  const wallet: CrossWallet | null = account?.isConnected
    ? {
        address: account.address || '',
        isConnected: true,
        balance: account.balance
      }
    : null

  const connectWallet = useCallback(async () => {
    if (isInstalledCrossExtensionWallet()) {
      await connectCrossExtensionWallet()
    } else {
      await connect('cross_wallet')
    }
    return wallet
  }, [wallet])

  const disconnectWallet = useCallback(async () => {
    if (disconnect) {
      try {
        await disconnect()
      } catch (e) {
        console.error('Disconnect error:', e)
      }
    }
  }, [disconnect])

  return {
    wallet,
    isConnecting: false,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: account?.isConnected || false,
    isReady
  }
}
