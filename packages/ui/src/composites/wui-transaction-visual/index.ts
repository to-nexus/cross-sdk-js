import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import type {
  TransactionDirection,
  TransactionImage,
  TransactionStatus
} from '@to-nexus/appkit-common'

import '../../components/wui-image/index.js'
import type { TransactionIconType, TransactionType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

@customElement('cross-wui-transaction-visual')
export class WuiTransactionVisual extends LitElement {
  public static override styles = [styles]

  // -- State & Properties -------------------------------- //
  @property() public type?: TransactionType

  @property() public status?: TransactionStatus

  @property() public direction?: TransactionDirection

  @property({ type: Boolean }) public onlyDirectionIcon?: boolean

  @property({ type: Array }) public images: TransactionImage[] = []

  @property({ type: Object }) public secondImage: TransactionImage = {
    type: undefined,
    url: ''
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const [firstImage, secondImage] = this.images

    const isLeftNFT = firstImage?.type === 'NFT'
    const isRightNFT = secondImage?.url ? secondImage.type === 'NFT' : isLeftNFT

    const leftRadius = isLeftNFT ? 'var(--wui-border-radius-xxs)' : 'var(--wui-border-radius-s)'
    const rightRadius = isRightNFT ? 'var(--wui-border-radius-xxs)' : 'var(--wui-border-radius-s)'

    this.style.cssText = `
    --local-left-border-radius: ${leftRadius};
    --local-right-border-radius: ${rightRadius};
    `

    return html`<cross-wui-flex> ${this.templateVisual()} ${this.templateIcon()} </cross-wui-flex>`
  }

  // -- Private ------------------------------------------- //
  private templateVisual() {
    const [firstImage, secondImage] = this.images
    const firstImageType = firstImage?.type
    const haveTwoImages = this.images.length === 2
    if (haveTwoImages && (firstImage?.url || secondImage?.url)) {
      return html`<div class="swap-images-container">
        ${firstImage?.url
          ? html`<cross-wui-image src=${firstImage.url} alt="Transaction image"></cross-wui-image>`
          : null}
        ${secondImage?.url
          ? html`<cross-wui-image src=${secondImage.url} alt="Transaction image"></cross-wui-image>`
          : null}
      </div>`
    } else if (firstImage?.url) {
      return html`<cross-wui-image src=${firstImage.url} alt="Transaction image"></cross-wui-image>`
    } else if (firstImageType === 'NFT') {
      return html`<cross-wui-icon size="inherit" color="fg-200" name="nftPlaceholder"></cross-wui-icon>`
    }

    return html`<cross-wui-icon size="inherit" color="fg-200" name="coinPlaceholder"></cross-wui-icon>`
  }

  private templateIcon() {
    let color: 'accent-100' | 'error-100' | 'success-100' | 'inverse-100' = 'accent-100'
    let icon: TransactionIconType | undefined = undefined

    icon = this.getIcon()

    if (this.status) {
      color = this.getStatusColor()
    }

    if (!icon) {
      return null
    }

    return html`
      <cross-wui-icon-box
        size="xxs"
        iconColor=${color}
        backgroundColor=${color}
        background="opaque"
        icon=${icon}
        ?border=${true}
        borderColor="wui-color-bg-125"
      ></cross-wui-icon-box>
    `
  }

  private getDirectionIcon() {
    switch (this.direction) {
      case 'in':
        return 'arrowBottom'
      case 'out':
        return 'arrowTop'
      default:
        return undefined
    }
  }

  private getIcon() {
    if (this.onlyDirectionIcon) {
      return this.getDirectionIcon()
    }

    if (this.type === 'trade') {
      return 'swapHorizontalBold'
    } else if (this.type === 'approve') {
      return 'checkmark'
    } else if (this.type === 'cancel') {
      return 'close'
    }

    return this.getDirectionIcon()
  }

  private getStatusColor() {
    switch (this.status) {
      case 'confirmed':
        return 'success-100'
      case 'failed':
        return 'error-100'
      case 'pending':
        return 'inverse-100'
      default:
        return 'accent-100'
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-transaction-visual': WuiTransactionVisual
  }
}
