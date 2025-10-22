import { useAppKitTheme } from '@to-nexus/sdk/react'

import { AccountInfo } from './components/account-info'
import ActionButtonList from './components/action-button'
import Footer from './components/footer'
import InfoList from './components/info-list'

export default function App() {
  const { themeMode } = useAppKitTheme()
  document.documentElement.className = themeMode

  return (
    <div className="page-container">
      <div className="logo-container">
        <img
          src={themeMode === 'dark' ? './nexus-logo-white.png' : './nexus-logo.png'}
          alt="Nexus"
          width="150"
        />
        <img src="./appkit-logo.png" alt="Cross Sdk" width="150" />
      </div>

      <h1 className="page-title">Cross Wagmi Sdk Example</h1>
      <appkit-network-button />
      <ActionButtonList />
      <AccountInfo />
      <InfoList />
      <Footer />
    </div>
  )
}
