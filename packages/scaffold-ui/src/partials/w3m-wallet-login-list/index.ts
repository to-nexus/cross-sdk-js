import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('cro-wallet-login-list')
export class W3mWalletLoginList extends LitElement {
  // -- State & Properties -------------------------------- //
  @property() public tabIdx?: number = undefined

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" gap="xs">
        <cro-connector-list tabIdx=${ifDefined(this.tabIdx)}></cro-connector-list>
        <cro-all-wallets-widget tabIdx=${ifDefined(this.tabIdx)}></cro-all-wallets-widget>
      </wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cro-wallet-login-list': W3mWalletLoginList
  }
}
