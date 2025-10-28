import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { PlacementType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-tooltip')
export class WuiTooltip extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public placement: PlacementType = 'top'

  @property() public variant: 'shade' | 'fill' = 'fill'

  @property() public message = ''

  // -- Render -------------------------------------------- //
  public override render() {
    this.dataset['variant'] = this.variant

    return html`<cross-wui-icon
        data-placement=${this.placement}
        color="fg-100"
        size="inherit"
        name=${this.variant === 'fill' ? 'cursor' : 'cursorTransparent'}
      ></cross-wui-icon>
      <cross-wui-text color="inherit" variant="small-500">${this.message}</cross-wui-text>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-tooltip': WuiTooltip
  }
}
