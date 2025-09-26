import {
  AssetUtil,
  ConnectionController,
  CoreHelperUtil,
  EventsController,
  ThemeController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'

import { W3mConnectingWidget } from '../../utils/w3m-connecting-widget/index.js'
import styles from './styles.js'

@customElement('cross-w3m-connecting-wc-qrcode')
export class W3mConnectingWcQrcode extends W3mConnectingWidget {
  public static override styles = styles

  public constructor() {
    super()
    window.addEventListener('resize', this.forceUpdate)

    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WALLET',
      properties: { name: this.wallet?.name ?? 'CROSS Wallet', platform: 'qrcode' }
    })
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    this.unsubscribe?.forEach(unsub => unsub())
    window.removeEventListener('resize', this.forceUpdate)
  }

  // -- Render -------------------------------------------- //
  public override render() {
    this.onRenderProxy()

    // 가로모드에서는 QR 코드만 표시
    if (CoreHelperUtil.isMobileLandscape()) {
      return html`
        <wui-flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          .padding=${['0', '0', '0', '0']}
          gap="0"
          style="width: 100%; height: 100%;"
        >
          ${this.ready && this.uri
            ? html` ${this.qrCodeTemplate()} `
            : html`
                <wui-shimmer
                  borderRadius="l"
                  width="270px"
                  height="270px"
                  style="width: 270px; height: 270px; max-width: 270px; max-height: 270px;"
                >
                </wui-shimmer>
              `}
        </wui-flex>
      `
    }

    // 세로모드에서는 기존 UI 유지
    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['0', 'xl', 'xl', 'xl']}
        gap="xl"
      >
        <wui-shimmer borderRadius="l" width="100%" style="max-width:300px;">
          ${this.qrCodeTemplate()}
        </wui-shimmer>

        <wui-text variant="paragraph-500" color="fg-100">
          Scan this QR Code with your phone
        </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <cross-w3m-mobile-download-links .wallet=${this.wallet}></cross-w3m-mobile-download-links>
    `
  }

  // -- Private ------------------------------------------- //
  private onRenderProxy() {
    if (!this.ready && this.uri) {
      // This setTimeout needed to avoid the beginning of the animation from not starting to resize immediately and some weird svg errors
      this.timeout = setTimeout(() => {
        this.ready = true
      }, 200)
    }
  }

  private qrCodeTemplate() {
    if (!this.uri || !this.ready) {
      return null
    }

    const size = this.getBoundingClientRect().width - 40
    const alt = this.wallet ? this.wallet.name : 'CROSS Wallet'
    ConnectionController.setWcLinking(undefined)
    ConnectionController.setRecentWallet(this.wallet)

    return html` <wui-qr-code
      size=${size}
      theme=${ThemeController.state.themeMode}
      uri=${this.uri}
      imageSrc=${ifDefined(AssetUtil.getWalletImage(this.wallet))}
      color=${ifDefined(ThemeController.state.themeVariables['--w3m-qr-color'])}
      alt=${ifDefined(alt)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`
  }

  private copyTemplate() {
    const inactive = !this.uri || !this.ready

    return html`<wui-link
      .disabled=${inactive}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`
  }

  private forceUpdate = () => {
    this.requestUpdate()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-qrcode': W3mConnectingWcQrcode
  }
}
