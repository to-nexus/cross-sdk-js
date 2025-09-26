import type { RouterControllerState } from '@to-nexus/appkit-core'
import { CoreHelperUtil, RouterController, TooltipController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import { ConstantsUtil } from '../../utils/ConstantsUtil.js'
import styles from './styles.js'

@customElement('cross-w3m-router')
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
        return html`<cross-w3m-account-settings-view></cross-w3m-account-settings-view>`
      case 'Account':
        return html`<cross-w3m-account-view></cross-w3m-account-view>`
      case 'AllWallets':
        return html`<cross-w3m-all-wallets-view></cross-w3m-all-wallets-view>`
      case 'ApproveTransaction':
        return html`<cross-w3m-approve-transaction-view></cross-w3m-approve-transaction-view>`
      case 'BuyInProgress':
        return html`<cross-w3m-buy-in-progress-view></cross-w3m-buy-in-progress-view>`
      case 'ChooseAccountName':
        return html`<cross-w3m-choose-account-name-view></cross-w3m-choose-account-name-view>`
      case 'Connect':
        return html`<cross-w3m-connect-view></cross-w3m-connect-view>`
      case 'Create':
        return html`<cross-w3m-connect-view walletGuide="explore"></cross-w3m-connect-view>`
      case 'ConnectingWalletConnect':
        return CoreHelperUtil.isMobileLandscape()
          ? html`<cross-w3m-connecting-wc-landscape-view></cross-w3m-connecting-wc-landscape-view>`
          : html`<cross-w3m-connecting-wc-view></cross-w3m-connecting-wc-view>`
      case 'ConnectingWalletConnectBasic':
        return html`<cross-w3m-connecting-wc-basic-view></cross-w3m-connecting-wc-basic-view>`
      case 'ConnectingExternal':
        return html`<cross-w3m-connecting-external-view></cross-w3m-connecting-external-view>`
      case 'ConnectingSiwe':
        return html`<cross-w3m-connecting-siwe-view></cross-w3m-connecting-siwe-view>`
      case 'ConnectWallets':
        return html`<cross-w3m-connect-wallets-view></cross-w3m-connect-wallets-view>`
      case 'ConnectSocials':
        return html`<cross-w3m-connect-socials-view></cross-w3m-connect-socials-view>`
      case 'ConnectingSocial':
        return html`<cross-w3m-connecting-social-view></cross-w3m-connecting-social-view>`
      case 'Downloads':
        return html`<cross-w3m-downloads-view></cross-w3m-downloads-view>`
      case 'EmailVerifyOtp':
        return html`<cross-w3m-email-verify-otp-view></cross-w3m-email-verify-otp-view>`
      case 'EmailVerifyDevice':
        return html`<cross-w3m-email-verify-device-view></cross-w3m-email-verify-device-view>`
      case 'GetWallet':
        return html`<cross-w3m-get-wallet-view></cross-w3m-get-wallet-view>`
      case 'Networks':
        return html`<cross-w3m-networks-view></cross-w3m-networks-view>`
      case 'SwitchNetwork':
        return html`<cross-w3m-network-switch-view></cross-w3m-network-switch-view>`
      case 'Profile':
        return html`<cross-w3m-profile-view></cross-w3m-profile-view>`
      case 'SwitchAddress':
        return html`<cross-w3m-switch-address-view></cross-w3m-switch-address-view>`
      case 'Transactions':
        return html`<cross-w3m-transactions-view></cross-w3m-transactions-view>`
      case 'OnRampProviders':
        return html`<w3m-onramp-providers-view></w3m-onramp-providers-view>`
      case 'OnRampActivity':
        return html`<cross-w3m-onramp-activity-view></cross-w3m-onramp-activity-view>`
      case 'OnRampTokenSelect':
        return html`<cross-w3m-onramp-token-select-view></cross-w3m-onramp-token-select-view>`
      case 'OnRampFiatSelect':
        return html`<cross-w3m-onramp-fiat-select-view></cross-w3m-onramp-fiat-select-view>`
      case 'UpgradeEmailWallet':
        return html`<cross-w3m-upgrade-wallet-view></cross-w3m-upgrade-wallet-view>`
      case 'UpdateEmailWallet':
        return html`<cross-w3m-update-email-wallet-view></cross-w3m-update-email-wallet-view>`
      case 'UpdateEmailPrimaryOtp':
        return html`<cross-w3m-update-email-primary-otp-view></cross-w3m-update-email-primary-otp-view>`
      case 'UpdateEmailSecondaryOtp':
        return html`<cross-w3m-update-email-secondary-otp-view></cross-w3m-update-email-secondary-otp-view>`
      case 'UnsupportedChain':
        return html`<cross-w3m-unsupported-chain-view></cross-w3m-unsupported-chain-view>`
      case 'Swap':
        return html`<cross-w3m-swap-view></cross-w3m-swap-view>`
      case 'SwapSelectToken':
        return html`<cross-w3m-swap-select-token-view></cross-w3m-swap-select-token-view>`
      case 'SwapPreview':
        return html`<cross-w3m-swap-preview-view></cross-w3m-swap-preview-view>`
      case 'WalletSend':
        return html`<cross-w3m-wallet-send-view></cross-w3m-wallet-send-view>`
      case 'WalletSendSelectToken':
        return html`<cross-w3m-wallet-send-select-token-view></cross-w3m-wallet-send-select-token-view>`
      case 'WalletSendPreview':
        return html`<cross-w3m-wallet-send-preview-view></cross-w3m-wallet-send-preview-view>`
      case 'WhatIsABuy':
        return html`<cross-w3m-what-is-a-buy-view></cross-w3m-what-is-a-buy-view>`
      case 'WalletReceive':
        return html`<cross-w3m-wallet-receive-view></cross-w3m-wallet-receive-view>`
      case 'WalletCompatibleNetworks':
        return html`<cross-w3m-wallet-compatible-networks-view></cross-w3m-wallet-compatible-networks-view>`
      case 'WhatIsAWallet':
        return html`<cross-w3m-what-is-a-wallet-view></cross-w3m-what-is-a-wallet-view>`
      case 'ConnectingMultiChain':
        return html`<cross-w3m-connecting-multi-chain-view></cross-w3m-connecting-multi-chain-view>`
      case 'WhatIsANetwork':
        return html`<cross-w3m-what-is-a-network-view></cross-w3m-what-is-a-network-view>`
      case 'ConnectingFarcaster':
        return html`<cross-w3m-connecting-farcaster-view></cross-w3m-connecting-farcaster-view>`
      case 'SwitchActiveChain':
        return html`<cross-w3m-switch-active-chain-view></cross-w3m-switch-active-chain-view>`
      case 'RegisterAccountName':
        return html`<cross-w3m-register-account-name-view></cross-w3m-register-account-name-view>`
      case 'RegisterAccountNameSuccess':
        return html`<cross-w3m-register-account-name-success-view></cross-w3m-register-account-name-success-view>`
      case 'SmartSessionCreated':
        return html`<cross-w3m-smart-session-created-view></cross-w3m-smart-session-created-view>`
      case 'SmartSessionList':
        return html`<cross-w3m-smart-session-list-view></cross-w3m-smart-session-list-view>`
      case 'SIWXSignMessage':
        return html`<cross-w3m-siwx-sign-message-view></cross-w3m-siwx-sign-message-view>`
      default:
        return html`<cross-w3m-connect-view></cross-w3m-connect-view>`
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
    'cross-w3m-router': W3mRouter
  }
}
