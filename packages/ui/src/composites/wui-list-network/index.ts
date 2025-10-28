import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-network-image/index.js'
import styles from './styles.js'

@customElement('cross-wui-list-network')
export class WuiListNetwork extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public imageSrc? = ''

  @property() public name = ''

  @property({ type: Boolean }) public disabled = false

  @property({ type: Boolean }) public selected = false

  @property({ type: Boolean }) public transparent = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button data-transparent=${this.transparent} ?disabled=${this.disabled}>
        <cross-wui-flex gap="s" alignItems="center">
          ${this.templateNetworkImage()}
          <cross-wui-text variant="paragraph-500" color="inherit">${this.name}</cross-wui-text></wui-flex
        >
        ${this.checkmarkTemplate()}
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private checkmarkTemplate() {
    if (this.selected) {
      return html`<cross-wui-icon size="sm" color="accent-100" name="checkmarkBold"></cross-wui-icon>`
    }

    return null
  }

  private templateNetworkImage() {
    if (this.imageSrc) {
      return html`<cross-wui-image size="sm" src=${this.imageSrc} name=${this.name}></cross-wui-image>`
    }
    if (!this.imageSrc) {
      return html`<cross-wui-network-image
        ?round=${true}
        size="md"
        name=${this.name}
      ></cross-wui-network-image>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-list-network': WuiListNetwork
  }
}
