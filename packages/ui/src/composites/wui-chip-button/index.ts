import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { ChipButtonVariant, IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-chip-button')
export class WuiChipButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public variant: ChipButtonVariant = 'accent'

  @property() public imageSrc = ''

  @property({ type: Boolean }) public disabled = false

  @property() public icon: IconType = 'externalLink'

  @property() public size: 'sm' | 'md' = 'md'

  @property() public text = ''

  // -- Render -------------------------------------------- //
  public override render() {
    const textVariant = this.size === 'sm' ? 'small-600' : 'paragraph-600'

    return html`
      <button
        class=${this.disabled ? 'disabled' : ''}
        data-variant=${this.variant}
        data-size=${this.size}
      >
        ${this.imageSrc ? html`<cross-wui-image src=${this.imageSrc}></cross-wui-image>` : null}
        <cross-wui-text variant=${textVariant} color="inherit"> ${this.text} </cross-wui-text>
        <cross-wui-icon name=${this.icon} color="inherit" size="inherit"></cross-wui-icon>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-chip-button': WuiChipButton
  }
}
