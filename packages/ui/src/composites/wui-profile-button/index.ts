import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { IconType } from '../../utils/TypeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-avatar/index.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

@customElement('cross-wui-profile-button')
export class WuiProfileButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public networkSrc?: string = undefined

  @property() public avatarSrc?: string = undefined

  @property() public profileName?: string = ''

  @property() public address = ''

  @property() public icon: IconType = 'chevronBottom'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<button data-testid="wui-profile-button">
      <cross-wui-flex gap="xs" alignItems="center">
        <cross-wui-avatar
          .imageSrc=${this.avatarSrc}
          alt=${this.address}
          address=${this.address}
        ></cross-wui-avatar>
        ${this.networkImageTemplate()}
        <cross-wui-flex gap="xs" alignItems="center">
          <cross-wui-text variant="large-600" color="fg-100">
            ${UiHelperUtil.getTruncateString({
              string: this.profileName || this.address,
              charsStart: this.profileName ? 18 : 4,
              charsEnd: this.profileName ? 0 : 4,
              truncate: this.profileName ? 'end' : 'middle'
            })}
          </cross-wui-text>
          <cross-wui-icon size="sm" color="fg-200" name=${this.icon}></cross-wui-icon>
        </cross-wui-flex>
      </cross-wui-flex>
    </button>`
  }

  // -- Private ------------------------------------------- //
  private networkImageTemplate() {
    if (this.networkSrc) {
      return html`<cross-wui-image src=${this.networkSrc}></cross-wui-image>`
    }

    return html`
      <cross-wui-icon-box
        size="xxs"
        iconColor="fg-200"
        backgroundColor="bg-100"
        icon="networkPlaceholder"
      ></cross-wui-icon-box>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-profile-button': WuiProfileButton
  }
}
