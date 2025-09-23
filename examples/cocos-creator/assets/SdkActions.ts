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
    const instance = window.CrossSdkInstance
    if (!instance?.getUniversalProvider) return alert('SDK instance not initialized')
    const up = await instance.getUniversalProvider()
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

  // 6) ENS 조회 (EVM)
  async onClickLookupEnsAddress() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    const name = prompt('ENS name (e.g. vitalik.eth)') || ''
    if (!name) return
    try {
      const addr = await window.CrossSdk.ConnectionController.getEnsAddress(name)
      alert(`ENS Address: ${addr || 'Not found'}`)
    } catch (e) {
      console.error(e)
      alert('ENS lookup failed')
    }
  }

  async onClickLookupEnsAvatar() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    const name = prompt('ENS name (e.g. vitalik.eth)') || ''
    if (!name) return
    try {
      const avatar = await window.CrossSdk.ConnectionController.getEnsAvatar(name)
      alert(`ENS Avatar: ${avatar || 'Not found'}`)
    } catch (e) {
      console.error(e)
      alert('ENS avatar lookup failed')
    }
  }

  // 7) Gas 산정 및 단위 변환 (EVM)
  async onClickEstimateGas() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const address = (window as any).CrossSdk?.AccountController?.state?.address
      if (!address) return alert('Connect wallet first')
      const gas = await window.CrossSdk.ConnectionController.estimateGas({
        chainNamespace: 'eip155',
        address,
        to: address
      })
      alert(`Estimated gas: ${gas?.toString?.()}`)
    } catch (e) {
      console.error(e)
      alert('Estimate gas failed')
    }
  }

  onClickParseAndFormatUnits() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const amountStr = prompt('Amount in ether (e.g. 1.5)') || '1'
      const decimals = 18
      const wei = window.CrossSdk.ConnectionController.parseUnits(amountStr, decimals)
      const back = window.CrossSdk.ConnectionController.formatUnits(wei, decimals)
      alert(`Wei: ${wei.toString()}\nBack to ether: ${back}`)
    } catch (e) {
      console.error(e)
      alert('Parse/format units failed')
    }
  }

  // 8) 토큰 잔고 조회(요약)
  async onClickFetchTokenBalances() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const balances = await (window as any).CrossSdk.AccountController.fetchTokenBalance()
      alert(`Tokens: ${balances?.length || 0}`)
      console.log('Token balances:', balances)
    } catch (e) {
      console.error(e)
      alert('Fetch token balances failed')
    }
  }

  // 9) ERC20 전송 (EVM)
  async onClickSendERC20() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const caipContract = prompt('ERC20 CAIP address (e.g. eip155:1:0x... )') || ''
      if (!caipContract) return
      await window.CrossSdk.SendController.sendERC20Token({
        receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
        contractAddress: caipContract,
        sendTokenAmount: 1,
        decimals: '18',
        type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.LEGACY
      })
      alert('Send ERC20 submitted')
    } catch (e) {
      console.error(e)
      alert('Send ERC20 failed')
    }
  }

  // 10) 서명 변형 (EIP-191, EIP-712)
  async onClickEtherSignMessage() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const address = (window as any).CrossSdk?.AccountController?.state?.address
      if (!address) return alert('Connect wallet first')
      const sig = await window.CrossSdk.ConnectionController.etherSignMessage({
        message: `EIP-191 ${Date.now()}`,
        address
      })
      console.log('EIP-191 signature:', sig)
      alert('Signed (EIP-191). See console.')
    } catch (e) {
      console.error(e)
      alert('EIP-191 sign failed')
    }
  }

  async onClickSignTypedDataV4() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const address = (window as any).CrossSdk?.AccountController?.state?.address
      if (!address) return alert('Connect wallet first')
      const typed = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          Mail: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'contents', type: 'string' }
          ]
        },
        primaryType: 'Mail',
        domain: {
          name: 'Cross Demo',
          version: '1',
          chainId: 1,
          verifyingContract: address
        },
        message: {
          from: address,
          to: address,
          contents: 'Hello from Cocos'
        }
      }
      const paramsData = [address, typed]
      const sig = await window.CrossSdk.ConnectionController.signTypedDataV4(paramsData, {
        metadata: { from: 'cocos-demo' }
      })
      console.log('EIP-712 signature:', sig)
      alert('Signed (EIP-712). See console.')
    } catch (e) {
      console.error(e)
      alert('EIP-712 sign failed')
    }
  }
}
