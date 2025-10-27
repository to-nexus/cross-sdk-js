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
    const { custom, announced } = ConnectorUtil.getConnectorsByType(this.connectors)
    const hasAnnounced = Boolean(announced && announced?.length > 0)
    const hasCustom = Boolean(custom && custom?.length > 0)

    // 🔍 디버그 포인트 2
    console.log('🔌 ConnectorList Debug:', {
      connectors: this.connectors,
      custom,
      announced,
      hasAnnounced,
      hasCustom
    })

    return html`
      <cross-wui-flex flexDirection="column" gap="xs">
        ${this.renderConnectorWidget(hasAnnounced, hasCustom)}
      </cross-wui-flex>
    `
  }

  private renderConnectorWidget(hasAnnounced: boolean, hasCustom: boolean) {
    // 1. desktop Wallet 이 있는 경우엔 desktop Wallet 위젯을 렌더링
    if (hasAnnounced) {
      return html`
        <cross-w3m-connect-announced-widget
          tabIdx=${ifDefined(this.tabIdx)}
        ></cross-w3m-connect-announced-widget>
      `
    }
    // 2. desktop Wallet 이 없는 경우엔 crossx wallet을 렌더링
    if (!hasAnnounced && hasCustom) {
      return html`
        <cross-w3m-connect-custom-widget
          tabIdx=${ifDefined(this.tabIdx)}
        ></cross-w3m-connect-custom-widget>
      `
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connector-list': W3mConnectorList
  }
}
