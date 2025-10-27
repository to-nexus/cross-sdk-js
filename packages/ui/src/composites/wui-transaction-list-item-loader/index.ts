import { LitElement, html } from 'lit'

import '../../components/wui-text/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-transaction-visual/index.js'
import styles from './styles.js'

@customElement('cross-wui-transaction-list-item-loader')
export class WuiTransactionListItemLoader extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex alignItems="center">
        <cross-wui-shimmer width="40px" height="40px"></cross-wui-shimmer>
        <cross-wui-flex flexDirection="column" gap="2xs">
          <cross-wui-shimmer width="72px" height="16px" borderRadius="4xs"></cross-wui-shimmer>
          <cross-wui-shimmer width="148px" height="14px" borderRadius="4xs"></cross-wui-shimmer>
        </cross-wui-flex>
        <cross-wui-shimmer width="24px" height="12px" borderRadius="5xs"></cross-wui-shimmer>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-transaction-list-item-loader': WuiTransactionListItemLoader
  }
}
