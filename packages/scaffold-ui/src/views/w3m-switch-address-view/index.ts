import type { CaipAddress, ChainNamespace } from '@to-nexus/appkit-common'
import { ConstantsUtil } from '@to-nexus/appkit-common'
import {
  AccountController,
  type AccountType,
  ApiController,
  ChainController,
  ModalController,
  OptionsController,
  StorageUtil
} from '@to-nexus/appkit-core'
import { UiHelperUtil, customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cross-w3m-switch-address-view')
export class W3mSwitchAddressView extends LitElement {
  public static override styles = styles
  // -- Members ------------------------------------------- //
  private readonly metadata = OptionsController.state.metadata

  @state() public allAccounts: AccountType[] = AccountController.state.allAccounts || []

  @state() private balances: Record<string, number> = {}

  public readonly labels = AccountController.state.addressLabels

  public readonly currentAddress: string = AccountController.state.address || ''

  private caipNetwork = ChainController.state.activeCaipNetwork

  constructor() {
    super()
    AccountController.subscribeKey('allAccounts', allAccounts => {
      this.allAccounts = allAccounts
    })
  }

  public override connectedCallback() {
    super.connectedCallback()
    this.allAccounts.forEach(account => {
      ApiController.getBalance(account.address, this.caipNetwork?.caipNetworkId).then(response => {
        let total = this.balances[account.address] || 0
        if (response.length > 0) {
          total = response.reduce((acc, balance) => acc + (balance?.value || 0), 0)
        }
        this.balances[account.address] = total
        this.requestUpdate()
      })
    })
  }

  public getAddressIcon(type: AccountType['type']) {
    if (type === 'smartAccount') {
      return 'lightbulb'
    }

    return 'mail'
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex justifyContent="center" .padding=${['xl', '0', 'xl', '0'] as const}>
        <cross-wui-banner-img
          imageSrc=${ifDefined(this.metadata?.icons[0])}
          text=${ifDefined(this.metadata?.url)}
          size="sm"
        ></cross-wui-banner-img>
      </cross-wui-flex>
      <cross-wui-flex flexDirection="column" gap="xxl" .padding=${['l', 'xl', 'xl', 'xl'] as const}>
        ${this.allAccounts.map((account, index) => this.getAddressTemplate(account, index))}
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //

  private getAddressTemplate(account: AccountType, index: number) {
    const label = this.labels?.get(account.address)
    const namespace = ChainController.state.activeChain as ChainNamespace
    const connectorId = StorageUtil.getConnectedConnectorId(namespace)
    // Only show icon for AUTH accounts
    const shouldShowIcon = connectorId === ConstantsUtil.CONNECTOR_ID.AUTH

    return html`
      <cross-wui-flex
        flexDirection="row"
        justifyContent="space-between"
        data-testid="switch-address-item"
      >
        <cross-wui-flex alignItems="center">
          <cross-wui-avatar address=${account.address}></cross-wui-avatar>
          ${shouldShowIcon
            ? html`<cross-wui-icon-box
                size="sm"
                iconcolor="fg-200"
                backgroundcolor="glass-002"
                background="gray"
                icon="${this.getAddressIcon(account.type)}"
                ?border=${true}
              ></cross-wui-icon-box>`
            : html`<cross-wui-flex .padding="${['0', '0', '0', 's'] as const}"></cross-wui-flex>`}
          <cross-wui-flex flexDirection="column">
            <cross-wui-text class="address" variant="paragraph-500" color="fg-100"
              >${label
                ? label
                : UiHelperUtil.getTruncateString({
                    string: account.address,
                    charsStart: 4,
                    charsEnd: 6,
                    truncate: 'middle'
                  })}</wui-text
            >
            <cross-wui-text class="address-description" variant="small-400">
              ${typeof this.balances[account.address] === 'number'
                ? `$${this.balances[account.address]?.toFixed(2)}`
                : html`<cross-wui-loading-spinner size="sm" color="accent-100"></cross-wui-loading-spinner>`}
            </cross-wui-text>
          </cross-wui-flex>
        </cross-wui-flex>
        <cross-wui-flex gap="s" alignItems="center">
          ${account.address?.toLowerCase() === this.currentAddress?.toLowerCase()
            ? ''
            : html`
                <cross-wui-button
                  data-testid=${`w3m-switch-address-button-${index}`}
                  textVariant="small-600"
                  size="md"
                  variant="accent"
                  @click=${() => this.onSwitchAddress(account.address)}
                  >Switch to</wui-button
                >
              `}
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }

  private onSwitchAddress(address: string) {
    const caipNetwork = ChainController.state.activeCaipNetwork
    const activeChainNamespace = caipNetwork?.chainNamespace
    const caipAddress = `${activeChainNamespace}:${caipNetwork?.id}:${address}` as CaipAddress
    AccountController.setCaipAddress(caipAddress, activeChainNamespace)
    ModalController.close()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-switch-address-view': W3mSwitchAddressView
  }
}
