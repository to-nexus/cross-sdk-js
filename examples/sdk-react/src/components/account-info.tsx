import { useEffect, useState } from 'react'

import { AccountController, ConnectionController, useAppKitAccount } from '@to-nexus/sdk/react'

export function AccountInfo() {
  const [fetched, setFetched] = useState(false)
  const account = useAppKitAccount()

  useEffect(() => {
    if (!account.caipAddress) return

    const fetchTokenBalance = async () => {
      await AccountController.fetchTokenBalance()
      setFetched(true)
    }
    console.log('AccountInfo: useEffect account.caipAddress', account.caipAddress)
    fetchTokenBalance()
  }, [account.caipAddress])

  if (!account?.isConnected) {
    return <div>No account information available.</div>
  }

  if (!fetched) {
    return <div>Fetching token balance...</div>
  }

  return (
    <div>
      <div
        style={{ display: 'flex', flexDirection: 'row', gap: '10px', justifyContent: 'flex-start' }}
      >
        <strong>Native Symbol:</strong> {account.balanceSymbol}
        <strong>Native Balance:</strong> {account.balance}
      </div>
      <div>
        <strong>Tokens:</strong>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          {account.tokenBalance
            ?.filter(token => token.symbol !== 'CROSS')
            .map(token => (
              <div
                key={`${token.chainId}-${token.symbol}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '10px',
                  justifyContent: 'flex-start'
                }}
              >
                <strong>ChainId:</strong> {token.chainId}
                <strong>Symbol:</strong> {token.symbol}
                <strong>Balance:</strong>{' '}
                {ConnectionController.formatUnits(
                  BigInt(token.quantity.numeric),
                  Number(token.quantity.decimals)
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
