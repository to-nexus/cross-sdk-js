import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-text/index.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import type { TagType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import styles from './styles.js'

@customElement('cross-wui-tag')
export class WuiTag extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public variant: TagType = 'main'

  @property() public size: 'lg' | 'md' = 'lg'

  // -- Render -------------------------------------------- //
  public override render() {
    this.dataset['variant'] = this.variant
    this.dataset['size'] = this.size
    const textVariant = this.size === 'md' ? 'mini-700' : 'micro-700'

    return html`
      <cross-wui-text data-variant=${this.variant} variant=${textVariant} color="inherit">
        <slot></slot>
      </cross-wui-text>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-tag': WuiTag
  }
}
