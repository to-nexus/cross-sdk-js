import { LitElement, html } from 'lit'

import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-details-group')
export class WuiDetailsGroup extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex gap="xl" flexDirection="column" justifyContent="space-between" alignItems="center">
        <slot></slot>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-details-group': WuiDetailsGroup
  }
}
