import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-image/index.js'
import '../../components/wui-loading-spinner/index.js'
import '../../components/wui-text/index.js'
import '../../composites/wui-icon-box/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-wallet-button')
export class WuiWalletButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public imageSrc? = ''

  @property() public name? = ''

  @property({ type: Boolean }) public walletConnect = false

  @property({ type: Boolean }) public icon?: IconType

  @property({ type: Boolean }) public loading = false

  @property({ type: Boolean }) public error = false

  @property({ type: Boolean }) public disabled = false

  @property({ type: Boolean }) public shake = false

  // -- Render -------------------------------------------- //
  public override render() {
    this.dataset['error'] = `${this.error}`

    return html`
      <button ?disabled=${this.disabled}>
        ${this.leftViewTemplate()} ${this.rightViewTemplate()}
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private leftViewTemplate() {
    if (this.error) {
      return html`<cross-wui-icon-box
        icon="warningCircle"
        iconColor="error-100"
        backgroundColor="error-100"
        size="sm"
        iconSize="xs"
      ></cross-wui-icon-box>`
    }

    if (this.loading) {
      return html`<cross-wui-loading-spinner size="md" color="fg-100"></cross-wui-loading-spinner>`
    }

    if (this.icon) {
      return html`<cross-wui-icon size="xl" color="inherit" name=${this.icon}></cross-wui-icon>`
    }

    if (this.imageSrc) {
      return html`<cross-wui-image src=${this.imageSrc} alt=${this.name}></cross-wui-image>`
    }

    return html`<cross-wui-icon size="xl" color="fg-100" name="walletPlaceholder"></cross-wui-icon>`
  }

  private rightViewTemplate() {
    return html`
      <cross-wui-text variant="paragraph-500" color="fg-100">${this.name || 'Unknown'} </cross-wui-text>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-wallet-button': WuiWalletButton
  }
}
