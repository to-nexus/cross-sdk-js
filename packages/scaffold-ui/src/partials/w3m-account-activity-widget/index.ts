import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

import styles from './styles.js'

@customElement('cro-account-activity-widget')
export class W3mAccountActivityWidget extends LitElement {
  public static override styles = styles

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<cro-activity-list page="account"></cro-activity-list>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cro-account-activity-widget': W3mAccountActivityWidget
  }
}
