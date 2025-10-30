import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'

import { NumberUtil } from '@to-nexus/appkit-common'

import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-token-list-item')
export class WuiTokenListItem extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  private observer = new IntersectionObserver(() => undefined)

  @property() public imageSrc?: string = undefined

  @property() public name?: string = undefined

  @property() public symbol?: string = undefined

  @property() public price?: string = undefined

  @property() public amount?: string = undefined

  @state() private visible = false

  @state() private imageError = false

  // -- Lifecycle ----------------------------------------- //
  constructor() {
    super()
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.visible = true
          } else {
            this.visible = false
          }
        })
      },
      { threshold: 0.1 }
    )
  }

  public override firstUpdated() {
    this.observer.observe(this)
  }

  public override disconnectedCallback() {
    this.observer.disconnect()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.visible) {
      return null
    }

    const value =
      this.amount && this.price ? NumberUtil.multiply(this.price, this.amount)?.toFixed(3) : null

    return html`
      <cross-wui-flex alignItems="center">
        ${this.visualTemplate()}
        <cross-wui-flex flexDirection="column" gap="3xs">
          <cross-wui-flex justifyContent="space-between">
            <cross-wui-text variant="paragraph-500" color="fg-100" lineClamp="1">${this.name}</cross-wui-text>
            ${value
              ? html`
                  <cross-wui-text variant="paragraph-500" color="fg-100">
                    $${UiHelperUtil.formatNumberToLocalString(value, 3)}
                  </cross-wui-text>
                `
              : null}
          </cross-wui-flex>
          <cross-wui-flex justifyContent="space-between">
            <cross-wui-text variant="small-400" color="fg-200" lineClamp="1">${this.symbol}</cross-wui-text>
            ${this.amount
              ? html`<cross-wui-text variant="small-400" color="fg-200">
                  ${UiHelperUtil.formatNumberToLocalString(this.amount, 4)}
                </cross-wui-text>`
              : null}
          </cross-wui-flex>
        </cross-wui-flex>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private visualTemplate() {
    if (this.imageError) {
      return html`<cross-wui-flex class="token-item-image-placeholder">
        <cross-wui-icon name="image" color="inherit"></cross-wui-icon>
      </cross-wui-flex>`
    }

    if (this.imageSrc) {
      return html`<cross-wui-image
        width="40"
        height="40"
        src=${this.imageSrc}
        @onLoadError=${this.imageLoadError}
      ></cross-wui-image>`
    }

    return null
  }

  private imageLoadError() {
    this.imageError = true
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-token-list-item': WuiTokenListItem
  }
}
