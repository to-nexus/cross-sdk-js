import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-promo')
export class WuiPromo extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() text = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<button>
      <cross-wui-text variant="small-600" color="bg-100">${this.text}</cross-wui-text>
      <cross-wui-icon color="bg-100" size="xs" name="arrowRight"></cross-wui-icon>
    </button>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-promo': WuiPromo
  }
}
