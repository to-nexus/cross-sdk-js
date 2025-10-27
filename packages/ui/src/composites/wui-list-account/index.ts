import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import { type ChainNamespace, ConstantsUtil } from '@to-nexus/appkit-common'
import {
  AccountController,
  ApiController,
  ChainController,
  StorageUtil
} from '@to-nexus/appkit-core'
import { W3mFrameRpcConstants } from '@to-nexus/appkit-wallet'

import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-list-account')
export class WuiListAccount extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public accountAddress = ''

  @property() public accountType = ''

  private labels = AccountController.state.addressLabels

  private caipNetwork = ChainController.state.activeCaipNetwork

  private socialProvider = StorageUtil.getConnectedSocialProvider()

  private balance = 0

  private fetchingBalance = true

  private shouldShowIcon = false

  @property({ type: Boolean }) public selected = false

  @property({ type: Function }) public onSelect?: (
    { address, type }: { address: string; type: string },
    selected: boolean
  ) => void

  public override connectedCallback() {
    super.connectedCallback()
    ApiController.getBalance(this.accountAddress, this.caipNetwork?.caipNetworkId)
      .then(response => {
        let total = this.balance
        if (response.length > 0) {
          total = response.reduce((acc, balance) => acc + (balance?.value || 0), 0)
        }
        this.balance = total
        this.fetchingBalance = false
        this.requestUpdate()
      })
      .catch(() => {
        this.fetchingBalance = false
        this.requestUpdate()
      })
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const label = this.getLabel()
    const namespace = ChainController.state.activeChain as ChainNamespace
    const connectorId = StorageUtil.getConnectedConnectorId(namespace)

    // Only show icon for AUTH accounts
    this.shouldShowIcon = connectorId === ConstantsUtil.CONNECTOR_ID.AUTH

    return html`
      <cross-wui-flex
        flexDirection="row"
        justifyContent="space-between"
        .padding=${['0', '0', 's', '1xs'] as const}
      >
        <cross-wui-flex gap="md" alignItems="center">
          <cross-wui-avatar address=${this.accountAddress}></cross-wui-avatar>
          ${this.shouldShowIcon
            ? html`<cross-wui-icon-box
                size="sm"
                iconcolor="fg-200"
                backgroundcolor="fg-300"
                icon=${this.accountType === W3mFrameRpcConstants.ACCOUNT_TYPES.EOA
                  ? (this.socialProvider ?? 'mail')
                  : 'lightbulb'}
                background="fg-300"
              ></cross-wui-icon-box>`
            : html`<cross-wui-flex .padding="${['0', '0', '0', 's'] as const}"></cross-wui-flex>`}
          <cross-wui-flex flexDirection="column">
            <cross-wui-text class="address" variant="paragraph-500" color="fg-100"
              >${UiHelperUtil.getTruncateString({
                string: this.accountAddress,
                charsStart: 4,
                charsEnd: 6,
                truncate: 'middle'
              })}</wui-text
            >
            <cross-wui-text class="address-description" variant="small-400">${label}</cross-wui-text></wui-flex
          >
        </cross-wui-flex>
        <cross-wui-flex gap="s" alignItems="center">
          <slot name="action"></slot>
          ${this.fetchingBalance
            ? html`<cross-wui-loading-spinner size="sm" color="accent-100"></cross-wui-loading-spinner>`
            : html` <cross-wui-text variant="small-400">$${this.balance.toFixed(2)}</cross-wui-text>`}
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //

  private getLabel() {
    let label = this.labels?.get(this.accountAddress)
    const namespace = ChainController.state.activeChain as ChainNamespace
    const connectorId = StorageUtil.getConnectedConnectorId(namespace)

    if (!label && connectorId === ConstantsUtil.CONNECTOR_ID.AUTH) {
      label = `${this.accountType === 'eoa' ? (this.socialProvider ?? 'Email') : 'Smart'} Account`
    } else if (!label) {
      label = 'EOA'
    }

    return label
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-list-account': WuiListAccount
  }
}
