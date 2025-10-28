import { type SwapInputTarget } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import styles from './styles.js'

@customElement('cross-w3m-swap-input-skeleton')
export class W3mSwapInputSkeleton extends LitElement {
  public static override styles = [styles]

  // -- State & Properties -------------------------------- //
  @property() public target: SwapInputTarget = 'sourceToken'

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex class justifyContent="space-between">
        <cross-wui-flex
          flex="1"
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="center"
          class="swap-input"
          gap="xxs"
        >
          <cross-wui-shimmer width="80px" height="40px" borderRadius="xxs" variant="light"></cross-wui-shimmer>
        </cross-wui-flex>
        ${this.templateTokenSelectButton()}
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateTokenSelectButton() {
    return html`
      <cross-wui-flex
        class="swap-token-button"
        flexDirection="column"
        alignItems="flex-end"
        justifyContent="center"
        gap="xxs"
      >
        <cross-wui-shimmer width="80px" height="40px" borderRadius="3xl" variant="light"></cross-wui-shimmer>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-swap-input-skeleton': W3mSwapInputSkeleton
  }
}
