import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-list-token')
export class WuiListToken extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public tokenName = ''

  @property() public tokenImageUrl = ''

  @property({ type: Number }) public tokenValue = 0.0

  @property() public tokenAmount = '0.0'

  @property() public tokenCurrency = ''

  @property({ type: Boolean }) public clickable = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button data-clickable=${String(this.clickable)}>
        <cross-wui-flex gap="s" alignItems="center">
          ${this.visualTemplate()}
          <cross-wui-flex flexDirection="column" justifyContent="spaceBetween">
            <cross-wui-text variant="paragraph-500" color="fg-100">${this.tokenName}</cross-wui-text>
            <cross-wui-text variant="small-400" color="fg-200">
              ${UiHelperUtil.formatNumberToLocalString(this.tokenAmount, 4)} ${this.tokenCurrency}
            </cross-wui-text>
          </cross-wui-flex>
        </cross-wui-flex>
        <cross-wui-text variant="paragraph-500" color="fg-100">$${this.tokenValue.toFixed(2)}</cross-wui-text>
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  public visualTemplate() {
    if (this.tokenName && this.tokenImageUrl) {
      return html`<cross-wui-image alt=${this.tokenName} src=${this.tokenImageUrl}></cross-wui-image>`
    }

    return html`<cross-wui-icon name="coinPlaceholder" color="fg-100"></cross-wui-icon>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-list-token': WuiListToken
  }
}
