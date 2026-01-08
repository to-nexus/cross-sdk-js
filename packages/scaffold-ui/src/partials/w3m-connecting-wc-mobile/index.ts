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
     * 🎯 iOS Universal Link requires manual button click:
     * - iOS + Universal Link: Show button for user to tap (preserves interaction context)
     * - Deep Links (crossx://): Can be opened programmatically without button
     * - Android: Can be opened programmatically (no iOS restrictions)
     */
    const shouldShowButton = isIos && isUniversalLink

    this.secondaryBtnLabel = shouldShowButton ? 'Open CROSSx App' : undefined
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
      const requiresManualClick = isIos && isUniversalLink

      if (requiresManualClick) {
        /*
         * 🎯 iOS Universal Link 제약사항:
         * - 사용자 클릭 이벤트 핸들러 내에서만 작동
         * - 비동기 작업 후에는 클릭 컨텍스트가 상실됨
         * - connect('cross_wallet')는 비동기 작업이 많아서 자동 클릭 불가
         * - 따라서 iOS + Universal Link만 버튼을 보여주고 직접 클릭하게 함
         * - Android 및 Deep Link는 자동으로 앱 열림
         */
        this.secondaryLabel = 'Tap to open CROSSx Wallet'

        /*
         * 버튼만 표시하고 자동 클릭하지 않음
         * 사용자가 직접 클릭하면 onConnect()가 호출됨
         */
      } else {
        // Android, iOS Deep Link: 자동으로 앱 열기
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
