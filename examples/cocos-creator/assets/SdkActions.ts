import { Component, Label, _decorator } from 'cc'

const { ccclass, property } = _decorator

declare global {
  interface Window {
    CrossSdk: any
    CrossSdkInstance?: any
  }
}

const contractData = {
  612044: {
    coin: 'CROSS',
    erc20: '0xe934057Ac314cD9bA9BC17AE2378959fd39Aa2E3',
    erc721: '0xaD31a95fE6bAc89Bc4Cf84dEfb23ebBCA080c013'
  },
  612055: {
    coin: 'CROSS',
    erc20: '0xe9013a5231BEB721f4F801F2d07516b8ca19d953',
    erc721: ''
  },
  97: {
    coin: 'BNB',
    erc20: '',
    erc721: ''
  },
  56: {
    coin: 'BNB',
    erc20: '',
    erc721: ''
  },
  1001: {
    coin: 'KAIA',
    erc20: '0xd4846dddf83278d10b92bf6c169c5951d6f5abb8',
    erc721: ''
  },
  8217: {
    coin: 'KAIA',
    erc20: '',
    erc721: ''
  },
  1: {
    coin: 'ETH',
    erc20: '',
    erc721: ''
  },
  11155111: {
    coin: 'ETH',
    erc20: '',
    erc721: ''
  }
}

@ccclass('SdkActions')
export class SdkActions extends Component {
  @property(Label) connectButtonLabel: Label = null!
  @property(Label) addressLabel: Label = null!
  @property(Label) chainIdLabel: Label = null!
  @property(Label) nativeBalanceLabel: Label = null!

  // 1) 연결/해제/네트워크
  async onClickConnect() {
    if (!window.CrossSdk) {
      alert('SDK not loaded')
      return
    }
    await window.CrossSdk.useAppKitWallet().connect('cross_wallet')
    // 연결 완료 후 즉시 라벨/요약 갱신
    this.updateConnectButtonLabel()
    try {
      await this.refreshBalances()
    } catch {}
    await this.updateSummaryLabels()
  }

  async onClickDisconnect() {
    if (!window.CrossSdk) return
    await window.CrossSdk.ConnectionController.disconnect()
    this.updateConnectButtonLabel() // 즉시 갱신
    await this.updateSummaryLabels()
  }

