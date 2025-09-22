import { Component, _decorator } from 'cc'

const { ccclass } = _decorator

declare global {
  interface Window {
    CrossSdk: any
    CrossSdkInstance?: any
  }
}

@ccclass('SdkActions')
export class SdkActions extends Component {
  // 1) 연결/해제/네트워크
  onClickConnect() {
    if (!window.CrossSdk) {
      alert('SDK not loaded')
      return
    }
    window.CrossSdk.useAppKitWallet().connect('cross_wallet')
  }

  async onClickDisconnect() {
    if (!window.CrossSdk) return
    await window.CrossSdk.ConnectionController.disconnect()
  }

  onClickSwitchToCross() {
    const instance = window.CrossSdkInstance
    if (!instance) return alert('SDK not initialized')
    // crossTestnet은 CDN 네임스페이스가 아니라 instance.switchNetwork로 전환
    // sdk-cdn 예제와 동일하게 instance.switchNetwork(network) 사용 가능
    try {
      // 기본 네트워크 전환은 네트워크 선택 UI로 처리하는 것을 권장
      alert('Use your network modal to switch network (see sdk-cdn example).')
    } catch (e) {
      console.error(e)
    }
  }

  // 2) Provider/토픽 확인
  private eip155Provider: any = null

  async onClickProviderRequest() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    if (!this.eip155Provider) return alert('Connect wallet first')
    const res = await this.eip155Provider.request({ method: 'eth_chainId', params: [] })
    console.log('eth_chainId:', res)
  }

  async onClickGetTopicInfo() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    const up = await window.CrossSdk.getUniversalProvider()
    if (up?.session) {
      alert(`Session Topic: ${up.session.topic}\nPairing Topic: ${up.session.pairingTopic}`)
    } else {
      alert('No UniversalProvider session (extension connection may be fine).')
    }
  }

  // 3) 서명
  async onClickSignMessage() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    // 간단 가드: 연결 여부는 실제 구독 상태를 통해 확인하는 것이 안전
    try {
      const sig = await window.CrossSdk.ConnectionController.signMessage({
        message: `Hello ${Date.now()}`,
        customData: { metadata: 'demo' }
      })
      console.log('Signed:', sig)
    } catch (e) {
      alert('Connect wallet first')
    }
  }

  // 4) 송금
  async onClickSendNative() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      await window.CrossSdk.SendController.sendNativeToken({
        data: '0x',
        receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
        sendTokenAmount: 1,
        decimals: '18',
        customData: { metadata: 'Cocos demo' },
        type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.LEGACY
      })
      alert('Send native submitted')
    } catch (e) {
      alert('Connect wallet first')
    }
  }

  // 5) 세션 점검/정리
  async onClickSessionCheck() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    const { walletProvider } = (window as any).CrossSdkInstance?.getProviders?.() || {}
    const engine = walletProvider?.client?.engine
    if (!engine) return alert('Engine not available')

    try {
      await (engine as any).validateAndCleanupSessions(true)
      const status = await (engine as any).getSessionStatus()
      alert(`Status: ${JSON.stringify(status)}`)
    } catch (e) {
      console.error(e)
      alert('Session check error')
    }
  }

  async onClickDeleteFirstSession() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    const { walletProvider } = (window as any).CrossSdkInstance?.getProviders?.() || {}
    const engine = walletProvider?.client?.engine
    if (!engine) return alert('Engine not available')

    const sessions = walletProvider.client.session.getAll()
    if (!sessions.length) return alert('No sessions')
    await (engine as any).deleteSession({ topic: sessions[0].topic, emitEvent: true })
    alert('Deleted first session')
  }
}
