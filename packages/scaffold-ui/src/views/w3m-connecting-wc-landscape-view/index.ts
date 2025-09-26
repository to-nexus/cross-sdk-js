import type { BaseError, Platform } from '@to-nexus/appkit-core'
import {
  ConnectionController,
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

import '../../partials/w3m-connecting-header/index.js'
import '../../partials/w3m-connecting-wc-mobile/index.js'
import '../../partials/w3m-connecting-wc-qrcode/index.js'
import '../../partials/w3m-mobile-download-links/index.js'
import styles from './styles.js'

@customElement('cross-w3m-connecting-wc-landscape-view')
export class W3mConnectingWcLandscapeView extends LitElement {
  public static override styles = styles

  private interval?: ReturnType<typeof setInterval> = undefined
  private lastRetry = Date.now()
  private wallet = RouterController.state.data?.wallet

  @state() private selected: Platform = 'qrcode'
  @state() private platforms: Platform[] = []
  @state() private isSiwxEnabled = Boolean(OptionsController.state.siwx)

  public constructor() {
    super()
    this.determinePlatforms()
    this.initializeConnection()
    this.interval = setInterval(
      this.initializeConnection.bind(this),
      10000
    ) as unknown as NodeJS.Timeout
  }

  public override disconnectedCallback() {
    clearTimeout(this.interval)
  }

  public override render() {
    return html`
      <div class="landscape-container">
        <div class="landscape-left">${this.leftContentTemplate()}</div>
        <div class="landscape-right">
          <div class="landscape-tabs">${this.tabsTemplate()}</div>
          <div class="landscape-desc">${this.descriptionTemplate()}</div>
          <div class="landscape-store">${this.storeLinksTemplate()}</div>
        </div>
      </div>
    `
  }

  private async initializeConnection(retry = false) {
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
        method: this.selected === 'mobile' ? 'mobile' : 'qrcode',
        name: this.wallet?.name || 'Unknown'
      }
    })
  }

  private determinePlatforms() {
    if (!this.wallet) {
      this.platforms = ['mobile', 'qrcode']
      this.selected = 'qrcode'
      return
    }
    const { mobile_link } = this.wallet
    if (CoreHelperUtil.isMobile()) {
      if (mobile_link) {
        this.platforms = ['mobile', 'qrcode']
        this.selected = 'mobile'
      } else {
        this.platforms = ['qrcode']
        this.selected = 'qrcode'
      }
    } else {
      this.platforms = ['qrcode']
      this.selected = 'qrcode'
    }
  }

  private leftContentTemplate() {
    const wallet = this.wallet
    const mobileSupported = Boolean(wallet?.mobile_link)

    if (this.selected === 'mobile') {
      return mobileSupported && wallet
        ? html`<cross-w3m-connecting-wc-mobile isMobile></cross-w3m-connecting-wc-mobile>`
        : html`<wui-flex
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap="s"
            style="width:210px;height:210px"
          >
            <wui-icon-box size="md" icon="externalLink" background="opaque"></wui-icon-box>
            <wui-text variant="small-500" color="fg-200">모바일 딥링크 미지원</wui-text>
          </wui-flex>`
    }

    return html`<div class="qr-section">
      <cross-w3m-connecting-wc-qrcode></cross-w3m-connecting-wc-qrcode>
    </div>`
  }

  private tabsTemplate() {
    const platforms: Platform[] = ['mobile', 'qrcode']
    return html`<cross-w3m-connecting-header
      .platforms=${platforms}
      .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
    ></cross-w3m-connecting-header>`
  }

  private descriptionTemplate() {
    const title =
      this.selected === 'mobile' ? 'Continue on mobile' : 'Scan this QR Code with your phone'
    const desc =
      this.selected === 'mobile'
        ? 'Deep link to your selected wallet app to complete the connection.'
        : 'Scan the code with your phone camera or wallet app QR scanner.'

    return html`<wui-flex flexDirection="column" gap="xs" style="margin: var(--wui-spacing-m)">
      <wui-text variant="paragraph-500" color="fg-100">${title}</wui-text>
      <wui-text variant="small-500" color="fg-200">${desc}</wui-text>
    </wui-flex>`
  }

  private storeLinksTemplate() {
    return html`<div class="store-links">
      <wui-text variant="small-400" color="fg-200" align="center">
        <cross-w3m-mobile-download-links .wallet=${this.wallet}></cross-w3m-mobile-download-links>
      </wui-text>
    </div>`
  }

  private async onSelectPlatform(platform: Platform) {
    const container = this.shadowRoot?.querySelector('.landscape-left')
    if (container) {
      await container.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 150,
        fill: 'forwards',
        easing: 'ease'
      }).finished
      this.selected = platform
      container.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 150,
        fill: 'forwards',
        easing: 'ease'
      })
    } else {
      this.selected = platform
    }
  }

  private onCopyUri() {
    try {
      const uri = ConnectionController.state.wcUri
      if (uri) {
        CoreHelperUtil.copyToClopboard(uri)
        SnackController.showSuccess('Link copied')
      }
    } catch {
      SnackController.showError('Failed to copy')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-landscape-view': W3mConnectingWcLandscapeView
  }
}
