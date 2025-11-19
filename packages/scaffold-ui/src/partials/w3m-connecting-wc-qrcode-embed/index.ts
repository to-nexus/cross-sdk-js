import {
  ConnectionController,
  CoreHelperUtil,
  EventsController,
  ThemeController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'

import { W3mConnectingWidget } from '../../utils/w3m-connecting-widget/index.js'

@customElement('cross-w3m-connecting-wc-qrcode-embed')
export class W3mConnectingWcQrcodeEmbed extends W3mConnectingWidget {
  private resizeObserver?: ResizeObserver = undefined

  public constructor() {
    super()
    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WALLET',
      properties: { name: this.wallet?.name ?? 'CROSSx Wallet', platform: 'qrcode' }
    })
  }

  public override render() {
    this.onRenderProxy()

    return html`${this.qrCodeTemplate()}`
  }

  // -- Private ------------------------------------------- //
  private onRenderProxy() {
    if (!this.ready && this.uri) {
      this.timeout = setTimeout(() => {
        this.ready = true
      }, 200)
    }
  }

  public override firstUpdated() {
    this.resizeObserver = new ResizeObserver(() => this.requestUpdate())
    this.resizeObserver.observe(this)
    window.addEventListener('orientationchange', this.onResize, { passive: true })
    window.addEventListener('resize', this.onResize, { passive: true })
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    window.removeEventListener('orientationchange', this.onResize)
    window.removeEventListener('resize', this.onResize)
  }

  private onResize = () => this.requestUpdate()

  private qrCodeTemplate() {
    if (!this.uri || !this.ready) {
      return null
    }

    const rect = this.getBoundingClientRect()
    let size = Math.floor(Math.min(rect.width || 0, rect.height || 0))
    if (!size || size <= 0) {
      size = 200
    }
    const alt = this.wallet ? this.wallet.name : 'CROSSx Wallet'

    // ✅ QR Code 연결에서도 deep link 정보 저장 (모바일 지갑 자동 열기용)
    if (this.wallet?.mobile_link && this.uri) {
      const { mobile_link, name } = this.wallet
      const { href } = CoreHelperUtil.formatNativeUrl(mobile_link, this.uri)
      ConnectionController.setWcLinking({ name, href })
    } else {
      ConnectionController.setWcLinking(undefined)
    }

    ConnectionController.setRecentWallet(this.wallet)

    return html` <cross-wui-qr-code
      size=${size}
      theme=${ThemeController.state.themeMode}
      uri=${this.uri}
      imageSrc=${ifDefined(undefined)}
      color=${ifDefined(ThemeController.state.themeVariables['--w3m-qr-color'])}
      alt=${ifDefined(alt)}
      data-testid="wui-qr-code"
    ></cross-wui-qr-code>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-qrcode-embed': W3mConnectingWcQrcodeEmbed
  }
}
