import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import type {
  TransactionDirection,
  TransactionImage,
  TransactionStatus
} from '@to-nexus/appkit-common'

import '../../components/wui-text/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { type TransactionType, TransactionTypePastTense } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-transaction-visual/index.js'
import styles from './styles.js'

@customElement('cross-wui-transaction-list-item')
export class WuiTransactionListItem extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public type: TransactionType = 'approve'

  @property({ type: Array }) public descriptions?: string[]

  @property() public date?: string

  @property({ type: Boolean }) public onlyDirectionIcon?: boolean = false

  @property() public status?: TransactionStatus

  @property() public direction?: TransactionDirection

  @property({ type: Array }) public images: TransactionImage[] = []

  @property({ type: Array }) public price: TransactionImage[] = []

  @property({ type: Array }) public amount: TransactionImage[] = []

  @property({ type: Array }) public symbol: TransactionImage[] = []

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex>
        <cross-wui-transaction-visual
          .status=${this.status}
          direction=${ifDefined(this.direction)}
          type=${this.type}
          onlyDirectionIcon=${ifDefined(this.onlyDirectionIcon)}
          .images=${this.images}
        ></cross-wui-transaction-visual>
        <cross-wui-flex flexDirection="column" gap="3xs">
          <cross-wui-text variant="paragraph-600" color="fg-100">
            ${TransactionTypePastTense[this.type] || this.type}
          </cross-wui-text>
          <cross-wui-flex class="description-container">
            ${this.templateDescription()} ${this.templateSecondDescription()}
          </cross-wui-flex>
        </cross-wui-flex>
        <cross-wui-text variant="micro-700" color="fg-300"><span>${this.date}</span></cross-wui-text>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateDescription() {
    const description = this.descriptions?.[0]

    return description
      ? html`
          <cross-wui-text variant="small-500" color="fg-200">
            <span>${description}</span>
          </cross-wui-text>
        `
      : null
  }

  private templateSecondDescription() {
    const description = this.descriptions?.[1]

    return description
      ? html`
          <cross-wui-icon class="description-separator-icon" size="xxs" name="arrowRight"></cross-wui-icon>
          <cross-wui-text variant="small-400" color="fg-200">
            <span>${description}</span>
          </cross-wui-text>
        `
      : null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-transaction-list-item': WuiTransactionListItem
  }
}
