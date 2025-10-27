import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-list-content')
export class WuiListContent extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public imageSrc?: string = undefined

  @property() public textTitle = ''

  @property() public textValue?: string = undefined

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex justifyContent="space-between" alignItems="center">
        <cross-wui-text variant="paragraph-500" color=${this.textValue ? 'fg-200' : 'fg-100'}>
          ${this.textTitle}
        </cross-wui-text>
        ${this.templateContent()}
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateContent() {
    if (this.imageSrc) {
      return html`<cross-wui-image src=${this.imageSrc} alt=${this.textTitle}></cross-wui-image>`
    } else if (this.textValue) {
      return html` <cross-wui-text variant="paragraph-400" color="fg-100"> ${this.textValue} </cross-wui-text>`
    }

    return html`<cross-wui-icon size="inherit" color="fg-200" name="networkPlaceholder"></cross-wui-icon>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-list-content': WuiListContent
  }
}
