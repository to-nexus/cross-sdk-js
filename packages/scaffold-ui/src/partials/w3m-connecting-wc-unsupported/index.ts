import { AssetUtil, EventsController, RouterController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('cross-w3m-connecting-wc-unsupported')
export class W3mConnectingWcUnsupported extends LitElement {
  // -- Members ------------------------------------------- //
  private readonly wallet = RouterController.state.data?.wallet

  public constructor() {
    super()
    if (!this.wallet) {
      throw new Error('cross-w3m-connecting-wc-unsupported: No wallet provided')
    }
    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WALLET',
      properties: { name: this.wallet.name, platform: 'browser' }
    })
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['3xl', 'xl', 'xl', 'xl'] as const}
        gap="xl"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${ifDefined(AssetUtil.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="paragraph-500" color="fg-100">Not Detected</wui-text>
      </wui-flex>

      <cross-w3m-mobile-download-links .wallet=${this.wallet}></cross-w3m-mobile-download-links>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-unsupported': W3mConnectingWcUnsupported
  }
}
