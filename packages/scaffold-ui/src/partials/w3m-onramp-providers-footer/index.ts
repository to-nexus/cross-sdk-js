import {
  AccountController,
  EventsController,
  OptionsController,
  RouterController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'
import { W3mFrameRpcConstants } from '@to-nexus/appkit-wallet'

import { LitElement, html } from 'lit'

import styles from './styles.js'

@customElement('cross-w3m-onramp-providers-footer')
export class W3mOnRampProvidersFooter extends LitElement {
  public static override styles = [styles]

  // -- Render -------------------------------------------- //
  public override render() {
    const { termsConditionsUrl, privacyPolicyUrl } = OptionsController.state

    if (!termsConditionsUrl && !privacyPolicyUrl) {
      return null
    }

    return html`
      <cross-wui-flex
        .padding=${['m', 's', 's', 's'] as const}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="s"
      >
        <cross-wui-text color="fg-250" variant="small-400" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </cross-wui-text>

        ${this.howDoesItWorkTemplate()}
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private howDoesItWorkTemplate() {
    return html` <cross-wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <cross-wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></cross-wui-icon>
      How does it work?
    </cross-wui-link>`
  }

  private onWhatIsBuy() {
    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WHAT_IS_A_BUY',
      properties: {
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
    RouterController.push('WhatIsABuy')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-onramp-providers-footer': W3mOnRampProvidersFooter
  }
}
