import { ChainController, RouterController, SendController } from '@to-nexus/appkit-core'
import { UiHelperUtil, customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import styles from './styles.js'

@customElement('cross-w3m-wallet-send-preview-view')
export class W3mWalletSendPreviewView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private token = SendController.state.token

  @state() private sendTokenAmount = SendController.state.sendTokenAmount

  @state() private receiverAddress = SendController.state.receiverAddress

  @state() private receiverProfileName = SendController.state.receiverProfileName

  @state() private receiverProfileImageUrl = SendController.state.receiverProfileImageUrl

  @state() private gasPriceInUSD = SendController.state.gasPriceInUSD

  @state() private caipNetwork = ChainController.state.activeCaipNetwork

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        SendController.subscribe(val => {
          this.token = val.token
          this.sendTokenAmount = val.sendTokenAmount
          this.receiverAddress = val.receiverAddress
          this.gasPriceInUSD = val.gasPriceInUSD
          this.receiverProfileName = val.receiverProfileName
          this.receiverProfileImageUrl = val.receiverProfileImageUrl
        }),
        ChainController.subscribeKey('activeCaipNetwork', val => (this.caipNetwork = val))
      ]
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html` <cross-wui-flex flexDirection="column" .padding=${['0', 'l', 'l', 'l'] as const}>
      <cross-wui-flex gap="xs" flexDirection="column" .padding=${['0', 'xs', '0', 'xs'] as const}>
        <cross-wui-flex alignItems="center" justifyContent="space-between">
          <cross-wui-flex flexDirection="column" gap="4xs">
            <cross-wui-text variant="small-400" color="fg-150">Send</cross-wui-text>
            ${this.sendValueTemplate()}
          </cross-wui-flex>
          <cross-wui-preview-item
            text="${this.sendTokenAmount
              ? UiHelperUtil.roundNumber(this.sendTokenAmount, 6, 5)
              : 'unknown'} ${this.token?.symbol}"
            .imageSrc=${this.token?.iconUrl}
          ></cross-wui-preview-item>
        </cross-wui-flex>
        <cross-wui-flex>
          <cross-wui-icon color="fg-200" size="md" name="arrowBottom"></cross-wui-icon>
        </cross-wui-flex>
        <cross-wui-flex alignItems="center" justifyContent="space-between">
          <cross-wui-text variant="small-400" color="fg-150">To</cross-wui-text>
          <cross-wui-preview-item
            text="${this.receiverProfileName
              ? UiHelperUtil.getTruncateString({
                  string: this.receiverProfileName,
                  charsStart: 20,
                  charsEnd: 0,
                  truncate: 'end'
                })
              : UiHelperUtil.getTruncateString({
                  string: this.receiverAddress ? this.receiverAddress : '',
                  charsStart: 4,
                  charsEnd: 4,
                  truncate: 'middle'
                })}"
            address=${this.receiverAddress ?? ''}
            .imageSrc=${this.receiverProfileImageUrl ?? undefined}
            .isAddress=${true}
          ></cross-wui-preview-item>
        </cross-wui-flex>
      </cross-wui-flex>
      <cross-wui-flex flexDirection="column" .padding=${['xxl', '0', '0', '0'] as const}>
        <cross-w3m-wallet-send-details
          .caipNetwork=${this.caipNetwork}
          .receiverAddress=${this.receiverAddress}
          .networkFee=${this.gasPriceInUSD}
        ></cross-w3m-wallet-send-details>
        <cross-wui-flex justifyContent="center" gap="xxs" .padding=${['s', '0', '0', '0'] as const}>
          <cross-wui-icon size="sm" color="fg-200" name="warningCircle"></cross-wui-icon>
          <cross-wui-text variant="small-400" color="fg-200">Review transaction carefully</cross-wui-text>
        </cross-wui-flex>
        <cross-wui-flex justifyContent="center" gap="s" .padding=${['l', '0', '0', '0'] as const}>
          <cross-wui-button
            class="cancelButton"
            @click=${this.onCancelClick.bind(this)}
            size="lg"
            variant="neutral"
          >
            Cancel
          </cross-wui-button>
          <cross-wui-button
            class="sendButton"
            @click=${this.onSendClick.bind(this)}
            size="lg"
            variant="main"
          >
            Send
          </cross-wui-button>
        </cross-wui-flex>
      </cross-wui-flex></wui-flex
    >`
  }

  // -- Private ------------------------------------------- //
  private sendValueTemplate() {
    if (this.token && this.sendTokenAmount) {
      const price = this.token.price
      const totalValue = price * this.sendTokenAmount

      return html`<cross-wui-text variant="paragraph-400" color="fg-100"
        >$${totalValue.toFixed(2)}</wui-text
      >`
    }

    return null
  }

  onSendClick() {
    SendController.sendToken()
  }

  private onCancelClick() {
    RouterController.goBack()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-wallet-send-preview-view': W3mWalletSendPreviewView
  }
}
