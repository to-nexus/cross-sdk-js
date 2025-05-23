import {
  ApiController,
  CoreHelperUtil,
  OptionsController,
  StorageUtil
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

@customElement('cross-w3m-connecting-wc-basic-view')
export class W3mConnectingWcBasicView extends LitElement {
  @state() private isMobile = CoreHelperUtil.isMobile()

  // -- Render -------------------------------------------- //
  public override render() {
    if (this.isMobile) {
      const { featured, recommended } = ApiController.state
      const { customWallets } = OptionsController.state
      const recent = StorageUtil.getRecentWallets()

      const showConnectors =
        featured.length || recommended.length || customWallets?.length || recent.length

      return html`<wui-flex
        flexDirection="column"
        gap="xs"
        .margin=${['3xs', 's', 's', 's'] as const}
      >
        ${showConnectors ? html`<cross-w3m-connector-list></cross-w3m-connector-list>` : null}
        <cross-w3m-all-wallets-widget></cross-w3m-all-wallets-widget>
      </wui-flex>`
    }

    return html`<wui-flex flexDirection="column" .padding=${['0', '0', 'l', '0'] as const}>
      <cross-w3m-connecting-wc-view></cross-w3m-connecting-wc-view>
      <wui-flex flexDirection="column" .padding=${['0', 'm', '0', 'm'] as const}>
        <cross-w3m-all-wallets-widget></cross-w3m-all-wallets-widget> </wui-flex
    ></wui-flex>`
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-basic-view': W3mConnectingWcBasicView
  }
}
