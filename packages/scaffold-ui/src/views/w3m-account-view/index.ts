import { ConstantsUtil as CommonConstantsUtil } from '@to-nexus/appkit-common'
import { ChainController, ConnectorController, StorageUtil } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

@customElement('cross-w3m-account-view')
export class W3mAccountView extends LitElement {
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  @state() namespace = ChainController.state.activeChain

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
    this.unsubscribe.push(
      ChainController.subscribeKey('activeChain', namespace => {
        this.namespace = namespace
      })
    )
  }

  // -- Render -------------------------------------------- //

  public override render() {
    if (!this.namespace) {
      return null
    }

    const connectorId = StorageUtil.getConnectedConnectorId(this.namespace)
    const authConnector = ConnectorController.getAuthConnector()

    return html`
      ${authConnector && connectorId === CommonConstantsUtil.CONNECTOR_ID.AUTH
        ? this.walletFeaturesTemplate()
        : this.defaultTemplate()}
    `
  }

  // -- Private ------------------------------------------- //
  private walletFeaturesTemplate() {
    return html`<cross-w3m-account-wallet-features-widget></cross-w3m-account-wallet-features-widget>`
  }

  private defaultTemplate() {
    return html`<cross-w3m-account-default-widget></cross-w3m-account-default-widget>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-account-view': W3mAccountView
  }
}
