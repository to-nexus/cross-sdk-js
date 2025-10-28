import { OptionsController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cross-w3m-connect-wallets-view')
export class W3mConnectWalletsView extends LitElement {
  public static override styles = styles

  @state() private checked = false

  // -- Render -------------------------------------------- //
  public override render() {
    const { termsConditionsUrl, privacyPolicyUrl } = OptionsController.state

    const legalCheckbox = OptionsController.state.features?.legalCheckbox

    const legalUrl = termsConditionsUrl || privacyPolicyUrl
    const showLegalCheckbox = Boolean(legalUrl) && Boolean(legalCheckbox)

    const disabled = showLegalCheckbox && !this.checked

    const tabIndex = disabled ? -1 : undefined

    return html`
      <cross-w3m-legal-checkbox
        @checkboxChange=${this.onCheckboxChange.bind(this)}
      ></cross-w3m-legal-checkbox>
      <cross-wui-flex
        flexDirection="column"
        .padding=${showLegalCheckbox ? ['0', 's', 's', 's'] : 's'}
        gap="xs"
        class=${ifDefined(disabled ? 'disabled' : undefined)}
      >
        <cross-w3m-wallet-login-list tabIdx=${ifDefined(tabIndex)}></cross-w3m-wallet-login-list>
      </cross-wui-flex>
      <cross-w3m-legal-footer></cross-w3m-legal-footer>
    `
  }

  // -- Private Methods ----------------------------------- //
  private onCheckboxChange(event: CustomEvent<string>) {
    this.checked = Boolean(event.detail)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connect-wallets-view': W3mConnectWalletsView
  }
}
