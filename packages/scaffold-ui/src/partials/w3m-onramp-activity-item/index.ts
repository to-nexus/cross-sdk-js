import { ApiController } from '@to-nexus/appkit-core'
import { type ColorType, customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import styles from './styles.js'

@customElement('cross-w3m-onramp-activity-item')
export class W3mOnRampActivityItem extends LitElement {
  public static override styles = [styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Boolean }) public disabled = false

  @property() color: ColorType = 'inherit'

  @property() public label = 'Bought'

  @property() public purchaseValue = ''

  @property() public purchaseCurrency = ''

  @property() public date = ''

  @property({ type: Boolean }) public completed = false

  @property({ type: Boolean }) public inProgress = false

  @property({ type: Boolean }) public failed = false

  @property() public onClick: (() => void) | null = null

  @property() public symbol = ''

  @property() public icon?: string

  // -- Render -------------------------------------------- //
  public override firstUpdated() {
    if (!this.icon) {
      this.fetchTokenImage()
    }
  }

  public override render() {
    return html`
      <cross-wui-flex>
        ${this.imageTemplate()}
        <cross-wui-flex flexDirection="column" gap="4xs" flexGrow="1">
          <cross-wui-flex gap="xxs" alignItems="center" justifyContent="flex-start">
            ${this.statusIconTemplate()}
            <cross-wui-text variant="paragraph-500" color="fg-100"> ${this.label}</cross-wui-text>
          </cross-wui-flex>
          <cross-wui-text variant="small-400" color="fg-200">
            + ${this.purchaseValue} ${this.purchaseCurrency}
          </cross-wui-text>
        </cross-wui-flex>
        ${this.inProgress
          ? html`<cross-wui-loading-spinner color="fg-200" size="md"></cross-wui-loading-spinner>`
          : html`<cross-wui-text variant="micro-700" color="fg-300"><span>${this.date}</span></cross-wui-text>`}
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private async fetchTokenImage() {
    await ApiController._fetchTokenImage(this.purchaseCurrency)
  }

  private statusIconTemplate() {
    if (this.inProgress) {
      return null
    }

    return this.completed ? this.boughtIconTemplate() : this.errorIconTemplate()
  }

  private errorIconTemplate() {
    return html`<cross-wui-icon-box
      size="xxs"
      iconColor="error-100"
      backgroundColor="error-100"
      background="opaque"
      icon="close"
      borderColor="wui-color-bg-125"
    ></cross-wui-icon-box>`
  }

  private imageTemplate() {
    const icon = this.icon || `https://avatar.vercel.sh/andrew.svg?size=50&text=${this.symbol}`

    return html`<cross-wui-flex class="purchase-image-container">
      <cross-wui-image src=${icon}></cross-wui-image>
    </cross-wui-flex>`
  }

  private boughtIconTemplate() {
    return html`<cross-wui-icon-box
      size="xxs"
      iconColor="success-100"
      backgroundColor="success-100"
      background="opaque"
      icon="arrowBottom"
      borderColor="wui-color-bg-125"
    ></cross-wui-icon-box>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-onramp-activity-item': W3mOnRampActivityItem
  }
}
