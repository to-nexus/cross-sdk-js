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
  },
  2020: {
    coin: 'RON',
    erc20: '',
    erc721: ''
  },
  2021: {
    coin: 'tRON',
    erc20: '',
    erc721: ''
  }
}

// 사용 가능한 네트워크 리스트
const availableNetworks = [
  { id: 612044, name: 'Cross Mainnet' },
  { id: 612055, name: 'Cross Testnet' },
  { id: 56, name: 'BSC Mainnet' },
  { id: 97, name: 'BSC Testnet' },
  { id: 8217, name: 'Kaia Mainnet' },
  { id: 1001, name: 'Kaia Testnet' },
  { id: 1, name: 'Ethereum Mainnet' },
  { id: 11155111, name: 'Ethereum Testnet' },
  { id: 2020, name: 'Ronin Mainnet' },
  { id: 2021, name: 'Ronin Testnet' }
]

@ccclass('SdkActions')
export class SdkActions extends Component {
  @property(Label) connectButtonLabel: Label = null!
  @property(Label) connectWithAuthButtonLabel: Label = null!
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

  // 🔐 Connect + SIWE Authentication (QR Code)
  async onClickConnectWithAuth() {
    if (!window.CrossSdk) {
      alert('SDK not loaded')
      return
    }

    try {
      if (this.isConnected()) {
        // 연결되어 있으면 disconnect
        await window.CrossSdk.ConnectionController.disconnect()
      }

      // WalletConnect (QR Code) 연결 + SIWE 인증 통합
      const result = await window.CrossSdkInstance.authenticateWalletConnect()

      if (result && typeof result === 'object' && 'authenticated' in result) {
        if (result.authenticated && result.sessions && result.sessions.length > 0) {
          const session = result.sessions[0]
          if (session) {
            alert(
              `🎉 SIWE 인증 성공!\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📍 Address:\n${session.data.accountAddress}\n\n` +
                `🔗 Chain ID:\n${session.data.chainId}\n\n` +
                `✍️ Signature:\n${session.signature.substring(0, 20)}...${session.signature.substring(session.signature.length - 20)}\n\n` +
                `📅 Expires:\n${session.data.expirationTime || 'N/A'}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━`
            )
          }
        } else {
          alert('⚠️ 인증이 취소되었거나 실패했습니다.')
          return
        }
      }

      // 연결 완료 후 UI 갱신
      this.updateConnectButtonLabel()
      try {
        await this.refreshBalances()
      } catch {}
      await this.updateSummaryLabels()
    } catch (error) {
      console.error('Error in Connect + Auth:', error)
      alert(`인증 실패: ${(error as Error).message}`)
    }
  }

  async onClickDisconnect() {
    if (!window.CrossSdk) return
    await window.CrossSdk.ConnectionController.disconnect()
    this.updateConnectButtonLabel() // 즉시 갱신
    await this.updateSummaryLabels()
  }

  // 네트워크 선택 모달 열기 (기존 onClickSwitchToCross를 대체)
  async onClickSwitchNetwork() {
    if (!window.CrossSdk) {
      alert('SDK not loaded')
      return
    }
    if (this.isConnected() === false) {
      alert('Connect wallet first')
      return
    }

    this.openNetworkModal()
  }

  // 네트워크 선택 모달 열기
  private openNetworkModal() {
    this.createNetworkModal()
  }

