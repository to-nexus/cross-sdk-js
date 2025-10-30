import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-text/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-input-text/index.js'
import styles from './styles.js'

@customElement('cross-wui-email-input')
export class WuiEmailInput extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public errorMessage?: string

  @property({ type: Boolean }) public disabled = false

  @property() public value?: string

  @property() public tabIdx?: number

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-input-text
        type="email"
        placeholder="Email"
        icon="mail"
        size="mdl"
        .disabled=${this.disabled}
        .value=${this.value}
        data-testid="wui-email-input"
        tabIdx=${ifDefined(this.tabIdx)}
      ></cross-wui-input-text>
      ${this.templateError()}
    `
  }

  // -- Private ------------------------------------------- //
  private templateError() {
    if (this.errorMessage) {
      return html`<cross-wui-text variant="tiny-500" color="error-100">${this.errorMessage}</cross-wui-text>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-email-input': WuiEmailInput
  }
}
