import { useAppKitAccount } from '@cross/sdk/react'

export function AccountInfo() {

  const account = useAppKitAccount()

  if (!account) {
    return <div>No account information available.</div>
  }

  return (
    <div>
      <div>
        <strong>Address:</strong> {account.address}
      </div>
      <div>
        <strong>CAIP Address:</strong> {account.caipAddress}
      </div>
      <div>
        <strong>Balance:</strong> {account.balance}
      </div>
      <div>
        <strong>Balance Symbol:</strong> {account.balanceSymbol}
      </div>
      <div>
        <strong>Balance Loading:</strong> {account.balanceLoading}
      </div>
      <div>
        <strong>Tokens:</strong>
        {
          account.tokenBalance?.map((token) => (
            <div key={token.symbol}>
              <strong>Token Symbol:</strong> {token.symbol}
              <strong>Token Balance:</strong> {token.value}
            </div>
          ))
        }
      </div>
    </div>
  )
} 