  // 네트워크 선택 모달 생성
  private createNetworkModal() {
    const modal = document.getElementById('network-modal')
    const networkList = document.getElementById('network-list')

    if (!modal || !networkList) {
      console.error('Network modal elements not found')
      return
    }

    // 기존 네트워크 리스트 초기화
    networkList.innerHTML = ''

    // 현재 체인 ID 가져오기
    const currentChainId = (window as any).CrossSdk?.NetworkController?.state?.caipNetwork?.id

    // 네트워크 객체 매핑 (SDK에서 가져오기)
    const networkMapping: Record<number, any> = {
      612044: (window as any).CrossSdk.crossMainnet,
      612055: (window as any).CrossSdk.crossTestnet,
      56: (window as any).CrossSdk.bscMainnet,
      97: (window as any).CrossSdk.bscTestnet,
      8217: (window as any).CrossSdk.kaiaMainnet,
      1001: (window as any).CrossSdk.kaiaTestnet,
      1: (window as any).CrossSdk.etherMainnet,
      11155111: (window as any).CrossSdk.etherTestnet,
      2020: (window as any).CrossSdk.roninMainnet,
      2021: (window as any).CrossSdk.roninTestnet
    }

    // 디버깅: SDK에서 사용 가능한 네트워크 확인
    console.log('🔍 [Debug] Available networks in SDK:', {
      crossMainnet: (window as any).CrossSdk?.crossMainnet,
      crossTestnet: (window as any).CrossSdk?.crossTestnet,
      bscMainnet: (window as any).CrossSdk?.bscMainnet,
      bscTestnet: (window as any).CrossSdk?.bscTestnet,
      kaiaMainnet: (window as any).CrossSdk?.kaiaMainnet,
      kaiaTestnet: (window as any).CrossSdk?.kaiaTestnet,
      etherMainnet: (window as any).CrossSdk?.etherMainnet,
      etherTestnet: (window as any).CrossSdk?.etherTestnet,
      roninMainnet: (window as any).CrossSdk?.roninMainnet,
      roninTestnet: (window as any).CrossSdk?.roninTestnet
    })

    // 네트워크 리스트 생성
    availableNetworks.forEach(networkInfo => {
      const networkItem = document.createElement('div')
      const isCurrentNetwork = currentChainId === networkInfo.id

      networkItem.className = `network-item ${isCurrentNetwork ? 'current' : ''}`

      const networkName = document.createElement('span')
      networkName.className = 'network-name'
      networkName.textContent = networkInfo.name

      const statusIndicator = document.createElement('span')
      statusIndicator.className = `network-status ${isCurrentNetwork ? 'current' : 'selectable'}`
      statusIndicator.textContent = isCurrentNetwork ? '✓ Current' : 'Select'

      networkItem.appendChild(networkName)
      networkItem.appendChild(statusIndicator)

      // 클릭 이벤트
      networkItem.onclick = async () => {
        if (!isCurrentNetwork) {
          try {
            const targetNetwork = networkMapping[networkInfo.id]
            console.log(
              `🔍 [Debug] Switching to ${networkInfo.name} (chainId: ${networkInfo.id})`,
              targetNetwork
            )

            if (!targetNetwork) {
              console.error(`❌ [Error] Network ${networkInfo.name} is undefined`)
              alert(`Network ${networkInfo.name} not found in SDK`)
              return
            }

            console.log('🔄 [Debug] Calling switchNetwork...')
            
            // 네트워크 전환
            try {
              await window.CrossSdkInstance.switchNetwork(targetNetwork)
              console.log('✅ [Debug] switchNetwork completed successfully')
            } catch (switchError) {
              console.error('❌ [Error] switchNetwork threw error:', switchError)
              throw switchError
            }

            // 네트워크 전환 후 잠시 대기 (상태 업데이트를 위해)
            await new Promise(resolve => setTimeout(resolve, 500))

            // UI 업데이트
            this.updateConnectButtonLabel()
            await this.updateSummaryLabels()

            // 모달 닫기
            this.closeNetworkModal()

            console.log(`✅ [Debug] ${networkInfo.name} 전환 완료, alert 표시`)
            alert(`✅ ${networkInfo.name} 전환 성공!`)
          } catch (error) {
            console.error('❌ [Error] Network switch failed:', error)
            console.error('❌ [Error] Error details:', {
              message: (error as Error).message,
              stack: (error as Error).stack,
              errorObject: error
            })
            alert(`Network switch failed: ${(error as Error).message}`)
          }
        }
      }

      networkList.appendChild(networkItem)
    })

    // 모달 표시
    modal.classList.add('show')
  }

  // 네트워크 모달 닫기
  private closeNetworkModal() {
    const modal = document.getElementById('network-modal')
    if (modal) {
      modal.classList.remove('show')
    }
  }

