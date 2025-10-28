import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-details-group-item')
export class WuiDetailsGroupItem extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public name = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex justifyContent="space-between" alignItems="center">
        <cross-wui-text variant="paragraph-500" color="fg-200">${this.name}</cross-wui-text>
        <cross-wui-flex gap="xs" alignItems="center">
          <slot></slot>
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-details-group-item': WuiDetailsGroupItem
  }
}
