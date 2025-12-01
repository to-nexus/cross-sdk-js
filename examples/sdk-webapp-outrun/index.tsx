import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { ConstantsUtil, createDefaultSIWXConfig, initCrossSdkWithParams } from '@to-nexus/sdk/react'

import App from './App'

// Your unique project id provided by Cross Team. If you don't have one, please contact us.
const projectId = import.meta.env.VITE_PROJECT_ID || '0979fd7c92ec3dbd8e78f433c3e5a523'
// Redirect URL to return to after wallet app interaction
const redirectUrl = window.location.href

const metadata = {
  name: 'Neon Outrun',
  description: 'High-speed cyberpunk racing game with blockchain integration',
  url: window.location.origin,
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

// SDK 초기화 (동기 호출)
initCrossSdkWithParams({
  projectId,
  redirectUrl,
  metadata,
  themeMode: 'dark',
  mobileLink: ConstantsUtil.getUniversalLink(),
  siwx: createDefaultSIWXConfig({
    statement: 'Sign in with your wallet to play Neon Outrun',
    getRequired: () => false // SIWE는 선택 사항
  })
})

// SDK 준비 확인 Wrapper
function SDKWrapper() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // SDK가 준비될 때까지 대기
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 1000) // 1초 대기

    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return (
      <div className="w-screen h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-cyan-400">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Orbitron' }}>
            NEON <span className="text-pink-500">OUTRUN</span>
          </h1>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return <App />
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Could not find root element to mount to')
}

const root = ReactDOM.createRoot(rootElement)
root.render(<SDKWrapper />)
