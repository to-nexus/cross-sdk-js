import {
  AssetController,
  ModalController,
  OnRampController,
  OptionsController
} from '@to-nexus/appkit-core'
import type { PurchaseCurrency } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cross-w3m-onramp-token-select-view')
export class W3mOnrampTokensView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() public selectedCurrency = OnRampController.state.purchaseCurrencies
  @state() public tokens = OnRampController.state.purchaseCurrencies
  @state() private tokenImages = AssetController.state.tokenImages
  @state() private checked = false

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        OnRampController.subscribe(val => {
          this.selectedCurrency = val.purchaseCurrencies
          this.tokens = val.purchaseCurrencies
        }),
        AssetController.subscribeKey('tokenImages', val => (this.tokenImages = val))
      ]
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const { termsConditionsUrl, privacyPolicyUrl } = OptionsController.state

    const legalCheckbox = OptionsController.state.features?.legalCheckbox

    const legalUrl = termsConditionsUrl || privacyPolicyUrl
    const showLegalCheckbox = Boolean(legalUrl) && Boolean(legalCheckbox)

    const disabled = showLegalCheckbox && !this.checked

    return html`
      <cross-w3m-legal-checkbox
        @checkboxChange=${this.onCheckboxChange.bind(this)}
      ></cross-w3m-legal-checkbox>
      <cross-wui-flex
        flexDirection="column"
        .padding=${['0', 's', 's', 's']}
        gap="xs"
        class=${ifDefined(disabled ? 'disabled' : undefined)}
      >
        ${this.currenciesTemplate(disabled)}
      </cross-wui-flex>
      <cross-w3m-legal-footer></cross-w3m-legal-footer>
    `
  }

  // -- Private ------------------------------------------- //
  private currenciesTemplate(disabled = false) {
    return this.tokens.map(
      token => html`
        <cross-wui-list-item
          imageSrc=${ifDefined(this.tokenImages?.[token.symbol])}
          @click=${() => this.selectToken(token)}
          variant="image"
          tabIdx=${ifDefined(disabled ? -1 : undefined)}
        >
          <cross-wui-flex gap="3xs" alignItems="center">
            <cross-wui-text variant="paragraph-500" color="fg-100">${token.name}</cross-wui-text>
            <cross-wui-text variant="small-400" color="fg-200">${token.symbol}</cross-wui-text>
          </cross-wui-flex>
        </cross-wui-list-item>
      `
    )
  }

  private selectToken(currency: PurchaseCurrency) {
    if (!currency) {
      return
    }

    OnRampController.setPurchaseCurrency(currency)
    ModalController.close()
  }

  // -- Private Methods ----------------------------------- //
  private onCheckboxChange(event: CustomEvent<string>) {
    this.checked = Boolean(event.detail)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-onramp-token-select-view': W3mOnrampTokensView
  }
}
