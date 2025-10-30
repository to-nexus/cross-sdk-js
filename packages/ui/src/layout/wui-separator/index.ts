import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-text/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-separator')
export class WuiSeparator extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public text? = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`${this.template()}`
  }

  // -- Private ------------------------------------------- //
  private template() {
    if (this.text) {
      return html`<cross-wui-text variant="small-500" color="fg-200">${this.text}</cross-wui-text>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-separator': WuiSeparator
  }
}
