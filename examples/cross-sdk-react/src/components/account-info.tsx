import { useAppKitAccount, AccountController, ConnectionController } from '@cross/sdk/react'
import { useEffect, useState } from 'react';

export function AccountInfo() {

  const [fetched, setFetched] = useState(false);
  const account = useAppKitAccount()

  useEffect(() => {
    if (!account.caipAddress)
      return

    const fetchTokenBalance = async () => { 
      await AccountController.fetchTokenBalance();
      setFetched(true);
    }

    fetchTokenBalance();
  }, [account.caipAddress]);
  
  if (!account) {
    return <div>No account information available.</div>
  }

  if (!fetched) {
    return <div>Fetching token balance...</div>
  } 

  return (
    <div>
      <div>
        <strong>CAIP Address:</strong> {account.caipAddress}
      </div>
      <div>
        <strong>Native Symbol:</strong> {account.balanceSymbol}
        <strong>Native Balance:</strong> {account.balance}
      </div>
      <div>
        <strong>Tokens:</strong>
        {
          account.tokenBalance?.map((token) => (
            <div key={`${token.chainId}-${token.symbol}`}>
              <strong>ChainId:</strong> {token.chainId}
              <strong>Symbol:</strong> {token.symbol}
              <strong>Balance:</strong> {ConnectionController.formatUnits(BigInt(token.quantity.numeric), Number(token.quantity.decimals))}
            </div>
          ))
        }
      </div>
    </div>
  )
} 