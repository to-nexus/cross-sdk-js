import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface WalletContextType {
  // MetaMask Extension 상태
  metamaskProvider: any | null
  metamaskAccount: string | null
  metamaskChainId: number | null
  setMetamaskProvider: (provider: any | null) => void
  setMetamaskAccount: (account: string | null) => void
  setMetamaskChainId: (chainId: number | null) => void
  
  // 활성 지갑 타입
  getActiveWalletType: () => 'metamask' | 'cross' | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [metamaskProvider, setMetamaskProvider] = useState<any | null>(null)
  const [metamaskAccount, setMetamaskAccount] = useState<string | null>(null)
  const [metamaskChainId, setMetamaskChainId] = useState<number | null>(null)

  const getActiveWalletType = useCallback(() => {
    // MetaMask Extension이 연결되어 있으면
    if (metamaskProvider && metamaskAccount) {
      return 'metamask'
    }
    
    // 아니면 null (Cross Wallet은 SDK에서 관리)
    return null
  }, [metamaskProvider, metamaskAccount])

  return (
    <WalletContext.Provider
      value={{
        metamaskProvider,
        metamaskAccount,
        metamaskChainId,
        setMetamaskProvider,
        setMetamaskAccount,
        setMetamaskChainId,
        getActiveWalletType
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

// Export 추가: 다른 파일에서도 사용 가능하도록
export { WalletContext }

