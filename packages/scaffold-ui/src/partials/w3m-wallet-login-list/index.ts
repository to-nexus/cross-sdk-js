import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('cross-w3m-wallet-login-list')
export class W3mWalletLoginList extends LitElement {
  // -- State & Properties -------------------------------- //
  @property() public tabIdx?: number = undefined

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex flexDirection="column" gap="xs">
        <cross-w3m-connector-list tabIdx=${ifDefined(this.tabIdx)}></cross-w3m-connector-list>
        <cross-w3m-all-wallets-widget
          tabIdx=${ifDefined(this.tabIdx)}
        ></cross-w3m-all-wallets-widget>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-wallet-login-list': W3mWalletLoginList
  }
}
