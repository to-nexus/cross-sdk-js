import { ConnectorController, OptionsController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import { ConnectorUtil } from '../../utils/ConnectorUtil.js'
import styles from './styles.js'

@customElement('cross-w3m-connector-list')
export class W3mConnectorList extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property() public tabIdx?: number = undefined

  @state() private connectors = ConnectorController.state.connectors

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => (this.connectors = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const { custom, recent, announced, injected, multiChain, recommended, featured, external } =
      ConnectorUtil.getConnectorsByType(this.connectors)

    const enableWalletConnect = OptionsController.state.enableWalletConnect

    return html`
      <wui-flex flexDirection="column" gap="xs">
        ${custom?.length
          ? html`<cross-w3m-connect-custom-widget
              tabIdx=${ifDefined(this.tabIdx)}
            ></cross-w3m-connect-custom-widget>`
          : null}
        ${announced?.length
          ? html`<cross-w3m-connect-announced-widget
              tabIdx=${ifDefined(this.tabIdx)}
            ></cross-w3m-connect-announced-widget>`
          : null}
      </wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connector-list': W3mConnectorList
  }
}
