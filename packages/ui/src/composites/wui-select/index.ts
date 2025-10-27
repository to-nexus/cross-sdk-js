import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../composites/wui-icon-box/index.js'
import { colorStyles, elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-select')
export class WuiSelect extends LitElement {
  public static override styles = [resetStyles, elementStyles, colorStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public imageSrc = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<button>
      ${this.imageTemplate()}
      <cross-wui-icon size="xs" color="fg-200" name="chevronBottom"></cross-wui-icon>
    </button>`
  }

  // -- Private ------------------------------------------- //
  private imageTemplate() {
    if (this.imageSrc) {
      return html`<cross-wui-image src=${this.imageSrc} alt="select visual"></cross-wui-image>`
    }

    return html`<cross-wui-icon-box
      size="xxs"
      iconColor="fg-200"
      backgroundColor="fg-100"
      background="opaque"
      icon="networkPlaceholder"
    ></cross-wui-icon-box>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-select': WuiSelect
  }
}
