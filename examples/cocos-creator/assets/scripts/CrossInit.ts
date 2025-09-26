import { Component, _decorator } from 'cc'

const { ccclass } = _decorator

declare global {
  interface Window {
    CrossSdk: any
    CrossSdkInstance?: any
    System?: any
  }
}

@ccclass('CrossInit')
export class CrossInit extends Component {
  async start() {
    // 1) Cross SDK 로드 대기 (템플릿에서 미리 올려야 함)
    await new Promise<void>(resolve => {
      const start = Date.now()
      const t = setInterval(() => {
        if (window.CrossSdk || Date.now() - start > 8000) {
          clearInterval(t)
          resolve()
        }
      }, 100)
    })

    // 1-1) 폴백: 템플릿 스니펫이 실행되지 않았다면 SystemJS로 직접 로드 시도
    if (!window.CrossSdk && window.System?.import) {
      const base = location.pathname.replace(/index\.html?$/, '')
      const p = `${base}external/cross-sdk.js`
      const mod = await window.System.import(p)
      ;(window as any).CrossSdk = mod
    }

    if (!window.CrossSdk) {
      throw new Error(
        'CrossSdk not found on window. Check template import of external/cross-sdk.js'
      )
    }

    // 2) 프로젝트 설정값
    const projectId = '0979fd7c92ec3dbd8e78f433c3e5a523'
    const redirectUrl = window.location.href
    const metadata = {
      name: 'Cross SDK',
      description: 'Cross SDK in Cocos',
      url: 'https://to.nexus',
      icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
    }

    // 3) SDK 초기화 및 전역 인스턴스 노출 (상태 구독/네트워크 전환 등에서 사용)
    const instance = window.CrossSdk.initCrossSdk(projectId, redirectUrl, metadata, 'dark')
    window.CrossSdkInstance = instance
  }
}
