import { ApiController, AssetUtil, CoreHelperUtil, OptionsController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'

const EXPLORER = 'https://walletconnect.com/explorer'

@customElement('cross-w3m-get-wallet-view')
export class W3mGetWalletView extends LitElement {
  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex flexDirection="column" .padding=${['0', 's', 's', 's']} gap="xs">
        ${this.recommendedWalletsTemplate()}
        <cross-wui-list-wallet
          name="Explore all"
          showAllWallets
          walletIcon="allWallets"
          icon="externalLink"
          @click=${() => {
            CoreHelperUtil.openHref('https://walletconnect.com/explorer?type=wallet', '_blank')
          }}
        ></cross-wui-list-wallet>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private recommendedWalletsTemplate() {
    const { recommended, featured } = ApiController.state
    const { customWallets } = OptionsController.state
    const wallets = [...featured, ...(customWallets ?? []), ...recommended].slice(0, 4)

    return wallets.map(
      wallet => html`
        <cross-wui-list-wallet
          name=${wallet.name ?? 'Unknown'}
          tagVariant="main"
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          @click=${() => {
            CoreHelperUtil.openHref(wallet.homepage ?? EXPLORER, '_blank')
          }}
        ></cross-wui-list-wallet>
      `
    )
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-get-wallet-view': W3mGetWalletView
  }
}
