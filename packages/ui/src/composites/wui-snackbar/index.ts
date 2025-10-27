import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-loading-spinner/index.js'
import '../../components/wui-text/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import type { ColorType, IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

@customElement('cross-wui-snackbar')
export class WuiSnackbar extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public backgroundColor: ColorType = 'accent-100'

  @property() public iconColor: ColorType = 'accent-100'

  @property() public icon: IconType = 'checkmark'

  @property() public message = ''

  @property() public loading = false

  @property() public iconType: 'default' | 'box' = 'default'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      ${this.templateIcon()}
      <cross-wui-text variant="paragraph-500" color="fg-100" data-testid="wui-snackbar-message"
        >${this.message}</wui-text
      >
    `
  }

  // -- Private ------------------------------------------- //
  private templateIcon() {
    if (this.loading) {
      return html`<cross-wui-loading-spinner size="md" color="accent-100"></cross-wui-loading-spinner>`
    }

    if (this.iconType === 'default') {
      return html`<cross-wui-icon size="xl" color=${this.iconColor} name=${this.icon}></cross-wui-icon>`
    }

    return html`<cross-wui-icon-box
      size="sm"
      iconSize="xs"
      iconColor=${this.iconColor}
      backgroundColor=${this.backgroundColor}
      icon=${this.icon}
      background="opaque"
    ></cross-wui-icon-box>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-snackbar': WuiSnackbar
  }
}
