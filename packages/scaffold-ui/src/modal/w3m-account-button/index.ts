import {
  AccountController,
  AssetController,
  AssetUtil,
  ChainController,
  CoreHelperUtil,
  ModalController,
  OptionsController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'
import type { WuiAccountButton } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

class W3mAccountButtonBase extends LitElement {
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property({ type: Boolean }) public disabled?: WuiAccountButton['disabled'] = false

  @property() public balance?: 'show' | 'hide' = 'show'

  @property() public charsStart?: WuiAccountButton['charsStart'] = 4

  @property() public charsEnd?: WuiAccountButton['charsEnd'] = 6

  @state() private caipAddress = ChainController.state.activeCaipAddress

  @state() private balanceVal = AccountController.state.balance

  @state() private balanceSymbol = AccountController.state.balanceSymbol

  @state() private profileName = AccountController.state.profileName

  @state() private profileImage = AccountController.state.profileImage

  @state() private network = ChainController.state.activeCaipNetwork

  @state() private networkImage = AssetUtil.getNetworkImage(this.network)

  // eslint-disable-next-line no-nested-ternary
  @state() private isSupported = OptionsController.state.allowUnsupportedChain
    ? true
    : ChainController.state.activeChain
      ? ChainController.checkIfSupportedNetwork(ChainController.state.activeChain)
      : true

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        AssetController.subscribeNetworkImages(() => {
          this.networkImage = AssetUtil.getNetworkImage(this.network)
        }),
        ChainController.subscribeKey('activeCaipAddress', val => {
          this.caipAddress = val
        }),
        AccountController.subscribeKey('balance', val => (this.balanceVal = val)),
        AccountController.subscribeKey('balanceSymbol', val => (this.balanceSymbol = val)),
        AccountController.subscribeKey('profileName', val => (this.profileName = val)),
        AccountController.subscribeKey('profileImage', val => (this.profileImage = val)),
        ChainController.subscribeKey('activeCaipNetwork', val => {
          this.network = val
          this.networkImage = AssetUtil.getNetworkImage(val)
          this.isSupported = val?.chainNamespace
            ? ChainController.checkIfSupportedNetwork(val?.chainNamespace)
            : true
        })
      ]
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!ChainController.state.activeChain) {
      return null
    }

    const shouldShowBalance = this.balance === 'show'
    const shouldShowLoading = typeof this.balanceVal !== 'string'

    return html`
      <wui-account-button
        .disabled=${Boolean(this.disabled)}
        .isUnsupportedChain=${OptionsController.state.allowUnsupportedChain
          ? false
          : !this.isSupported}
        address=${ifDefined(CoreHelperUtil.getPlainAddress(this.caipAddress))}
        profileName=${ifDefined(this.profileName)}
        networkSrc=${ifDefined(this.networkImage)}
        avatarSrc=${ifDefined(this.profileImage)}
        balance=${shouldShowBalance
          ? CoreHelperUtil.formatBalance(this.balanceVal, this.balanceSymbol)
          : ''}
        @click=${this.onClick.bind(this)}
        data-testid="account-button"
        .charsStart=${this.charsStart}
        .charsEnd=${this.charsEnd}
        ?loading=${shouldShowLoading}
      >
      </wui-account-button>
    `
  }

  // -- Private ------------------------------------------- //
  private onClick() {
    if (this.isSupported || OptionsController.state.allowUnsupportedChain) {
      ModalController.open()
    } else {
      ModalController.open({ view: 'UnsupportedChain' })
    }
  }
}

@customElement('cross-w3m-account-button')
export class W3mAccountButton extends W3mAccountButtonBase {}

@customElement('appkit-account-button')
export class AppKitAccountButton extends W3mAccountButtonBase {}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-account-button': W3mAccountButton
    'appkit-account-button': AppKitAccountButton
  }
}
