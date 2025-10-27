import { AssetUtil, ChainController, type OnRampProvider } from '@to-nexus/appkit-core'
import { type ColorType, customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import styles from './styles.js'

@customElement('cross-w3m-onramp-provider-item')
export class W3mOnRampProviderItem extends LitElement {
  public static override styles = [styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Boolean }) public disabled = false

  @property() color: ColorType = 'inherit'

  @property() public name?: OnRampProvider['name']

  @property() public label = ''

  @property() public feeRange = ''

  @property({ type: Boolean }) public loading = false

  @property() public onClick: (() => void) | null = null

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button ?disabled=${this.disabled}>
        <cross-wui-visual name=${ifDefined(this.name)} class="provider-image"></cross-wui-visual>
        <cross-wui-flex flexDirection="column" gap="4xs">
          <cross-wui-text variant="paragraph-500" color="fg-100">${this.label}</cross-wui-text>
          <cross-wui-flex alignItems="center" justifyContent="flex-start" gap="l">
            <cross-wui-text variant="tiny-500" color="fg-100">
              <cross-wui-text variant="tiny-400" color="fg-200">Fees</cross-wui-text>
              ${this.feeRange}
            </cross-wui-text>
            <cross-wui-flex gap="xxs">
              <cross-wui-icon name="bank" size="xs" color="fg-150"></cross-wui-icon>
              <cross-wui-icon name="card" size="xs" color="fg-150"></cross-wui-icon>
            </cross-wui-flex>
            ${this.networksTemplate()}
          </cross-wui-flex>
        </cross-wui-flex>
        ${this.loading
          ? html`<cross-wui-loading-spinner color="fg-200" size="md"></cross-wui-loading-spinner>`
          : html`<cross-wui-icon name="chevronRight" color="fg-200" size="sm"></cross-wui-icon>`}
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private networksTemplate() {
    const requestedCaipNetworks = ChainController.getAllRequestedCaipNetworks()
    const slicedNetworks = requestedCaipNetworks
      ?.filter(network => network?.assets?.imageId)
      ?.slice(0, 5)

    return html`
      <cross-wui-flex class="networks">
        ${slicedNetworks?.map(
          network => html`
            <cross-wui-flex class="network-icon">
              <cross-wui-image src=${ifDefined(AssetUtil.getNetworkImage(network))}></cross-wui-image>
            </cross-wui-flex>
          `
        )}
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-onramp-provider-item': W3mOnRampProviderItem
  }
}
