import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import { AlertController } from '@to-nexus/appkit-core'

import { resetStyles } from '../../utils/ThemeUtil.js'
import type { ColorType, IconType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-alertbar')
export class WuiAlertBar extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public message = ''

  @property() public backgroundColor: ColorType = 'accent-100'

  @property() public iconColor: ColorType = 'accent-100'

  @property() public icon: IconType = 'info'

  // -- Render -------------------------------------------- //
  public override render() {
    this.style.cssText = `
      --local-icon-bg-value: var(--wui-color-${this.backgroundColor});
   `

    return html`
      <cross-wui-flex flexDirection="row" justifyContent="space-between" alignItems="center">
        <cross-wui-flex columnGap="xs" flexDirection="row" alignItems="center">
          <cross-wui-flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            class="icon-box"
          >
            <cross-wui-icon color=${this.iconColor} size="md" name=${this.icon}></cross-wui-icon>
          </cross-wui-flex>
          <cross-wui-text variant="small-500" color="bg-350" data-testid="wui-alertbar-text"
            >${this.message}</wui-text
          >
        </cross-wui-flex>
        <cross-wui-icon
          class="close"
          color="bg-350"
          size="sm"
          name="close"
          @click=${this.onClose}
        ></cross-wui-icon>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private onClose() {
    AlertController.close()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-alertbar': WuiAlertBar
  }
}
