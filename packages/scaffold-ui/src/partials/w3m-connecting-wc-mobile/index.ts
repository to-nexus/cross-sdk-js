import {
  ConnectionController,
  ConstantsUtil,
  CoreHelperUtil,
  EventsController,
  StorageUtil
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { W3mConnectingWidget } from '../../utils/w3m-connecting-widget/index.js'

@customElement('cross-w3m-connecting-wc-mobile')
export class W3mConnectingWcMobile extends W3mConnectingWidget {
  private btnLabelTimeout?: ReturnType<typeof setTimeout> = undefined
  private labelTimeout?: ReturnType<typeof setTimeout> = undefined
  private autoClickTimeout?: ReturnType<typeof setTimeout> = undefined
  private hasAutoClicked = false

  public constructor() {
    super()
    if (!this.wallet) {
      throw new Error('cross-w3m-connecting-wc-mobile: No wallet provided')
    }

    const isIos = CoreHelperUtil.isIos()
    const isUniversalLink = this.wallet.mobile_link?.startsWith('https://')

    /*
     * 🎯 Telegram-style approach:
     * Always render the button for iOS + Universal Link (we'll auto-click it).
     * Deep Links (custom schemes like 'crossx://') can be opened programmatically without button.
     */
    const shouldShowButton = isIos && isUniversalLink

    this.secondaryBtnLabel = shouldShowButton ? 'Open CrossX App' : undefined
    this.secondaryBtnIcon = shouldShowButton ? 'externalLink' : 'refresh'

    // Show different text for mini window
    const isMiniWindow = CoreHelperUtil.isMiniWindow()
    this.secondaryLabel = isMiniWindow
      ? 'Tap to switch connection method'
      : ConstantsUtil.CONNECT_LABELS.MOBILE
    document.addEventListener('visibilitychange', this.onBuffering.bind(this))
    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WALLET',
      properties: { name: this.wallet.name, platform: 'mobile' }
    })

    /* IOS with Universal Link doesn't need timers as user will click the button */
    if (!shouldShowButton) {
      this.btnLabelTimeout = setTimeout(() => {
        this.secondaryBtnLabel = 'Try again'
        this.secondaryLabel = isMiniWindow
          ? 'Tap to switch connection method'
          : ConstantsUtil.CONNECT_LABELS.MOBILE
      }, ConstantsUtil.FIVE_SEC_MS)
      this.labelTimeout = setTimeout(() => {
        this.secondaryLabel = `Hold tight... it's taking longer than expected`
      }, ConstantsUtil.THREE_SEC_MS)
    }
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('visibilitychange', this.onBuffering.bind(this))
    clearTimeout(this.btnLabelTimeout)
    clearTimeout(this.labelTimeout)
    clearTimeout(this.autoClickTimeout)
  }

  // -- Private ------------------------------------------- //
  protected override onRender = () => {
    if (!this.ready && this.uri && !this.hasAutoClicked) {
      this.ready = true
      this.hasAutoClicked = true
      /*
       * 🎯 Telegram-style workaround for iOS Universal Link restriction:
       * iOS requires explicit user interaction for Universal Links.
       * We render the button and programmatically click it after a short delay,
       * which satisfies iOS's "user interaction" requirement.
       */
      const isIos = CoreHelperUtil.isIos()
      const isUniversalLink = this.wallet?.mobile_link?.startsWith('https://')
      const shouldAutoClick = isIos && isUniversalLink

      if (shouldAutoClick) {
        // Update label to show we're opening the wallet
        this.secondaryLabel = 'Opening CROSSx Wallet...'

        /*
         * Auto-click the button after a short delay (Telegram method)
         * 200ms delay - adjustable based on testing
         */
        this.autoClickTimeout = setTimeout(() => {
          const button = this.shadowRoot?.querySelector(
            '[data-testid="cross-w3m-connecting-widget-secondary-button"]'
          ) as HTMLElement

          if (button) {
            button.click()
          }
        }, 200)

        // Fallback: show manual button if auto-connect fails after 3 seconds
        setTimeout(() => {
          if (ConnectionController.state.wcError) {
            this.secondaryLabel = 'Connection failed. Please try again.'
          }
        }, 3000)
      } else {
        // For non-iOS or Deep Links: trigger automatic connection
        this.onConnect?.()
      }
    }
  }

  protected override onConnect = () => {
    if (this.wallet?.mobile_link && this.uri) {
      try {
        this.error = false
        const { mobile_link, name } = this.wallet
        const { redirect } = CoreHelperUtil.formatNativeUrl(mobile_link, this.uri)

        // Mobile_link가 빈 문자열이면 스킵 (데스크탑 환경)
        if (!mobile_link || mobile_link.trim() === '') {
          ConnectionController.setWcLinking(undefined)
        } else {
          // 🔑 핵심: href는 base URL만 저장 (WalletConnect Engine이 각 요청마다 동적으로 URI 생성)
          const baseUrl = mobile_link.endsWith('/') ? mobile_link : `${mobile_link}/`

          ConnectionController.setWcLinking({ name, href: baseUrl })

          // ✅ 모바일 환경에서만 localStorage에 저장 (데스크탑에서는 저장하지 않아 리다이렉트 방지)
          if (CoreHelperUtil.isMobile()) {
            StorageUtil.setWalletConnectDeepLink({ name, href: baseUrl })
          }
        }

        ConnectionController.setRecentWallet(this.wallet)
        const target = CoreHelperUtil.isIframe() ? '_top' : '_self'
        CoreHelperUtil.openHref(redirect, target)
        clearTimeout(this.labelTimeout)
        const isMiniWindow = CoreHelperUtil.isMiniWindow()
        this.secondaryLabel = isMiniWindow
          ? 'Tap to switch connection method'
          : ConstantsUtil.CONNECT_LABELS.MOBILE
      } catch (e) {
        EventsController.sendEvent({
          type: 'track',
          event: 'CONNECT_PROXY_ERROR',
          properties: {
            message: e instanceof Error ? e.message : 'Error parsing the deeplink',
            uri: this.uri,
            mobile_link: this.wallet.mobile_link,
            name: this.wallet.name
          }
        })
        this.error = true
      }
    }
  }

  private onBuffering() {
    const isIos = CoreHelperUtil.isIos()
    if (document?.visibilityState === 'visible' && !this.error && isIos) {
      ConnectionController.setBuffering(true)
      setTimeout(() => {
        ConnectionController.setBuffering(false)
      }, 5000)
    }
  }

  protected override onTryAgain() {
    if (!this.buffering) {
      ConnectionController.setWcError(false)
      this.onConnect()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-mobile': W3mConnectingWcMobile
  }
}
