import { AccountInfo } from './components/account-info'
import ActionButtonList from './components/action-button'
import Footer from './components/footer'
import InfoList from './components/info-list'
import { useAppKitTheme } from '@cross/sdk/react'

export default function App() {
  const { themeMode } = useAppKitTheme()
  document.documentElement.className = themeMode

  return (
    <div className="page-container">
      <div className="logo-container">
        <img
          src={themeMode === 'dark' ? '/reown-logo-white.png' : '/reown-logo.png'}
          alt="Reown"
          width="150"
        />
        <img src="/appkit-logo.png" alt="Reown" width="150" />
      </div>

      <h1 className="page-title">Cross React Sdk Example</h1>

      <ActionButtonList />
      <AccountInfo />
      <InfoList />
      <Footer />
    </div>
  )
}
