import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-tooltip/index.js'
import styles from './styles.js'

@customElement('cross-wui-icon-button')
export class WuiIconButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() text = ''

  @property() icon: IconType = 'card'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<button>
      <cross-wui-icon color="accent-100" name=${this.icon} size="lg"></cross-wui-icon>
    </button>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-icon-button': WuiIconButton
  }
}
