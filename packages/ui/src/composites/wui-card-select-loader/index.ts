import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import { networkSvgMd } from '../../assets/svg/networkMd.js'
import '../../components/wui-shimmer/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { CardSelectType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-card-select-loader')
export class WuiCardSelectLoader extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public type: CardSelectType = 'wallet'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      ${this.shimmerTemplate()}
      <cross-wui-shimmer width="56px" height="20px" borderRadius="xs"></cross-wui-shimmer>
    `
  }

  private shimmerTemplate() {
    if (this.type === 'network') {
      return html` <cross-wui-shimmer
          data-type=${this.type}
          width="48px"
          height="54px"
          borderRadius="xs"
        ></cross-wui-shimmer>
        ${networkSvgMd}`
    }

    return html`<cross-wui-shimmer width="56px" height="56px" borderRadius="xs"></cross-wui-shimmer>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-card-select-loader': WuiCardSelectLoader
  }
}
