import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-avatar/index.js'
import styles from './styles.js'

@customElement('cross-wui-preview-item')
export class WuiPreviewItem extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public text = ''

  @property() public address = ''

  @property() public imageSrc?: string

  @property({ type: Boolean }) public isAddress = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<cross-wui-text variant="large-500" color="fg-100">${this.text}</cross-wui-text>
      ${this.imageTemplate()}`
  }

  // -- Private ------------------------------------------- //
  private imageTemplate() {
    if (this.isAddress) {
      return html`<cross-wui-avatar address=${this.address} .imageSrc=${this.imageSrc}></cross-wui-avatar>`
    } else if (this.imageSrc) {
      return html`<cross-wui-image src=${this.imageSrc}></cross-wui-image>`
    }

    return html`<cross-wui-icon size="inherit" color="fg-200" name="networkPlaceholder"></cross-wui-icon>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-preview-item': WuiPreviewItem
  }
}
