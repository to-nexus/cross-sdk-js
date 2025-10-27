import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-chip/index.js'
import styles from './styles.js'

@customElement('cross-wui-list-wallet-transaction')
export class WuiListWalletTransaction extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public amount = ''

  @property() public networkCurreny = ''

  @property() public networkImageUrl = ''

  @property() public receiverAddress = ''

  @property() public addressExplorerUrl = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex justifyContent="space-between" alignItems="center">
        <cross-wui-text variant="paragraph-500" color="fg-200">Sending</cross-wui-text>
        <cross-wui-flex gap="xs" alignItems="center">
          <cross-wui-text variant="paragraph-400" color="fg-100">
            ${this.amount} ${this.networkCurreny}
          </cross-wui-text>
          ${this.templateNetworkVisual()}
        </cross-wui-flex>
      </cross-wui-flex>
      <cross-wui-flex justifyContent="space-between" alignItems="center">
        <cross-wui-text variant="paragraph-500" color="fg-200">To</cross-wui-text>
        <cross-wui-chip
          icon="externalLink"
          variant="shadeSmall"
          href=${this.addressExplorerUrl}
          title=${this.receiverAddress}
        ></cross-wui-chip>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateNetworkVisual() {
    if (this.networkImageUrl) {
      return html`<cross-wui-image src=${this.networkImageUrl} alt="Network Image"></cross-wui-image>`
    }

    return html`<cross-wui-icon size="inherit" color="fg-200" name="networkPlaceholder"></cross-wui-icon>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-list-wallet-transaction': WuiListWalletTransaction
  }
}