  async onClickSwitchToCross() {
    const instance = window.CrossSdkInstance
    if (!instance) return alert('SDK not initialized')

    const { chainId } = await this.getSdkSummary()
    const target = chainId === 612044 ? window.CrossSdk.crossMainnet : window.CrossSdk.crossTestnet

    try {
      await instance.switchNetwork(target) // ← AppKit 경로로 전환 (필수)
      // UI는 구독으로 자동 반영되지만, 즉시 반영 원하면:
      this.updateConnectButtonLabel()
      await this.updateSummaryLabels()
    } catch (e) {
      alert((e as Error).message || 'Switch network failed')
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
      alert('Signed message: ' + sig)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  // 4) 송금
  async onClickSendNative() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const resTx = await window.CrossSdk.SendController.sendNativeToken({
        data: '0x',
        receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
        sendTokenAmount: 1,
        decimals: '18',
        customData: { metadata: 'Cocos demo' },
        type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.LEGACY
      })
      this.updateConnectButtonLabel()
      await this.updateSummaryLabels()

      alert(JSON.stringify(resTx))
    } catch (e) {
      alert((e as Error).message)
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

  async onClickSendERC20() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    try {
      const { chainId } = await this.getSdkSummary() // 이미 구현된 헬퍼
      if (!chainId) return alert('Connect wallet first')
      const ERC20_ADDRESS = contractData[chainId as keyof typeof contractData].erc20
      const erc20 = ERC20_ADDRESS // 토큰 주소
      const caipContract = `eip155:${chainId}:${erc20}`

      const resTx = await window.CrossSdk.SendController.sendERC20Token({
        receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
        contractAddress: caipContract, // ← CAIP-2 형식
        sendTokenAmount: 1,
        decimals: '18',
        type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.LEGACY
      })
      this.updateConnectButtonLabel()
      await this.updateSummaryLabels()

      alert(JSON.stringify(resTx))
    } catch (e) {
      alert((e as Error).message)
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

  // ===== Helpers for UI binding =====
  // 연결 버튼 라벨 토글: 연결됨 => 'Cross Connected', 해제됨 => 'Cross Connect'
  updateConnectButtonLabel() {
    if (!this.connectButtonLabel) return
    const status = (window as any).CrossSdk?.AccountController?.state?.status
    const address = (window as any).CrossSdk?.AccountController?.state?.address
    console.log('status:', status)
    console.log('address:', address)
    const connected = status === 'connected' && Boolean(address)
    console.log('connected:', connected)
    this.connectButtonLabel.string = connected ? `Cross\nConnected` : `Cross\nConnect`
  }

  // 요약 라벨 갱신: address / chainId / native balance
  async updateSummaryLabels() {
    try {
      const summary = await this.getSdkSummary()
      if (this.addressLabel) this.addressLabel.string = summary.address || 'Not connected'
      if (this.chainIdLabel)
        this.chainIdLabel.string = summary.chainId
          ? summary.chainId === 612044
            ? `Cross Testnet\n${summary.chainId}`
            : `Cross Mainnet\n${summary.chainId}`
          : '-'
      if (this.nativeBalanceLabel)
        this.nativeBalanceLabel.string = summary.nativeBalance
          ? `${summary.nativeBalance}`.trim()
          : '-'
    } catch (e) {
      if (this.addressLabel) this.addressLabel.string = 'Not connected'
      if (this.chainIdLabel) this.chainIdLabel.string = '-'
      if (this.nativeBalanceLabel) this.nativeBalanceLabel.string = '-'
    }
  }

  // 연결 상태 확인: 계정 상태가 connected 이고 주소가 존재할 때 true
  isConnected(): boolean {
    const status = (window as any).CrossSdk?.AccountController?.state?.status
    const address = (window as any).CrossSdk?.AccountController?.state?.address
    return status === 'connected' && Boolean(address)
  }

  // 사용자 주소, 체인ID(HEX/DEC), 네이티브 잔액/심볼 요약 반환
  async getSdkSummary(): Promise<{
    address?: string
    chainIdHex?: `0x${string}`
    chainId?: number
    nativeBalance?: string
    nativeSymbol?: string
  }> {
    if (!window.CrossSdk) throw new Error('SDK not loaded')

    const address = (window as any).CrossSdk?.AccountController?.state?.address
    const nativeBalance = (window as any).CrossSdk?.AccountController?.state?.balance
    const nativeSymbol = (window as any).CrossSdk?.AccountController?.state?.balanceSymbol

    const instance = window.CrossSdkInstance
    if (!instance?.getUniversalProvider) throw new Error('SDK instance not initialized')

    const up = await instance.getUniversalProvider()
    let chainIdHex: `0x${string}` | undefined
    let chainId: number | undefined
    try {
      const raw = await up?.request({ method: 'eth_chainId', params: [] })
      if (typeof raw === 'string') {
        if (raw.startsWith('0x') || raw.startsWith('0X')) {
          chainIdHex = raw as `0x${string}`
          chainId = parseInt(raw, 16)
        } else {
          const asNumber = Number(raw)
          if (!Number.isNaN(asNumber)) {
            chainId = asNumber
            chainIdHex = `0x${asNumber.toString(16)}` as `0x${string}`
          }
        }
      } else if (typeof raw === 'number') {
        chainId = raw
        chainIdHex = `0x${raw.toString(16)}` as `0x${string}`
      }
    } catch {
      // provider가 없거나 요청 실패 시 안전하게 무시
    }

    return { address, chainIdHex, chainId, nativeBalance, nativeSymbol }
  }

  // 토큰/잔액 최신화 트리거 (옵션)
  async refreshBalances(): Promise<void> {
    if (!window.CrossSdk) return
    await (window as any).CrossSdk.AccountController.fetchTokenBalance()
  }

  // UniversalProvider 세션 강제 정리 + SDK 연결 해제
  async onClickForceDisconnectSessions() {
    if (!window.CrossSdk) return alert('SDK not loaded')

    try {
      const { walletProvider } = (window as any).CrossSdkInstance?.getProviders?.() || {}
      const engine = walletProvider?.client?.engine

      if (engine) {
        const sessions = walletProvider.client.session.getAll()
        await Promise.all(
          sessions.map((s: any) =>
            (engine as any).deleteSession({ topic: s.topic, emitEvent: true })
          )
        )
      }

      // AppKit 레벨 연결 정리
      await window.CrossSdk.ConnectionController.disconnect()

      alert('Force disconnected')
    } catch (e) {
      console.error(e)
      alert('Force disconnect failed')
    }
  }

  // 0) SDK 준비 대기
  private async waitSdkReady(timeoutMs = 5000) {
    const start = Date.now()
    while ((!window.CrossSdk || !window.CrossSdkInstance) && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 50))
    }
    if (!window.CrossSdk || !window.CrossSdkInstance) {
      throw new Error('SDK not ready')
    }
  }

  // 1) UniversalProvider 불러오기(없으면 undefined)
  private async getUniversalProviderSafe() {
    try {
      const instance = window.CrossSdkInstance
      if (!instance?.getUniversalProvider) return undefined
      return await instance.getUniversalProvider()
    } catch {
      return undefined
    }
  }

  // 2) 엔진 핸들(있으면 WalletConnect 세션 엔진)
  private getEngineSafe() {
    try {
      const { walletProvider } = (window as any).CrossSdkInstance?.getProviders?.() || {}
      return walletProvider?.client?.engine
    } catch {
      return undefined
    }
  }

  // 3) 최초 세션 활성 여부 점검(주소/세션/엔진 기준)
  async checkInitialSessionActive(): Promise<boolean> {
    await this.waitSdkReady()

    // a) 가장 빠른 경로: 계정 상태가 이미 복구됨
    const status = (window as any).CrossSdk?.AccountController?.state?.status
    const address = (window as any).CrossSdk?.AccountController?.state?.address
    if (status === 'connected' && address) {
      return true
    }

    // b) UniversalProvider 세션 존재 여부
    const up = await this.getUniversalProviderSafe()
    if (up?.session?.topic) {
      return true
    }

    // c) 엔진 자체 상태(check after cleanup)
    const engine = this.getEngineSafe()
    if (engine?.getSessionStatus) {
      try {
        // cleanup 없이 읽기
        const statusObj = await (engine as any).getSessionStatus()
        if (statusObj?.total > 0 && statusObj?.healthy > 0) {
          return true
        }
      } catch {}
    }

    return false
  }

  // 4) 최초 액세스 시 Provider 워밍업(확장/모바일에서 주소 복구 트리거용)
  async warmupProviderIfAny() {
    const up = await this.getUniversalProviderSafe()
    try {
      // 세션 있는 경우 계정 요청으로 내부 상태를 빠르게 복구
      if (up?.session) {
        await up.request({ method: 'eth_requestAccounts', params: [] })
      }
    } catch {
      // 확장 연결 등에서 실패해도 무시
    }
  }

  async start() {
    // 1) SDK 준비 후 provider 워밍업
    try {
      await this.warmupProviderIfAny()
    } catch {}

    // 2) 최초 연결 여부 판단 → 버튼 라벨 즉시 반영
    const active = await this.checkInitialSessionActive()
    this.updateConnectButtonLabel()
    await this.updateSummaryLabels()

    // 3) 상태 변화 구독(이미 추가했다면 중복 X)
    if (window.CrossSdk?.AccountController?.subscribeKey) {
      ;(this as any)._unsubs ||= []
      ;(this as any)._unsubs.push(
        window.CrossSdk.AccountController.subscribeKey('status', () => {
          this.updateConnectButtonLabel()
          this.updateSummaryLabels()
        }),
        window.CrossSdk.AccountController.subscribeKey('address', () => {
          this.updateConnectButtonLabel()
          this.updateSummaryLabels()
        }),
        window.CrossSdk.AccountController.subscribeKey('balance', () => {
          this.updateSummaryLabels()
        }),
        window.CrossSdk.AccountController.subscribeKey('balanceSymbol', () => {
          this.updateSummaryLabels()
        })
      )
    }

    // 4) 포커스 복귀 시 재점검(모바일 딥링크/탭 전환 대응)
    window.addEventListener(
      'focus',
      () =>
        setTimeout(() => {
          this.updateConnectButtonLabel()
          this.updateSummaryLabels()
        }, 300),
      {
        passive: true
      }
    )
  }
}
