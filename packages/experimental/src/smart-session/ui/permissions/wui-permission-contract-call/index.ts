import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import { UiHelperUtil, customElement } from '@to-nexus/appkit-ui'

import styles from './styles.js'

@customElement('cross-wui-permission-contract-call')
export class WuiPermissionContractCall extends LitElement {
  // -- State & Properties --------------------------------- //
  public static override styles = styles

  @property({ type: Array }) public functions?: { functionName: string }[] = []
  @property({ type: String }) public contractAddress?: `0x${string}`
  @property({ type: Number }) public expiry?: number

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.contractAddress || !this.expiry) {
      return null
    }

    return html`
      <cross-wui-flex flexDirection="column" alignItems="center">
        <cross-wui-details-group>
          <cross-wui-details-group-item name="Type">
            <cross-wui-text variant="small-400" color="fg-100"> Contract Call </cross-wui-text>
          </cross-wui-details-group-item>
          <cross-wui-details-group-item name="Contract">
            <cross-wui-text variant="small-400" color="fg-100">
              ${UiHelperUtil.getTruncateString({
                string: this.contractAddress,
                truncate: 'middle',
                charsStart: 4,
                charsEnd: 4
              })}
            </cross-wui-text>
          </cross-wui-details-group-item>
          <cross-wui-details-group-item name="Functions">
            <cross-wui-text variant="small-400" color="fg-100">
              ${this.functions?.map(f => f.functionName).join(', ')}
            </cross-wui-text>
          </cross-wui-details-group-item>
          <cross-wui-flex justifyContent="space-between">
            <cross-wui-text color="fg-200">Duration</cross-wui-text>
            <cross-wui-flex flexDirection="column" alignItems="flex-end" gap="s">
              <cross-wui-text variant="small-400" color="fg-100">
                ~ ${Math.round((1000 * this.expiry - Date.now()) / 1000 / 3600)} hours
              </cross-wui-text>
              <cross-wui-text variant="tiny-600" color="fg-300">
                Expiring ${new Date(1000 * this.expiry).toDateString()}
              </cross-wui-text>
            </cross-wui-flex>
          </cross-wui-flex>
        </cross-wui-details-group>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-permission-contract-call': WuiPermissionContractCall
  }

  namespace JSX {
    interface IntrinsicElements {
      'wui-permission-contract-call': Partial<WuiPermissionContractCall>
    }
  }
}
