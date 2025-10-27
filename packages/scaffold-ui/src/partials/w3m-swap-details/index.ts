import { NumberUtil } from '@to-nexus/appkit-common'
import { ChainController, ConstantsUtil, SwapController } from '@to-nexus/appkit-core'
import { UiHelperUtil, customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'

import styles from './styles.js'

// -- Constants ----------------------------------------- //
const slippageRate = ConstantsUtil.CONVERT_SLIPPAGE_TOLERANCE

@customElement('cross-w3m-swap-details')
export class WuiSwapDetails extends LitElement {
  public static override styles = [styles]

  private unsubscribe: ((() => void) | undefined)[] = []

  // -- State & Properties -------------------------------- //
  @state() public networkName = ChainController.state.activeCaipNetwork?.name

  @property() public detailsOpen = false

  @state() public sourceToken = SwapController.state.sourceToken

  @state() public toToken = SwapController.state.toToken

  @state() public toTokenAmount = SwapController.state.toTokenAmount

  @state() public sourceTokenPriceInUSD = SwapController.state.sourceTokenPriceInUSD

  @state() public toTokenPriceInUSD = SwapController.state.toTokenPriceInUSD

  @state() public gasPriceInUSD = SwapController.state.gasPriceInUSD

  @state() public priceImpact = SwapController.state.priceImpact

  @state() public maxSlippage = SwapController.state.maxSlippage

  @state() public networkTokenSymbol = SwapController.state.networkTokenSymbol

  @state() public inputError = SwapController.state.inputError

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()

    this.unsubscribe.push(
      ...[
        SwapController.subscribe(newState => {
          this.sourceToken = newState.sourceToken
          this.toToken = newState.toToken
          this.toTokenAmount = newState.toTokenAmount
          this.gasPriceInUSD = newState.gasPriceInUSD
          this.priceImpact = newState.priceImpact
          this.maxSlippage = newState.maxSlippage
          this.sourceTokenPriceInUSD = newState.sourceTokenPriceInUSD
          this.toTokenPriceInUSD = newState.toTokenPriceInUSD
          this.inputError = newState.inputError
        })
      ]
    )
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const minReceivedAmount =
      this.toTokenAmount && this.maxSlippage
        ? NumberUtil.bigNumber(this.toTokenAmount).minus(this.maxSlippage).toString()
        : null

    if (!this.sourceToken || !this.toToken || this.inputError) {
      return null
    }

    const toTokenSwappedAmount =
      this.sourceTokenPriceInUSD && this.toTokenPriceInUSD
        ? (1 / this.toTokenPriceInUSD) * this.sourceTokenPriceInUSD
        : 0

    return html`
      <cross-wui-flex flexDirection="column" alignItems="center" gap="1xs" class="details-container">
        <cross-wui-flex flexDirection="column">
          <button @click=${this.toggleDetails.bind(this)}>
            <cross-wui-flex justifyContent="space-between" .padding=${['0', 'xs', '0', 'xs']}>
              <cross-wui-flex justifyContent="flex-start" flexGrow="1" gap="xs">
                <cross-wui-text variant="small-400" color="fg-100">
                  1 ${this.sourceToken.symbol} =
                  ${UiHelperUtil.formatNumberToLocalString(toTokenSwappedAmount, 3)}
                  ${this.toToken.symbol}
                </cross-wui-text>
                <cross-wui-text variant="small-400" color="fg-200">
                  $${UiHelperUtil.formatNumberToLocalString(this.sourceTokenPriceInUSD)}
                </cross-wui-text>
              </cross-wui-flex>
              <cross-wui-icon name="chevronBottom"></cross-wui-icon>
            </cross-wui-flex>
          </button>
          ${this.detailsOpen
            ? html`
                <cross-wui-flex flexDirection="column" gap="xs" class="details-content-container">
                  <cross-wui-flex flexDirection="column" gap="xs">
                    <cross-wui-flex
                      justifyContent="space-between"
                      alignItems="center"
                      class="details-row"
                    >
                      <cross-wui-flex alignItems="center" gap="xs">
                        <cross-wui-text class="details-row-title" variant="small-400" color="fg-150">
                          Network cost
                        </cross-wui-text>
                        <cross-w3m-tooltip-trigger
                          text=${`Network cost is paid in ${this.networkTokenSymbol} on the ${this.networkName} network in order to execute transaction.`}
                        >
                          <cross-wui-icon size="xs" color="fg-250" name="infoCircle"></cross-wui-icon>
                        </cross-w3m-tooltip-trigger>
                      </cross-wui-flex>
                      <cross-wui-text variant="small-400" color="fg-100">
                        $${UiHelperUtil.formatNumberToLocalString(this.gasPriceInUSD, 3)}
                      </cross-wui-text>
                    </cross-wui-flex>
                  </cross-wui-flex>
                  ${this.priceImpact
                    ? html` <cross-wui-flex flexDirection="column" gap="xs">
                        <cross-wui-flex
                          justifyContent="space-between"
                          alignItems="center"
                          class="details-row"
                        >
                          <cross-wui-flex alignItems="center" gap="xs">
                            <cross-wui-text class="details-row-title" variant="small-400" color="fg-150">
                              Price impact
                            </cross-wui-text>
                            <cross-w3m-tooltip-trigger
                              text="Price impact reflects the change in market price due to your trade"
                            >
                              <cross-wui-icon size="xs" color="fg-250" name="infoCircle"></cross-wui-icon>
                            </cross-w3m-tooltip-trigger>
                          </cross-wui-flex>
                          <cross-wui-flex>
                            <cross-wui-text variant="small-400" color="fg-200">
                              ${UiHelperUtil.formatNumberToLocalString(this.priceImpact, 3)}%
                            </cross-wui-text>
                          </cross-wui-flex>
                        </cross-wui-flex>
                      </cross-wui-flex>`
                    : null}
                  ${this.maxSlippage && this.sourceToken.symbol
                    ? html`<cross-wui-flex flexDirection="column" gap="xs">
                        <cross-wui-flex
                          justifyContent="space-between"
                          alignItems="center"
                          class="details-row"
                        >
                          <cross-wui-flex alignItems="center" gap="xs">
                            <cross-wui-text class="details-row-title" variant="small-400" color="fg-150">
                              Max. slippage
                            </cross-wui-text>
                            <cross-w3m-tooltip-trigger
                              text=${`Max slippage sets the minimum amount you must receive for the transaction to proceed. ${
                                minReceivedAmount
                                  ? `Transaction will be reversed if you receive less than ${UiHelperUtil.formatNumberToLocalString(
                                      minReceivedAmount,
                                      6
                                    )} ${this.toToken.symbol} due to price changes.`
                                  : ''
                              }`}
                            >
                              <cross-wui-icon size="xs" color="fg-250" name="infoCircle"></cross-wui-icon>
                            </cross-w3m-tooltip-trigger>
                          </cross-wui-flex>
                          <cross-wui-flex>
                            <cross-wui-text variant="small-400" color="fg-200">
                              ${UiHelperUtil.formatNumberToLocalString(this.maxSlippage, 6)}
                              ${this.toToken.symbol} ${slippageRate}%
                            </cross-wui-text>
                          </cross-wui-flex>
                        </cross-wui-flex>
                      </cross-wui-flex>`
                    : null}
                  <cross-wui-flex flexDirection="column" gap="xs">
                    <cross-wui-flex
                      justifyContent="space-between"
                      alignItems="center"
                      class="details-row provider-free-row"
                    >
                      <cross-wui-flex alignItems="center" gap="xs">
                        <cross-wui-text class="details-row-title" variant="small-400" color="fg-150">
                          Provider fee
                        </cross-wui-text>
                      </cross-wui-flex>
                      <cross-wui-flex>
                        <cross-wui-text variant="small-400" color="fg-200">0.85%</cross-wui-text>
                      </cross-wui-flex>
                    </cross-wui-flex>
                  </cross-wui-flex>
                </cross-wui-flex>
              `
            : null}
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private toggleDetails() {
    this.detailsOpen = !this.detailsOpen
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-w3m-details': WuiSwapDetails
  }
}
