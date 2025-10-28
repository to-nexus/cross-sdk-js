import type { Connector } from '@to-nexus/appkit-core'
import {
  AssetController,
  ConnectorController,
  CoreHelperUtil,
  RouterController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('cross-w3m-connect-walletconnect-widget')
export class W3mConnectWalletConnectWidget extends LitElement {
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property() public tabIdx?: number = undefined

  @state() private connectors = ConnectorController.state.connectors

  @state() private connectorImages = AssetController.state.connectorImages

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => (this.connectors = val)),
      AssetController.subscribeKey('connectorImages', val => (this.connectorImages = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (CoreHelperUtil.isMobile()) {
      this.style.cssText = `display: none`

      return null
    }

    const connector = this.connectors.find(
      c => c.id === 'walletConnect' || c.type === 'WALLET_CONNECT'
    )
    if (!connector) {
      this.style.cssText = `display: none`

      return null
    }

    const connectorImage = connector.imageUrl || this.connectorImages[connector?.imageId ?? '']

    return html`
      <cross-wui-list-wallet
        imageSrc=${ifDefined(connectorImage)}
        name=${connector.name ?? 'Unknown'}
        @click=${() => this.onConnector(connector)}
        tagLabel="qr code"
        tagVariant="main"
        tabIdx=${ifDefined(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
      >
      </cross-wui-list-wallet>
    `
  }

  // -- Private Methods ----------------------------------- //
  private onConnector(connector: Connector) {
    ConnectorController.setActiveConnector(connector)
    RouterController.push('ConnectingWalletConnect')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connect-walletconnect-widget': W3mConnectWalletConnectWidget
  }
}
