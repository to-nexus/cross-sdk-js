import { NavigationUtil } from '@to-nexus/appkit-common'
import { CoreHelperUtil, RouterController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

import styles from './styles.js'

@customElement('cross-w3m-smart-session-created-view')
export class W3mSmartSessionCreatedView extends LitElement {
  public static override styles = styles

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex
        flexDirection="column"
        alignItems="center"
        gap="xxl"
        .padding=${['0', '0', 'l', '0'] as const}
      >
        ${this.onboardingTemplate()}
        <cross-wui-link
          @click=${() => {
            CoreHelperUtil.openHref(NavigationUtil.URLS.FAQ, '_blank')
          }}
        >
          What's a Smart Session?
        </cross-wui-link>
        ${this.buttonsTemplate()}
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private onboardingTemplate() {
    return html` <cross-wui-flex
      flexDirection="column"
      gap="xxl"
      alignItems="center"
      .padding=${['0', 'xxl', '0', 'xxl'] as const}
    >
      <cross-wui-flex gap="s" alignItems="center" justifyContent="center">
        <cross-wui-icon-box
          size="xl"
          iconcolor="fg-100"
          backgroundcolor="inverse-100"
          icon="clock"
          background="opaque"
        ></cross-wui-icon-box>
      </cross-wui-flex>
      <cross-wui-flex flexDirection="column" alignItems="center" gap="s">
        <cross-wui-text align="center" variant="medium-600" color="fg-100">
          Smart Session created successfully
        </cross-wui-text>
        <cross-wui-text align="center" variant="paragraph-400" color="fg-100">
          You can manage your session from your account settings.
        </cross-wui-text>
      </cross-wui-flex>
    </cross-wui-flex>`
  }

  private buttonsTemplate() {
    return html`<cross-wui-flex
      .padding=${['0', '2l', '0', '2l'] as const}
      gap="s"
      class="continue-button-container"
    >
      <cross-wui-button fullWidth size="lg" borderRadius="xs" @click=${this.redirectToAccount.bind(this)}>
        Got it!
      </cross-wui-button>
    </cross-wui-flex>`
  }

  private redirectToAccount() {
    RouterController.replace('Account')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-smart-session-created-view': W3mSmartSessionCreatedView
  }
}
