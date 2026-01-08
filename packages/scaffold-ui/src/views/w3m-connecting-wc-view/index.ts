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

    /*
     * 🔑 핵심 수정: initializeConnection() 호출 전에 localStorage 저장!
     *
     * 문제:
     * - initializeConnection() → connectWalletConnect() → Engine이 localStorage 읽기
     * - 하지만 Mobile/QR 컴포넌트 렌더링은 비동기로 나중에 실행됨
     * - iPhone 16e 같은 느린 기기에서는 타이밍 차이로 localStorage가 비어있음
     *
     * 해결:
     * - initializeConnection() 호출 전에 여기서 먼저 저장 ✅
     * - Engine이 localStorage를 읽을 때 이미 값이 있음
     */
    if (this.wallet?.mobile_link && CoreHelperUtil.isMobile()) {
      const { mobile_link, name } = this.wallet

      if (mobile_link && mobile_link.trim() !== '') {
        // Deep Link는 슬래시 추가하지 않음
        const isDeepLink = mobile_link.startsWith('crossx://')
        const baseUrl = isDeepLink
          ? mobile_link
          : mobile_link.endsWith('/')
            ? mobile_link
            : `${mobile_link}/`

        ConnectionController.setWcLinking({ name, href: baseUrl })
        StorageUtil.setWalletConnectDeepLink({ name, href: baseUrl })
      }
    }

    this.determinePlatforms()
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

    /*
     * 모바일 환경에서만 Deep Link 저장 (데스크탑에서는 저장하지 않아 리다이렉트 방지)
     * href가 빈 문자열이 아닌 경우만 저장
     */
    if (wcLinking?.href && wcLinking.href.trim() !== '' && CoreHelperUtil.isMobile()) {
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
    // ANNOUNCED 커넥터에서 찾기
    const currentConnectors = ConnectorController.state.connectors
    const crossWalletExtensionConnectors = currentConnectors.filter(
      c => (c.type === 'ANNOUNCED' || c.type === 'INJECTED') && c.id === rdns
    )

    if (crossWalletExtensionConnectors && crossWalletExtensionConnectors.length > 0) {
      return true
    }

    // Window.ethereum에서 cross extension 프로바이더 체크
    const isCrossWalletInWindow = typeof window !== 'undefined' && (window as any).crossWallet

    return Boolean(isCrossWalletInWindow)
  }

  private determinePlatformsForCross(params: {
    mobile_link?: string | null
    rdns?: string
    isBrowser: boolean
  }): boolean {
    const { mobile_link, rdns, isBrowser } = params
    const isMobile = CoreHelperUtil.isMobile()

    // 모바일 환경 처리
    if (isMobile) {
      if (mobile_link) {
        this.platforms.push('mobile')
        this.platforms.push('qrcode')
        this.platform = 'mobile'
      } else {
        this.platforms.push('qrcode')
        this.platform = 'qrcode'
      }

      return true
    }

    // 익스텐션 지원 브라우저에서 CROSSx Wallet 확인
    if (isBrowser && !ChainController.state.noAdapters && rdns) {
      const isChrome = CoreHelperUtil.isChrome()
      const isCrossWalletFound = this.isCrossWalletInstalled(rdns)

      if (isCrossWalletFound) {
        // Console.log('isCrossWalletFound', isCrossWalletFound)
        if (isChrome) {
          this.platforms.push('qrcode')
          this.platforms.push('browser')
          this.platform = 'qrcode'
        } else {
          this.platforms.push('qrcode')
          this.platform = 'qrcode'
        }
      } else {
        this.platforms.push('qrcode')
        this.platform = 'qrcode'
      }

      return true
    }

    // 기본 케이스
    this.platforms.push('qrcode')
    this.platform = 'qrcode'

    return true
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

    // Special handling for CROSSx Wallet
    const isCrossWallet =
      this.wallet.name?.includes('CROSSx Wallet') || rdns === 'nexus.to.crosswallet.desktop'

    if (isCrossWallet && rdns) {
      this.determinePlatformsForCross({ mobile_link, rdns, isBrowser: Boolean(isBrowser) })

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
