import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

import '../../components/wui-text/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

@customElement('cross-wui-banner-img')
export class WuiBannerImg extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //

  @property() public imageSrc = ''

  @property() public text = ''

  @property() public size = ''

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex gap="1xs" alignItems="center">
        <cross-wui-avatar size=${this.size} imageSrc=${this.imageSrc}></cross-wui-avatar>
        <cross-wui-text variant="small-400" color="fg-200">${this.text}</cross-wui-text>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-banner-img': WuiBannerImg
  }
}
