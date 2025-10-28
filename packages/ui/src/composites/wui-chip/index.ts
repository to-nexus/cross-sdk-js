import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { ChipType, IconType, SizeType } from '../../utils/TypeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-chip')
export class WuiChip extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public variant: ChipType = 'fill'

  @property() public imageSrc?: string = undefined

  @property() public imageIcon?: IconType = undefined

  @property() public imageIconSize: SizeType = 'md'

  @property({ type: Boolean }) public disabled = false

  @property() public icon: IconType = 'externalLink'

  @property() public href = ''

  @property() public text?: string = undefined

  // -- Render -------------------------------------------- //
  public override render() {
    const isSmall =
      this.variant === 'success' || this.variant === 'transparent' || this.variant === 'shadeSmall'
    const textVariant = isSmall ? 'small-600' : 'paragraph-600'

    return html`
      <a
        rel="noreferrer"
        target="_blank"
        href=${this.href}
        class=${this.disabled ? 'disabled' : ''}
        data-variant=${this.variant}
      >
        ${this.imageTemplate()}
        <cross-wui-text variant=${textVariant} color="inherit">
          ${this.title ? this.title : UiHelperUtil.getHostName(this.href)}
        </cross-wui-text>
        <cross-wui-icon name=${this.icon} color="inherit" size="inherit"></cross-wui-icon>
      </a>
    `
  }

  // -- Private ------------------------------------------- //
  private imageTemplate() {
    if (this.imageSrc) {
      return html`<cross-wui-image src=${this.imageSrc}></cross-wui-image>`
    }

    if (this.imageIcon) {
      return html`<cross-wui-icon
        name=${this.imageIcon}
        color="inherit"
        size=${this.imageIconSize}
        class="image-icon"
      ></cross-wui-icon>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-chip': WuiChip
  }
}
