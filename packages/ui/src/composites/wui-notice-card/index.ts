import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-text/index.js'
import '../../composites/wui-button/index.js'
import '../../composites/wui-icon-box/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-notice-card')
export class WuiNoticeCard extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public label = ''

  @property() public description = ''

  @property() public icon: IconType = 'wallet'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button>
        <cross-wui-flex gap="m" alignItems="center" justifyContent="space-between">
          <cross-wui-icon-box
            size="lg"
            iconcolor="accent-100"
            backgroundcolor="accent-100"
            icon=${this.icon}
            background="transparent"
          ></cross-wui-icon-box>

          <cross-wui-flex flexDirection="column" gap="3xs">
            <cross-wui-text variant="paragraph-500" color="fg-100">${this.label}</cross-wui-text>
            <cross-wui-text variant="small-400" color="fg-200">${this.description}</cross-wui-text>
          </cross-wui-flex>

          <cross-wui-icon size="md" color="fg-200" name="chevronRight"></cross-wui-icon>
        </cross-wui-flex>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-notice-card': WuiNoticeCard
  }
}
