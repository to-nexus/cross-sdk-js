import type { BaseError, Platform } from '@to-nexus/appkit-core'
import {
  ChainController,
  ConnectionController,
  ConnectorController,
  ConstantsUtil,
  CoreHelperUtil,
  EventsController,
  ModalController,
  OptionsController,
  RouterController,
  SnackController,
  StorageUtil
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

@customElement('cross-w3m-connecting-wc-view')
export class W3mConnectingWcView extends LitElement {
  // -- Members ------------------------------------------- //
  private interval?: ReturnType<typeof setInterval> = undefined

  private lastRetry = Date.now()

  private wallet = RouterController.state.data?.wallet

  // -- State & Properties -------------------------------- //
  @state() private platform?: Platform = undefined

  @state() private platforms: Platform[] = []

  @state() private isSiwxEnabled = Boolean(OptionsController.state.siwx)

  public constructor() {
    super()
    this.determinePlatforms()
    console.log('W3mConnectingWcView - platforms: ', JSON.stringify(this.platforms))
    this.initializeConnection()
    this.interval = setInterval(
      this.initializeConnection.bind(this),
      ConstantsUtil.TEN_SEC_MS
    ) as unknown as NodeJS.Timeout
  }

  public override disconnectedCallback() {
    clearTimeout(this.interval)
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
    `
  }

  // -- Private ------------------------------------------- //
  private async initializeConnection(retry = false) {
    if (this.platform === 'browser') {
      /*
       * If the platform is browser it means the user is using a browser wallet,
       * in this case the connection is handled in cro-connecting-wc-browser component.
       */
      return
    }

    try {
      const { wcPairingExpiry, status } = ConnectionController.state
      if (retry || CoreHelperUtil.isPairingExpired(wcPairingExpiry) || status === 'connecting') {
        await ConnectionController.connectWalletConnect()
        this.finalizeConnection()
        if (!this.isSiwxEnabled) {
          ModalController.close()
        }
      }
    } catch (error) {
      EventsController.sendEvent({
        type: 'track',
        event: 'CONNECT_ERROR',
        properties: { message: (error as BaseError)?.message ?? 'Unknown' }
      })
      ConnectionController.setWcError(true)
      if (CoreHelperUtil.isAllowedRetry(this.lastRetry)) {
        SnackController.showError((error as BaseError).message ?? 'Declined')
        this.lastRetry = Date.now()
        this.initializeConnection(true)
      } else {
        SnackController.showError((error as BaseError).message ?? 'Connection error')
      }
    }
  }

  private finalizeConnection() {
    const { wcLinking, recentWallet } = ConnectionController.state

    if (wcLinking) {
      StorageUtil.setWalletConnectDeepLink(wcLinking)
    }

    if (recentWallet) {
      StorageUtil.setAppKitRecent(recentWallet)
    }

    EventsController.sendEvent({
      type: 'track',
      event: 'CONNECT_SUCCESS',
      properties: {
        method: wcLinking ? 'mobile' : 'qrcode',
        name: this.wallet?.name || 'Unknown'
      }
    })
  }

  private isCrossWalletInstalled(rdns: string): boolean {
    // 1차 체크: ANNOUNCED 커넥터에서 찾기 (더 신뢰할 수 있음)
    const currentConnectors = ConnectorController.state.connectors
    console.log('현재 커넥터들:', currentConnectors)
    const announced = currentConnectors.filter(c => c.type === 'ANNOUNCED' && c.id === rdns)
    console.log('필터링된 announced 커넥터들:', announced)

    if (announced && announced.length > 0) {
      console.log('ANNOUNCED 커넥터에서 Cross Wallet 발견됨')
      const browserConnector = announced[0]
      console.log('선택된 브라우저 커넥터:', browserConnector)
      return true
    }

    // 2차 체크: window.ethereum에서 Cross Wallet 전용 체크
    const isCrossWalletInWindow =
      typeof window !== 'undefined' && (window as any).ethereum && (window as any).ethereum[rdns]

    console.log('window.ethereum에서 Cross Wallet 체크:', !!isCrossWalletInWindow)

    if (isCrossWalletInWindow) {
      console.log('window.ethereum에서 Cross Wallet 발견됨')
      return true
    }

    console.log('Cross Wallet 브라우저 확장 프로그램을 찾을 수 없음')
    return false
  }

  private determinePlatforms() {
    if (!this.wallet) {
      this.platforms.push('qrcode')
      this.platform = 'qrcode'

      return
    }

    if (this.platform) {
      return
    }

    const { mobile_link, desktop_link, webapp_link, injected, rdns } = this.wallet
    const injectedIds = injected?.map(({ injected_id }) => injected_id).filter(Boolean) as string[]
    const browserIds = [...(rdns ? [rdns] : (injectedIds ?? []))]
    const isBrowser = OptionsController.state.isUniversalProvider ? false : browserIds.length
    const isMobileWc = mobile_link
    const isWebWc = webapp_link
    const isBrowserInstalled = ConnectionController.checkInstalled(browserIds)
    const isBrowserWc = isBrowser && isBrowserInstalled
    const isDesktopWc = desktop_link && !CoreHelperUtil.isMobile()

    // chuck added code
    // Special handling for Cross Wallet - provide both browser and QR options
    const isCrossWallet =
      this.wallet.name?.includes('Cross Wallet') || rdns === 'nexus.to.crosswallet.desktop'

    if (isCrossWallet && rdns) {
      console.log('Cross Wallet detected')

      // Safari나 모바일은 브라우저 익스텐션을 지원하지 않으므로 QR 코드만 표시
      const isSafari = CoreHelperUtil.isSafari()
      const isMobile = CoreHelperUtil.isMobile()

      if (isSafari || isMobile) {
        console.log('Safari나 모바일 환경 - QR 코드만 표시')
        this.platforms.push('qrcode')
        this.platform = 'qrcode'
        return
      }

      // 익스텐션 지원 브라우저(Chrome, Firefox 등)에서만 브라우저 탭 체크
      if (isBrowser && !ChainController.state.noAdapters) {
        console.log('익스텐션 지원 브라우저에서 Cross Wallet 설치 확인...')
        const isCrossWalletFound = this.isCrossWalletInstalled(rdns)

        if (isCrossWalletFound) {
          // 브라우저 탭을 먼저 추가 (UI에서 먼저 보이게 하기 위해)
          this.platforms.push('browser')
          // QR 코드 옵션도 추가
          this.platforms.push('qrcode')
          // Default to browser if extension is available
          this.platform = 'browser'
          console.log('Cross Wallet 확장프로그램 발견 - 브라우저 탭 우선 표시')
        } else {
          // 확장프로그램이 없으면 QR 코드만 (unsupported 탭은 제거)
          this.platforms.push('qrcode')
          this.platform = 'qrcode'
          console.log('Cross Wallet 확장프로그램 없음 - QR 코드만 표시')
        }
      } else {
        // 브라우저 환경이 아닌 경우 QR 코드만
        this.platforms.push('qrcode')
        this.platform = 'qrcode'
        console.log('Non-browser environment - QR only')
      }

      return
    }

    // Standard logic for other wallets
    if (isBrowserWc && !ChainController.state.noAdapters) {
      this.platforms.push('browser')
    }
    if (isMobileWc) {
      this.platforms.push(CoreHelperUtil.isMobile() ? 'mobile' : 'qrcode')
    }
    if (isWebWc) {
      this.platforms.push('web')
    }
    if (isDesktopWc) {
      this.platforms.push('desktop')
    }
    if (!isBrowserWc && isBrowser && !ChainController.state.noAdapters) {
      this.platforms.push('unsupported')
    }

    this.platform = this.platforms[0]
  }

  private platformTemplate() {
    console.log('this.platform', this.platform)
    switch (this.platform) {
      case 'browser':
        return html`<cross-w3m-connecting-wc-browser></cross-w3m-connecting-wc-browser>`
      case 'web':
        return html`<cross-w3m-connecting-wc-web></cross-w3m-connecting-wc-web>`
      case 'desktop':
        return html`
          <cross-w3m-connecting-wc-desktop .onRetry=${() => this.initializeConnection(true)}>
          </cross-w3m-connecting-wc-desktop>
        `
      case 'mobile':
        return html`
          <cross-w3m-connecting-wc-mobile
            isMobile
            .onRetry=${() => this.initializeConnection(true)}
          >
          </cross-w3m-connecting-wc-mobile>
        `
      case 'qrcode':
        return html`<cross-w3m-connecting-wc-qrcode></cross-w3m-connecting-wc-qrcode>`
      default:
        return html`<cross-w3m-connecting-wc-unsupported></cross-w3m-connecting-wc-unsupported>`
    }
  }

  private headerTemplate() {
    const multiPlatform = this.platforms.length > 1

    if (!multiPlatform) {
      return null
    }

    return html`
      <cross-w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </cross-w3m-connecting-header>
    `
  }

  private async onSelectPlatform(platform: Platform) {
    const container = this.shadowRoot?.querySelector('div')
    if (container) {
      await container.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      }).finished
      this.platform = platform
      container.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-view': W3mConnectingWcView
  }
}
