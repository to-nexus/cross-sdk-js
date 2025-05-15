import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

import styles from './styles.js'

@customElement('cro-transactions-view')
export class W3mTransactionsView extends LitElement {
  public static override styles = styles

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" .padding=${['0', 'm', 'm', 'm']} gap="s">
        <cro-activity-list page="activity"></cro-activity-list>
      </wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cro-transactions-view': W3mTransactionsView
  }
}
