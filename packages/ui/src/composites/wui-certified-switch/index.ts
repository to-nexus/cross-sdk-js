import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-certified-switch')
export class WuiCertifiedSwitch extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Boolean }) public checked?: boolean = undefined

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button>
        <cross-wui-icon size="xl" name="walletConnectBrown"></cross-wui-icon>
        <cross-wui-switch ?checked=${ifDefined(this.checked)}></cross-wui-switch>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-certified-switch': WuiCertifiedSwitch
  }
}
