import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import '../../components/wui-image/index.js'
import '../../components/wui-text/index.js'
import '../../layout/wui-flex/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import { UiHelperUtil } from '../../utils/UiHelperUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-avatar/index.js'
import '../wui-icon-box/index.js'
import styles from './styles.js'

@customElement('cross-wui-account-button')
export class WuiAccountButton extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public networkSrc?: string = undefined

  @property() public avatarSrc?: string = undefined

  @property() public balance?: string = undefined

  @property({ type: Boolean }) public isUnsupportedChain?: boolean = undefined

  @property({ type: Boolean }) public disabled = false

  @property({ type: Boolean }) public loading = false

  @property() public address = ''

  @property() public profileName = ''

  @property() public charsStart = 4

  @property() public charsEnd = 6

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button
        ?disabled=${this.disabled}
        class=${ifDefined(this.balance ? undefined : 'local-no-balance')}
      >
        ${this.balanceTemplate()}
        <cross-wui-flex gap="xxs" alignItems="center">
          <cross-wui-avatar
            .imageSrc=${this.avatarSrc}
            alt=${this.address}
            address=${this.address}
          ></cross-wui-avatar>
          <cross-wui-text variant="paragraph-600" color="inherit">
            ${this.address
              ? UiHelperUtil.getTruncateString({
                  string: this.profileName || this.address,
                  charsStart: this.profileName ? 18 : this.charsStart,
                  charsEnd: this.profileName ? 0 : this.charsEnd,
                  truncate: this.profileName ? 'end' : 'middle'
                })
              : null}
          </cross-wui-text>
        </cross-wui-flex>
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private balanceTemplate() {
    if (this.isUnsupportedChain) {
      return html` <cross-wui-icon-box
          size="sm"
          iconColor="error-100"
          backgroundColor="error-100"
          icon="warningCircle"
        ></cross-wui-icon-box>
        <cross-wui-text variant="paragraph-600" color="inherit"> Switch Network</cross-wui-text>`
    }
    if (this.balance) {
      const networkElement = this.networkSrc
        ? html`<cross-wui-image src=${this.networkSrc}></cross-wui-image>`
        : html`
            <cross-wui-icon-box
              size="sm"
              iconColor="fg-200"
              backgroundColor="fg-300"
              icon="networkPlaceholder"
            ></cross-wui-icon-box>
          `

      const balanceTemplate = this.loading
        ? html`<cross-wui-loading-spinner size="md" color="fg-200"></cross-wui-loading-spinner>`
        : html`<cross-wui-text variant="paragraph-600" color="inherit"> ${this.balance}</cross-wui-text>`

      return html`${networkElement} ${balanceTemplate}`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-account-button': WuiAccountButton
  }
}
