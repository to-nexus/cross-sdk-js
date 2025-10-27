import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

@customElement('cross-wui-network-button')
export class WuiNetworkButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public imageSrc?: string = undefined

  @property({ type: Boolean }) public isUnsupportedChain?: boolean = undefined

  @property({ type: Boolean }) public disabled = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button data-testid="wui-network-button" ?disabled=${this.disabled}>
        ${this.visualTemplate()}
        <cross-wui-text variant="paragraph-600" color="inherit">
          <slot></slot>
        </cross-wui-text>
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private visualTemplate() {
    if (this.isUnsupportedChain) {
      return html`
        <cross-wui-icon-box
          size="sm"
          iconColor="error-100"
          backgroundColor="error-100"
          icon="warningCircle"
        ></cross-wui-icon-box>
      `
    }
    if (this.imageSrc) {
      return html`<cross-wui-image src=${this.imageSrc}></cross-wui-image>`
    }

    return html`
      <cross-wui-icon-box
        size="sm"
        iconColor="inverse-100"
        backgroundColor="fg-100"
        icon="networkPlaceholder"
      ></cross-wui-icon-box>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-network-button': WuiNetworkButton
  }
}