  // 모달 이벤트 리스너 설정 (start 메서드에서 호출)
  private setupNetworkModalEvents() {
    const modal = document.getElementById('network-modal')
    const closeBtn = document.getElementById('network-modal-close')

    if (!modal || !closeBtn) return

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        this.closeNetworkModal()
      }
    })

    // 닫기 버튼 클릭 시 닫기
    closeBtn.addEventListener('click', () => {
      this.closeNetworkModal()
    })
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
    if (!window.CrossSdk) return // alert('SDK not loaded')
    // 간단 가드: 연결 여부는 실제 구독 상태를 통해 확인하는 것이 안전
    try {
      if (this.isConnected() === false) {
        return alert('Connect wallet first')
      }

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
    if (this.isConnected() === false) {
      return alert('Connect wallet first')
    }
    try {
      const resTx = await window.CrossSdk.SendController.sendNativeToken({
        data: '0x',
        receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
        sendTokenAmount: 1,
        decimals: '18',
        gas: BigInt(147726), // optional (you can set this your calculated gas or skip it)
        maxFee: BigInt(3200000000), // optional (you can set this your calculated maxFee or skip it)
        maxPriorityFee: BigInt(2000000000), // optional (you can set this your calculated maxPriorityFee or skip it)
        customData: { metadata: 'Cocos demo' },
        type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
      })
      this.updateConnectButtonLabel()
      await this.updateSummaryLabels()

      alert(JSON.stringify(resTx))
      // alert(JSON.stringify(resTx))
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
    if (!window.CrossSdk) return // alert('SDK not loaded')
    const { walletProvider } = (window as any).CrossSdkInstance?.getProviders?.() || {}
    const engine = walletProvider?.client?.engine
    if (!engine) return // alert('Engine not available')

    const sessions = walletProvider.client.session.getAll()
    if (!sessions.length) return // alert('No sessions')
    await (engine as any).deleteSession({ topic: sessions[0].topic, emitEvent: true })
    alert('Deleted first session')
  }

  // 6) ENS 조회 (EVM)
  async onClickLookupEnsAddress() {
    if (!window.CrossSdk) return //alert('SDK not loaded')
    const name = prompt('ENS name (e.g. vitalik.eth)') || ''
    if (!name) return
    try {
      const addr = await window.CrossSdk.ConnectionController.getEnsAddress(name)
      // alert(`ENS Address: ${addr || 'Not found'}`)
    } catch (e) {
      console.error(e)
      // alert('ENS lookup failed')
    }
  }

  async onClickLookupEnsAvatar() {
    if (!window.CrossSdk) return // alert('SDK not loaded')
    const name = prompt('ENS name (e.g. vitalik.eth)') || ''
    if (!name) return
    try {
      const avatar = await window.CrossSdk.ConnectionController.getEnsAvatar(name)
      // alert(`ENS Avatar: ${avatar || 'Not found'}`)
    } catch (e) {
      console.error(e)
      // alert('ENS avatar lookup failed')
    }
  }

  // 7) Gas 산정 및 단위 변환 (EVM)
  async onClickEstimateGas() {
    if (!window.CrossSdk) return // alert('SDK not loaded')
    try {
      const address = (window as any).CrossSdk?.AccountController?.state?.address
      if (!address) return // alert('Connect wallet first')
      const gas = await window.CrossSdk.ConnectionController.estimateGas({
        chainNamespace: 'eip155',
        address,
        to: address
      })
      // alert(`Estimated gas: ${gas?.toString?.()}`)
    } catch (e) {
      console.error(e)
      // alert('Estimate gas failed')
    }
  }

  onClickParseAndFormatUnits() {
    if (!window.CrossSdk) return // alert('SDK not loaded')
    try {
      const amountStr = prompt('Amount in ether (e.g. 1.5)') || '1'
      const decimals = 18
      const wei = window.CrossSdk.ConnectionController.parseUnits(amountStr, decimals)
      const back = window.CrossSdk.ConnectionController.formatUnits(wei, decimals)
      // alert(`Wei: ${wei.toString()}\nBack to ether: ${back}`)
    } catch (e) {
      console.error(e)
      //  alert('Parse/format units failed')
    }
  }

  // 8) 토큰 잔고 조회(요약)
  async onClickFetchTokenBalances() {
    if (!window.CrossSdk) return // alert('SDK not loaded')
    try {
      const balances = await (window as any).CrossSdk.AccountController.fetchTokenBalance()
      // alert(`Tokens: ${balances?.length || 0}`)
      console.log('Token balances:', balances)
    } catch (e) {
      console.error(e)
      // alert('Fetch token balances failed')
    }
  }

  async onClickSendERC20() {
    if (!window.CrossSdk) return alert('SDK not loaded')
    if (this.isConnected() === false) {
      return alert('Connect wallet first')
    }
    try {
      const { chainId } = await this.getSdkSummary() // 이미 구현된 헬퍼
      if (!chainId) return // alert('Connect wallet first')
      const ERC20_ADDRESS = contractData[chainId as keyof typeof contractData].erc20
      const erc20 = ERC20_ADDRESS // 토큰 주소
      const caipContract = `eip155:${chainId}:${erc20}`

      const resTx = await window.CrossSdk.SendController.sendERC20Token({
        receiverAddress: '0xB09f7E5309982523310Af3eA1422Fcc2e3a9c379',
        contractAddress: caipContract, // ← CAIP-2 형식
        sendTokenAmount: 1,
        decimals: '18',
        gas: BigInt(147726), // optional (you can set this your calculated gas or skip it)
        maxFee: BigInt(3200000000), // optional (you can set this your calculated maxFee or skip it)
        maxPriorityFee: BigInt(2000000000), // optional (you can set this your calculated maxPriorityFee or skip it)
        customData: {
          metadata: 'Game Developer can add custom data to the transaction'
        },
        type: window.CrossSdk.ConstantsUtil.TRANSACTION_TYPE.DYNAMIC
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
    if (this.isConnected() === false) {
      return alert('Connect wallet first')
    }
    try {
      const address = (window as any).CrossSdk?.AccountController?.state?.address
      if (!address) return alert('Connect wallet first')

      // Get current chain ID
      const chainId = (window as any).CrossSdk?.NetworkController?.state?.caipNetwork?.id
        ? parseInt(
            (window as any).CrossSdk.NetworkController.state.caipNetwork.id.split(':')[1],
            10
          )
        : 1

      const typed = {
        domain: {
          name: 'Example',
          version: '1',
          chainId: chainId,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
        },
        message: {
          contents: 'hello from Cocos'
        },
        primaryType: 'Ping',
        types: {
          Ping: [{ name: 'contents', type: 'string' }]
        }
      }
      const sig = await window.CrossSdk.ConnectionController.signTypedDataV4(typed, {
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
    const connected = status === 'connected' && Boolean(address)

    // Connect 버튼
    this.connectButtonLabel.string = connected ? `Cross\nConnected` : `Cross\nConnect`

    // Connect + Auth 버튼
    if (this.connectWithAuthButtonLabel) {
      this.connectWithAuthButtonLabel.string = connected
        ? `Cross\nConnected\n(With SIWE)`
        : `Cross\nConnect\n(With SIWE)`
    }
  }

  // 요약 라벨 갱신: address / chainId / native balance
  async updateSummaryLabels() {
    try {
      const summary = await this.getSdkSummary()
      if (this.addressLabel) this.addressLabel.string = summary.address || 'Not connected'
      if (this.chainIdLabel) {
        this.chainIdLabel.string = summary.chainId
          ? this.getNetworkDisplayName(summary.chainId)
          : '-'
      }
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

  // 체인 ID에 따른 네트워크 이름 반환
  private getNetworkDisplayName(chainId: number): string {
    const networkNames: Record<number, string> = {
      612044: 'Cross Mainnet',
      612055: 'Cross Testnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
      8217: 'Kaia Mainnet',
      1001: 'Kaia Testnet',
      1: 'Ethereum Mainnet',
      11155111: 'Ethereum Testnet',
      2020: 'Ronin Mainnet',
      2021: 'Ronin Testnet'
    }
    const networkName = networkNames[chainId] || `Chain ${chainId}`
    return `${networkName}\n${chainId}`
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

    // 연결 상태 확인
    const isConnected = this.isConnected()
    const hasNoSession = !up?.session
    const isExtensionProvider = hasNoSession && isConnected

    // 연결되지 않은 경우 chainId를 반환하지 않음
    if (!isConnected) {
      return { address, chainIdHex, chainId, nativeBalance, nativeSymbol }
    }

    try {
      // 우선순위 1: SDK Instance의 getCaipNetwork() 메서드 사용
      // 익스텐션/모바일 지갑 모두 지원
      if (instance?.getCaipNetwork && typeof instance.getCaipNetwork === 'function') {
        try {
          const caipNetwork = instance.getCaipNetwork()
          // caipNetwork.id 또는 caipNetwork.chainId 확인
          const networkChainId = caipNetwork?.id || caipNetwork?.chainId
          if (networkChainId) {
            chainId = Number(networkChainId)
            chainIdHex = `0x${chainId.toString(16)}` as `0x${string}`
          }
        } catch (e) {
          console.warn('[getSdkSummary] getCaipNetwork() 실패:', e)
        }
      }

      // 우선순위 2: 익스텐션이 아닌 경우 UniversalProvider의 eth_chainId 요청 사용
      if (!chainId && !isExtensionProvider) {
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
      }
    } catch (e) {
      console.warn('[getSdkSummary] chainId 가져오기 실패:', e)
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
    if (this.isConnected() === false) {
      return alert('Connect wallet first')
    }

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
    // SDK 초기화 with SIWX (SIWE 인증 지원을 위해 필수!)
    if (window.CrossSdk && !window.CrossSdkInstance) {
      try {
        const projectId = '0979fd7c92ec3dbd8e78f433c3e5a523'
        const redirectUrl = window.location.href

        // SIWX 설정 생성
        const siwxConfig = window.CrossSdk.createDefaultSIWXConfig({
          statement: 'Sign in with your wallet to Cross SDK Cocos Creator Example',
          getNonce: async () => {
            // 데모용: 랜덤 nonce 생성 (프로덕션에서는 백엔드에서 가져와야 함)
            return (
              Math.random().toString(36).substring(2, 15) +
              Math.random().toString(36).substring(2, 15)
            )
          },
          verifyMessage: async ({ message, signature }: { message: any; signature: string }) => {
            // 데모용: 자동 승인 (프로덕션에서는 백엔드에서 검증해야 함)
            console.log('SIWX verifyMessage called')
            return true
          }
        })

        // SDK 인스턴스 생성 (싱글톤 패턴으로 자동 중복 방지)
        const mobileLinkValue = window.CrossSdk.ConstantsUtil?.getUniversalLink?.()

        window.CrossSdkInstance = window.CrossSdk.initCrossSdkWithParams({
          projectId,
          redirectUrl,
          metadata: {
            name: 'Cross SDK - Cocos Creator',
            description: 'Cross SDK integration with Cocos Creator',
            url: 'https://to.nexus',
            icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
          },
          themeMode: 'light',
          mobileLink: mobileLinkValue,
          siwx: siwxConfig
        })
      } catch (error) {
        console.error('Failed to initialize SDK:', error)
        alert(`SDK 초기화 실패: ${(error as Error).message}`)
      }
    }

    // 1) SDK 준비 후 provider 워밍업
    try {
      await this.warmupProviderIfAny()
    } catch {}

    // 2) 최초 연결 여부 판단 → 버튼 라벨 즉시 반영
    await this.checkInitialSessionActive()
    this.updateConnectButtonLabel()
    await this.updateSummaryLabels()

    // 3) 상태 변화 구독 (중복 방지)
    if (window.CrossSdk?.AccountController?.subscribeKey && !(this as any)._subsRegistered) {
      ;(this as any)._subsRegistered = true
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

    // 4) 포커스 복귀 시 재점검 (모바일 딥링크/탭 전환 대응, 중복 방지)
    if (!(this as any)._focusListenerRegistered) {
      ;(this as any)._focusListenerRegistered = true
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

    // 5) 네트워크 모달 이벤트 리스너 설정
    this.setupNetworkModalEvents()
  }
}
