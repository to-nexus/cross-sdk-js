import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import { type ChainNamespace, ConstantsUtil } from '@to-nexus/appkit-common'
import { ChainController, StorageUtil } from '@to-nexus/appkit-core'

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

@customElement('cross-wui-profile-button-v2')
export class WuiProfileButtonV2 extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public avatarSrc?: string = undefined

  @property() public profileName?: string = ''

  @property() public address = ''

  @property() public icon: IconType = 'mail'

  @property() public onProfileClick?: (event: Event) => void

  @property() public onCopyClick?: (event: Event) => void

  // -- Render -------------------------------------------- //
  public override render() {
    const namespace = ChainController.state.activeChain as ChainNamespace
    const connectorId = StorageUtil.getConnectedConnectorId(namespace)
    const shouldShowIcon = connectorId === ConstantsUtil.CONNECTOR_ID.AUTH

    return html`<button data-testid="wui-profile-button" @click=${this.handleClick}>
      <cross-wui-flex gap="xs" alignItems="center">
        <cross-wui-avatar
          .imageSrc=${this.avatarSrc}
          alt=${this.address}
          address=${this.address}
        ></cross-wui-avatar>
        ${shouldShowIcon ? this.getIconTemplate(this.icon) : ''}
        <cross-wui-flex gap="xs" alignItems="center">
          <cross-wui-text variant="large-600" color="fg-100">
            ${UiHelperUtil.getTruncateString({
              string: this.profileName || this.address,
              charsStart: this.profileName ? 18 : 4,
              charsEnd: this.profileName ? 0 : 4,
              truncate: this.profileName ? 'end' : 'middle'
            })}
          </cross-wui-text>
          <cross-wui-icon size="sm" color="fg-200" name="copy" id="copy-address"></cross-wui-icon>
        </cross-wui-flex>
      </cross-wui-flex>
    </button>`
  }

  private handleClick(event: Event) {
    if (event.target instanceof HTMLElement && event.target.id === 'copy-address') {
      this.onCopyClick?.(event)

      return
    }
    this.onProfileClick?.(event)
  }

  // -- Private ------------------------------------------- //
  private getIconTemplate(icon: IconType) {
    return html`
      <cross-wui-icon-box
        size="xxs"
        iconColor="fg-200"
        backgroundColor="bg-100"
        icon="${icon || 'networkPlaceholder'}"
      ></cross-wui-icon-box>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-profile-button-v2': WuiProfileButtonV2
  }
}
