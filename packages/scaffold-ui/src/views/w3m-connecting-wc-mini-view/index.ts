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

import '../../partials/w3m-connecting-wc-browser/index.js'
import '../../partials/w3m-connecting-wc-mobile/index.js'
import '../../partials/w3m-connecting-wc-qrcode/index.js'
import styles from './styles.js'

@customElement('cross-w3m-connecting-wc-mini-view')
export class W3mConnectingWcMiniView extends LitElement {
  public static override styles = styles

  private interval?: ReturnType<typeof setInterval> = undefined
  private lastRetry = Date.now()
  private wallet = RouterController.state.data?.wallet

  @state() private platform?: Platform = undefined
  @state() private platforms: Platform[] = []
  @state() private isSiwxEnabled = Boolean(OptionsController.state.siwx)

  public constructor() {
    super()
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

  public override render() {
    console.log('🔍 [MiniView] Rendering:', {
      platform: this.platform,
      platforms: this.platforms,
      wallet: this.wallet?.name
    })

    return html`
      <div class="mini-container" @click=${this.onTogglePlatform.bind(this)}>
        ${this.platformTemplate()}
      </div>
    `
  }

  private async initializeConnection(retry = false) {
    if (this.platform === 'browser') {
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
    const currentConnectors = ConnectorController.state.connectors
    const announced = currentConnectors.filter(c => c.type === 'ANNOUNCED' && c.id === rdns)

    if (announced && announced.length > 0) {
      return true
    }

    const isCrossWalletInWindow =
      typeof window !== 'undefined' && (window as any).ethereum && (window as any).ethereum[rdns]

    return Boolean(isCrossWalletInWindow)
  }

  private determinePlatformsForCross(params: {
    mobile_link?: string | null
    rdns?: string
    isBrowser: boolean
  }): boolean {
    const { mobile_link, rdns, isBrowser } = params
    const isMobile = CoreHelperUtil.isMobile()

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

    if (isBrowser && !ChainController.state.noAdapters && rdns) {
      const isChrome = CoreHelperUtil.isChrome()
      const isCrossWalletFound = this.isCrossWalletInstalled(rdns)

      if (isCrossWalletFound) {
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

    const isCrossWallet =
      this.wallet.name?.includes('CROSS Wallet') || rdns === 'nexus.to.crosswallet.desktop'

    if (isCrossWallet && rdns) {
      this.determinePlatformsForCross({ mobile_link, rdns, isBrowser: Boolean(isBrowser) })
      return
    }

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
    console.log('🔍 [MiniView] Platform template:', this.platform)

    switch (this.platform) {
      case 'browser':
        return html`<cross-w3m-connecting-wc-browser></cross-w3m-connecting-wc-browser>`
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
        console.warn('🔍 [MiniView] Unknown platform, using qrcode')
        return html`<cross-w3m-connecting-wc-qrcode></cross-w3m-connecting-wc-qrcode>`
    }
  }

  private platformIndicatorTemplate() {
    const currentIndex = this.platforms.indexOf(this.platform!)
    const platformLabels = {
      browser: 'Extension',
      mobile: 'Mobile',
      qrcode: 'QR Code',
      web: 'Web',
      desktop: 'Desktop',
      unsupported: 'Unsupported'
    }

    return html`
      <div class="platform-indicator">
        <wui-text variant="small-400" color="fg-200">
          ${platformLabels[this.platform!] || 'Unknown'}
          (${currentIndex + 1}/${this.platforms.length})
        </wui-text>
      </div>
    `
  }

  private async onTogglePlatform() {
    // 플랫폼이 1개면 토글 불필요
    if (this.platforms.length <= 1) {
      return
    }

    const container = this.shadowRoot?.querySelector('.mini-container')
    if (container) {
      // 페이드 아웃
      await (container as HTMLElement).animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 150,
        fill: 'forwards',
        easing: 'ease'
      }).finished

      // 다음 플랫폼으로 전환
      const currentIndex = this.platforms.indexOf(this.platform!)
      const nextIndex = (currentIndex + 1) % this.platforms.length
      this.platform = this.platforms[nextIndex]

      // 페이드 인
      ;(container as HTMLElement).animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 150,
        fill: 'forwards',
        easing: 'ease'
      })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-mini-view': W3mConnectingWcMiniView
  }
}
