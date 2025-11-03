export type WalletType = 'cross_wallet' | 'metamask'

export const cookieUtils = {
  setCurrentWallet: (wallet: WalletType) => {
    if (typeof document === 'undefined') return
    document.cookie = `currentWallet=${wallet}; path=/; max-age=31536000`
  },

  getCurrentWallet: (): WalletType | null => {
    if (typeof document === 'undefined') return null
    const cookies = document.cookie.split(';')
    const walletCookie = cookies.find(c => c.trim().startsWith('currentWallet='))
    const value = walletCookie?.split('=')[1]
    return value === 'cross_wallet' || value === 'metamask' ? value : null
  },

  removeCurrentWallet: () => {
    if (typeof document === 'undefined') return
    document.cookie = 'currentWallet=; path=/; max-age=0'
  }
}

