import type { RouterControllerState } from '@to-nexus/appkit-core'
import { RouterController, TooltipController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import { ConstantsUtil } from '../../utils/ConstantsUtil.js'
import styles from './styles.js'

@customElement('cro-router')
export class W3mRouter extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private resizeObserver?: ResizeObserver = undefined

  private prevHeight = '0px'

  private prevHistoryLength = 1

  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private view = RouterController.state.view

  @state() private viewDirection = ''

  public constructor() {
    super()
    this.unsubscribe.push(RouterController.subscribeKey('view', val => this.onViewChange(val)))
  }

  public override firstUpdated() {
    this.resizeObserver = new ResizeObserver(([content]) => {
      const height = `${content?.contentRect.height}px`
      if (this.prevHeight !== '0px') {
        this.style.setProperty('--prev-height', this.prevHeight)
        this.style.setProperty('--new-height', height)
        this.style.animation = 'w3m-view-height 150ms forwards ease'
        this.style.height = 'auto'
      }
      setTimeout(() => {
        this.prevHeight = height
        this.style.animation = 'unset'
      }, ConstantsUtil.ANIMATION_DURATIONS.ModalHeight)
    })
    this.resizeObserver.observe(this.getWrapper())
  }

  public override disconnectedCallback() {
    this.resizeObserver?.unobserve(this.getWrapper())
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`<div class="w3m-router-container" view-direction="${this.viewDirection}">
      ${this.viewTemplate()}
    </div>`
  }

  // -- Private ------------------------------------------- //
  private viewTemplate() {
    switch (this.view) {
      case 'AccountSettings':
        return html`<cro-account-settings-view></cro-account-settings-view>`
      case 'Account':
        return html`<cro-account-view></cro-account-view>`
      case 'AllWallets':
        return html`<cro-all-wallets-view></cro-all-wallets-view>`
      case 'ApproveTransaction':
        return html`<cro-approve-transaction-view></cro-approve-transaction-view>`
      case 'BuyInProgress':
        return html`<cro-buy-in-progress-view></cro-buy-in-progress-view>`
      case 'ChooseAccountName':
        return html`<cro-choose-account-name-view></cro-choose-account-name-view>`
      case 'Connect':
        return html`<cro-connect-view></cro-connect-view>`
      case 'Create':
        return html`<cro-connect-view walletGuide="explore"></cro-connect-view>`
      case 'ConnectingWalletConnect':
        return html`<cro-connecting-wc-view></cro-connecting-wc-view>`
      case 'ConnectingWalletConnectBasic':
        return html`<cro-connecting-wc-basic-view></cro-connecting-wc-basic-view>`
      case 'ConnectingExternal':
        return html`<cro-connecting-external-view></cro-connecting-external-view>`
      case 'ConnectingSiwe':
        return html`<cro-connecting-siwe-view></cro-connecting-siwe-view>`
      case 'ConnectWallets':
        return html`<cro-connect-wallets-view></cro-connect-wallets-view>`
      case 'ConnectSocials':
        return html`<cro-connect-socials-view></cro-connect-socials-view>`
      case 'ConnectingSocial':
        return html`<cro-connecting-social-view></cro-connecting-social-view>`
      case 'Downloads':
        return html`<cro-downloads-view></cro-downloads-view>`
      case 'EmailVerifyOtp':
        return html`<cro-email-verify-otp-view></cro-email-verify-otp-view>`
      case 'EmailVerifyDevice':
        return html`<cro-email-verify-device-view></cro-email-verify-device-view>`
      case 'GetWallet':
        return html`<cro-get-wallet-view></cro-get-wallet-view>`
      case 'Networks':
        return html`<cro-networks-view></cro-networks-view>`
      case 'SwitchNetwork':
        return html`<cro-network-switch-view></cro-network-switch-view>`
      case 'Profile':
        return html`<cro-profile-view></cro-profile-view>`
      case 'SwitchAddress':
        return html`<cro-switch-address-view></cro-switch-address-view>`
      case 'Transactions':
        return html`<cro-transactions-view></cro-transactions-view>`
      case 'OnRampProviders':
        return html`<w3m-onramp-providers-view></w3m-onramp-providers-view>`
      case 'OnRampActivity':
        return html`<cro-onramp-activity-view></cro-onramp-activity-view>`
      case 'OnRampTokenSelect':
        return html`<cro-onramp-token-select-view></cro-onramp-token-select-view>`
      case 'OnRampFiatSelect':
        return html`<cro-onramp-fiat-select-view></cro-onramp-fiat-select-view>`
      case 'UpgradeEmailWallet':
        return html`<cro-upgrade-wallet-view></cro-upgrade-wallet-view>`
      case 'UpdateEmailWallet':
        return html`<cro-update-email-wallet-view></cro-update-email-wallet-view>`
      case 'UpdateEmailPrimaryOtp':
        return html`<cro-update-email-primary-otp-view></cro-update-email-primary-otp-view>`
      case 'UpdateEmailSecondaryOtp':
        return html`<cro-update-email-secondary-otp-view></cro-update-email-secondary-otp-view>`
      case 'UnsupportedChain':
        return html`<cro-unsupported-chain-view></cro-unsupported-chain-view>`
      case 'Swap':
        return html`<cro-swap-view></cro-swap-view>`
      case 'SwapSelectToken':
        return html`<cro-swap-select-token-view></cro-swap-select-token-view>`
      case 'SwapPreview':
        return html`<cro-swap-preview-view></cro-swap-preview-view>`
      case 'WalletSend':
        return html`<cro-wallet-send-view></cro-wallet-send-view>`
      case 'WalletSendSelectToken':
        return html`<cro-wallet-send-select-token-view></cro-wallet-send-select-token-view>`
      case 'WalletSendPreview':
        return html`<cro-wallet-send-preview-view></cro-wallet-send-preview-view>`
      case 'WhatIsABuy':
        return html`<cro-what-is-a-buy-view></cro-what-is-a-buy-view>`
      case 'WalletReceive':
        return html`<cro-wallet-receive-view></cro-wallet-receive-view>`
      case 'WalletCompatibleNetworks':
        return html`<cro-wallet-compatible-networks-view></cro-wallet-compatible-networks-view>`
      case 'WhatIsAWallet':
        return html`<cro-what-is-a-wallet-view></cro-what-is-a-wallet-view>`
      case 'ConnectingMultiChain':
        return html`<cro-connecting-multi-chain-view></cro-connecting-multi-chain-view>`
      case 'WhatIsANetwork':
        return html`<cro-what-is-a-network-view></cro-what-is-a-network-view>`
      case 'ConnectingFarcaster':
        return html`<cro-connecting-farcaster-view></cro-connecting-farcaster-view>`
      case 'SwitchActiveChain':
        return html`<cro-switch-active-chain-view></cro-switch-active-chain-view>`
      case 'RegisterAccountName':
        return html`<cro-register-account-name-view></cro-register-account-name-view>`
      case 'RegisterAccountNameSuccess':
        return html`<cro-register-account-name-success-view></cro-register-account-name-success-view>`
      case 'SmartSessionCreated':
        return html`<cro-smart-session-created-view></cro-smart-session-created-view>`
      case 'SmartSessionList':
        return html`<cro-smart-session-list-view></cro-smart-session-list-view>`
      case 'SIWXSignMessage':
        return html`<cro-siwx-sign-message-view></cro-siwx-sign-message-view>`
      default:
        return html`<cro-connect-view></cro-connect-view>`
    }
  }

  private onViewChange(newView: RouterControllerState['view']) {
    TooltipController.hide()

    let direction = ConstantsUtil.VIEW_DIRECTION.Next
    const { history } = RouterController.state
    if (history.length < this.prevHistoryLength) {
      direction = ConstantsUtil.VIEW_DIRECTION.Prev
    }

    this.prevHistoryLength = history.length
    this.viewDirection = direction

    setTimeout(() => {
      this.view = newView
    }, ConstantsUtil.ANIMATION_DURATIONS.ViewTransition)
  }

  private getWrapper() {
    return this.shadowRoot?.querySelector('div') as HTMLElement
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cro-router': W3mRouter
  }
}
