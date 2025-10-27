import { NavigationUtil } from '@to-nexus/appkit-common'
import {
  AccountController,
  CoreHelperUtil,
  EventsController,
  RouterController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'
import { W3mFrameRpcConstants } from '@to-nexus/appkit-wallet'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import styles from './styles.js'

@customElement('cross-w3m-choose-account-name-view')
export class W3mChooseAccountNameView extends LitElement {
  public static override styles = styles

  // -- State & Properties -------------------------------- //
  @state() private loading = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex
        flexDirection="column"
        alignItems="center"
        gap="xxl"
        .padding=${['0', '0', 'l', '0'] as const}
      >
        ${this.onboardingTemplate()} ${this.buttonsTemplate()}
        <cross-wui-link
          @click=${() => {
            CoreHelperUtil.openHref(NavigationUtil.URLS.FAQ, '_blank')
          }}
        >
          Learn more about names
          <cross-wui-icon color="inherit" slot="iconRight" name="externalLink"></cross-wui-icon>
        </cross-wui-link>
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
          icon="id"
          size="xl"
          iconSize="xxl"
          iconColor="fg-200"
          backgroundColor="fg-200"
        ></cross-wui-icon-box>
      </cross-wui-flex>
      <cross-wui-flex flexDirection="column" alignItems="center" gap="s">
        <cross-wui-text align="center" variant="medium-600" color="fg-100">
          Choose your account name
        </cross-wui-text>
        <cross-wui-text align="center" variant="paragraph-400" color="fg-100">
          Finally say goodbye to 0x addresses, name your account to make it easier to exchange
          assets
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
      <cross-wui-button
        fullWidth
        .loading=${this.loading}
        size="lg"
        borderRadius="xs"
        @click=${this.handleContinue.bind(this)}
        >Choose name
      </cross-wui-button>
    </cross-wui-flex>`
  }

  private handleContinue() {
    RouterController.push('RegisterAccountName')
    EventsController.sendEvent({
      type: 'track',
      event: 'OPEN_ENS_FLOW',
      properties: {
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-choose-account-name-view': W3mChooseAccountNameView
  }
}
