import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { CardSelectType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-network-image/index.js'
import '../wui-wallet-image/index.js'
import styles from './styles.js'

@customElement('cross-wui-card-select')
export class WuiCardSelect extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //

  @property() public name = 'Unknown'

  @property() public type: CardSelectType = 'wallet'

  @property() public imageSrc?: string = undefined

  @property({ type: Boolean }) public disabled?: boolean = false

  @property({ type: Boolean }) public selected?: boolean = false

  @property({ type: Boolean }) public installed?: boolean = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button data-selected=${ifDefined(this.selected)} ?disabled=${this.disabled}>
        ${this.imageTemplate()}
        <cross-wui-text variant="tiny-500" color=${this.selected ? 'accent-100' : 'inherit'}>
          ${this.name}
        </cross-wui-text>
      </button>
    `
  }

  private imageTemplate() {
    if (this.type === 'network') {
      return html`
        <cross-wui-network-image
          .selected=${this.selected}
          imageSrc=${ifDefined(this.imageSrc)}
          name=${this.name}
        >
        </cross-wui-network-image>
      `
    }

    return html`
      <cross-wui-wallet-image
        size="md"
        imageSrc=${ifDefined(this.imageSrc)}
        name=${this.name}
        .installed=${this.installed}
        badgeSize="sm"
      >
      </cross-wui-wallet-image>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-card-select': WuiCardSelect
  }
}
