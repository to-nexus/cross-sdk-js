import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { ConstantsUtil, createDefaultSIWXConfig, initCrossSdkWithParams } from '@to-nexus/sdk/react'
import { CROSSxWebApp, isCROSSxEnvironment } from '@to-nexus/webapp'

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
    // WebApp 초기화 (CROSSx 앱 환경에서만)
    let cleanupWebApp: (() => void) | undefined

    if (isCROSSxEnvironment()) {
      console.log('[Outrun] Running in CROSSx environment')
      console.log('[Outrun] WebApp version:', CROSSxWebApp.version)

      // Safe Area Insets 가져오기 및 CSS 변수 설정
      const initializeSafeArea = async () => {
        try {
          const insets = await CROSSxWebApp.getSafeAreaInsets()
          console.log('[Outrun] Safe Area Insets:', insets)

          // CSS 변수로 설정하여 전체 앱에서 사용 가능하도록
          document.documentElement.style.setProperty('--safe-area-top', `${insets.top}px`)
          document.documentElement.style.setProperty('--safe-area-bottom', `${insets.bottom}px`)
          document.documentElement.style.setProperty('--safe-area-left', `${insets.left}px`)
          document.documentElement.style.setProperty('--safe-area-right', `${insets.right}px`)

          // 화면 전체 높이 설정 (Safe Area 포함)
          const totalHeight = window.innerHeight
          document.documentElement.style.setProperty('--viewport-height', `${totalHeight}px`)

          console.log('[Outrun] Safe Area CSS variables set')
        } catch (error) {
          console.error('[Outrun] Failed to get safe area insets:', error)
        }
      }

      // 전체화면 요청
      CROSSxWebApp.requestFullScreen({ isExpandSafeArea: true })

      // Safe Area Insets 초기화
      initializeSafeArea()

      // 준비 완료 신호
      CROSSxWebApp.ready()

      // 이벤트 리스너 등록
      const handleViewClosed = () => {
        console.log('[Outrun] View closed event received')
        // 게임 상태 저장 등의 작업 수행
      }

      const handleViewBackgrounded = () => {
        console.log('[Outrun] View backgrounded event received')
        // 게임 일시정지 등의 작업 수행
      }

      CROSSxWebApp.on('viewClosed', handleViewClosed)
      CROSSxWebApp.on('viewBackgrounded', handleViewBackgrounded)

      console.log('[Outrun] WebApp initialized successfully')

      // Cleanup function for WebApp
      cleanupWebApp = () => {
        CROSSxWebApp.off('viewClosed', handleViewClosed)
        CROSSxWebApp.off('viewBackgrounded', handleViewBackgrounded)
      }
    } else {
      console.log('[Outrun] Running in browser environment (WebApp not available)')
    }

    // SDK가 준비될 때까지 대기
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 1000) // 1초 대기

    // Cleanup
    return () => {
      clearTimeout(timer)
      if (cleanupWebApp) {
        cleanupWebApp()
      }
    }
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
