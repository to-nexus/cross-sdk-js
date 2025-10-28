import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

@customElement('cross-wui-banner')
export class WuiBanner extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //

  @property() public icon: IconType = 'externalLink'

  @property() public text = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex gap="1xs" alignItems="center">
        <cross-wui-icon-box
          size="sm"
          iconcolor="fg-200"
          backgroundcolor="fg-200"
          icon=${this.icon}
          background="transparent"
        ></cross-wui-icon-box>
        <cross-wui-text variant="small-400" color="fg-200">${this.text}</cross-wui-text>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-banner': WuiBanner
  }
}
