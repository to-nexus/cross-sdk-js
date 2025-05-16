import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

import styles from './styles.js'

@customElement('cross-w3m-account-activity-widget')
export class W3mAccountActivityWidget extends LitElement {
  public static override styles = styles

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<cross-w3m-activity-list page="account"></cross-w3m-activity-list>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-account-activity-widget': W3mAccountActivityWidget
  }
}
