import { useEffect, useState } from 'react'

import ActionButtonList from './components/action-button'
import Footer from './components/footer'

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    document.documentElement.className = themeMode
  }, [themeMode])

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

      <h1 className="page-title">Cross Wagmi SDK Example</h1>

      <button
        onClick={() => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))}
        style={{
          padding: '8px 16px',
          marginBottom: '20px',
          backgroundColor: themeMode === 'dark' ? '#333' : '#fff',
          color: themeMode === 'dark' ? '#fff' : '#333',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Toggle Theme: {themeMode === 'dark' ? '🌙 Dark' : '☀️ Light'}
      </button>

      <ActionButtonList />
      <Footer />
    </div>
  )
}
