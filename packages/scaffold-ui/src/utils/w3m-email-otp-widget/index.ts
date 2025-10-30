import {
  ConnectorController,
  CoreHelperUtil,
  RouterController,
  SnackController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'
import { W3mFrameHelpers } from '@to-nexus/appkit-wallet'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import styles from './styles.js'

// -- Types --------------------------------------------- //
export type OnOtpSubmitFn = (otp: string) => Promise<void>
export type OnOtpResendFn = (email: string) => Promise<void>
export type OnStartOverFn = () => void

// -- Helpers ------------------------------------------- //
const OTP_LENGTH = 6

@customElement('cross-w3m-email-otp-widget')
export class W3mEmailOtpWidget extends LitElement {
  public static override styles = styles

  // -- State & Properties -------------------------------- //
  private OTPTimeout?: ReturnType<typeof setInterval>

  @state() private loading = false

  @state() private timeoutTimeLeft = W3mFrameHelpers.getTimeToNextEmailLogin()

  @state() private error = ''

  private otp = ''

  public email = RouterController.state.data?.email

  public onOtpSubmit: OnOtpSubmitFn | undefined

  public onOtpResend: OnOtpResendFn | undefined

  public onStartOver: OnStartOverFn | undefined

  public authConnector = ConnectorController.getAuthConnector()

  public override firstUpdated() {
    this.startOTPTimeout()
  }

  public override disconnectedCallback() {
    clearTimeout(this.OTPTimeout)
  }

  public constructor() {
    super()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.email) {
      throw new Error('cross-w3m-email-otp-widget: No email provided')
    }
    const isResendDisabled = Boolean(this.timeoutTimeLeft)
    const footerLabels = this.getFooterLabels(isResendDisabled)

    return html`
      <cross-wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['l', '0', 'l', '0'] as const}
        gap="l"
      >
        <cross-wui-flex
          class="email-display"
          flexDirection="column"
          alignItems="center"
          .padding=${['0', 'xl', '0', 'xl'] as const}
        >
          <cross-wui-text variant="paragraph-400" color="fg-100" align="center">
            Enter the code we sent to
          </cross-wui-text>
          <cross-wui-text variant="paragraph-500" color="fg-100" lineClamp="1" align="center">
            ${this.email}
          </cross-wui-text>
        </cross-wui-flex>

        <cross-wui-text variant="small-400" color="fg-200">The code expires in 20 minutes</cross-wui-text>

        ${this.loading
          ? html`<cross-wui-loading-spinner size="xl" color="accent-100"></cross-wui-loading-spinner>`
          : html` <cross-wui-flex flexDirection="column" alignItems="center" gap="xs">
              <cross-wui-otp
                dissabled
                length="6"
                @inputChange=${this.onOtpInputChange.bind(this)}
                .otp=${this.otp}
              ></cross-wui-otp>
              ${this.error
                ? html`
                    <cross-wui-text variant="small-400" align="center" color="error-100">
                      ${this.error}. Try Again
                    </cross-wui-text>
                  `
                : null}
            </cross-wui-flex>`}

        <cross-wui-flex alignItems="center" gap="xs">
          <cross-wui-text variant="small-400" color="fg-200">${footerLabels.title}</cross-wui-text>
          <cross-wui-link @click=${this.onResendCode.bind(this)} .disabled=${isResendDisabled}>
            ${footerLabels.action}
          </cross-wui-link>
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private startOTPTimeout() {
    this.timeoutTimeLeft = W3mFrameHelpers.getTimeToNextEmailLogin()
    this.OTPTimeout = setInterval(() => {
      if (this.timeoutTimeLeft > 0) {
        this.timeoutTimeLeft = W3mFrameHelpers.getTimeToNextEmailLogin()
      } else {
        clearInterval(this.OTPTimeout)
      }
    }, 1000)
  }

  private async onOtpInputChange(event: CustomEvent<string>) {
    try {
      if (!this.loading) {
        this.otp = event.detail
        if (this.authConnector && this.otp.length === OTP_LENGTH) {
          this.loading = true
          await this.onOtpSubmit?.(this.otp)
        }
      }
    } catch (error) {
      this.error = CoreHelperUtil.parseError(error)
      this.loading = false
    }
  }

  private async onResendCode() {
    try {
      if (this.onOtpResend) {
        if (!this.loading && !this.timeoutTimeLeft) {
          this.error = ''
          this.otp = ''
          const authConnector = ConnectorController.getAuthConnector()
          if (!authConnector || !this.email) {
            throw new Error('cross-w3m-email-otp-widget: Unable to resend email')
          }
          this.loading = true
          await this.onOtpResend(this.email)
          this.startOTPTimeout()
          SnackController.showSuccess('Code email resent')
        }
      } else if (this.onStartOver) {
        this.onStartOver()
      }
    } catch (error) {
      SnackController.showError(error)
    } finally {
      this.loading = false
    }
  }

  private getFooterLabels(isResendDisabled: boolean) {
    if (this.onStartOver) {
      return {
        title: 'Something wrong?',
        action: `Try again ${isResendDisabled ? `in ${this.timeoutTimeLeft}s` : ''}`
      }
    }

    return {
      title: `Didn't receive it?`,
      action: `Resend ${isResendDisabled ? `in ${this.timeoutTimeLeft}s` : 'Code'}`
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-email-otp-widget': W3mEmailOtpWidget
  }
}
