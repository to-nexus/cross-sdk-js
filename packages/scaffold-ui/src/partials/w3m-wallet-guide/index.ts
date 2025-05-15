import { RouterController, type WalletGuideType } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cro-wallet-guide')
export class W3mWalletGuide extends LitElement {
  public static override styles = styles

  // -- State & Properties -------------------------------- //
  @property() public tabIdx?: -1 | boolean

  @property() public walletGuide: WalletGuideType = 'get-started'

  // -- Render -------------------------------------------- //
  public override render() {
    return this.walletGuide === 'explore'
      ? html`<wui-flex
          class="wallet-guide"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          rowGap="xs"
          data-testid="cro-wallet-guide-explore"
        >
          <wui-text variant="small-400" color="fg-200" align="center">
            Looking for a self-custody wallet?
          </wui-text>

          <wui-flex class="chip-box">
            <wui-chip
              imageIcon="walletConnectLightBrown"
              icon="externalLink"
              variant="transparent"
              href="https://walletguide.walletconnect.network"
              title="Find one on WalletGuide"
            ></wui-chip>
          </wui-flex>
        </wui-flex>`
      : html`<wui-flex
          columnGap="4xs"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          <wui-text variant="small-400" class="title" color="fg-200"
            >Haven't got a wallet?</wui-text
          >
          <wui-link
            data-testid="cro-wallet-guide-get-started"
            color="blue-100"
            class="get-started-link"
            @click=${this.onGetStarted}
            tabIdx=${ifDefined(this.tabIdx)}
          >
            Get started
          </wui-link>
        </wui-flex>`
  }

  // -- Private ------------------------------------------- //
  private onGetStarted() {
    RouterController.push('Create')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cro-wallet-guide': W3mWalletGuide
  }
}
