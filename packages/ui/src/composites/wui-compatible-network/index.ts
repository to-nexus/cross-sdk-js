import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-compatible-network')
export class WuiCompatibleNetwork extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Array }) networkImages: string[] = ['']

  @property() public text = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button>
        <cross-wui-text variant="small-400" color="fg-200">${this.text}</cross-wui-text>
        <cross-wui-flex gap="3xs" alignItems="center">
          ${this.networksTemplate()}
          <cross-wui-icon name="chevronRight" size="sm" color="fg-200"></cross-wui-icon>
        </cross-wui-flex>
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private networksTemplate() {
    const slicedNetworks = this.networkImages.slice(0, 5)

    return html` <cross-wui-flex class="networks">
      ${slicedNetworks?.map(
        network =>
          html` <cross-wui-flex class="network-icon"> <cross-wui-image src=${network}></cross-wui-image> </cross-wui-flex>`
      )}
    </cross-wui-flex>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-compatible-network': WuiCompatibleNetwork
  }
}
