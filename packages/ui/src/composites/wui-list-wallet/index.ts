import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import '../../components/wui-icon/index.js'
import '../../components/wui-text/index.js'
import '../../composites/wui-icon-box/index.js'
import { elementStyles, resetStyles } from '../../utils/ThemeUtil.js'
import type { IWalletImage, IconType, TagType } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-all-wallets-image/index.js'
import '../wui-tag/index.js'
import '../wui-wallet-image/index.js'
import styles from './styles.js'

@customElement('cross-wui-list-wallet')
export class WuiListWallet extends LitElement {
  public static override styles = [resetStyles, elementStyles, styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Array }) public walletImages?: IWalletImage[] = []

  @property() public imageSrc? = ''

  @property() public name = ''

  @property() public tagLabel?: string

  @property() public tagVariant?: TagType

  @property() public icon?: IconType

  @property() public walletIcon?: IconType

  @property() public tabIdx?: number = undefined

  @property({ type: Boolean }) public installed = false

  @property({ type: Boolean }) public disabled = false

  @property({ type: Boolean }) public showAllWallets = false

  @property({ type: Boolean }) public loading = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <button ?disabled=${this.disabled} tabindex=${ifDefined(this.tabIdx)}>
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <cross-wui-text variant="paragraph-500" color="inherit">${this.name}</cross-wui-text>
        ${this.templateStatus()}
      </button>
    `
  }

  // -- Private ------------------------------------------- //
  private templateAllWallets() {
    if (this.showAllWallets && this.imageSrc) {
      return html` <cross-wui-all-wallets-image .imageeSrc=${this.imageSrc}> </cross-wui-all-wallets-image> `
    } else if (this.showAllWallets && this.walletIcon) {
      return html` <cross-wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </cross-wui-wallet-image> `
    }

    return null
  }

  private templateWalletImage() {
    if (!this.showAllWallets && this.imageSrc) {
      return html`<cross-wui-wallet-image
        size="sm"
        imageSrc=${this.imageSrc}
        name=${this.name}
        .installed=${this.installed}
      ></cross-wui-wallet-image>`
    } else if (!this.showAllWallets && !this.imageSrc) {
      return html`<cross-wui-wallet-image size="sm" name=${this.name}></cross-wui-wallet-image>`
    }

    return null
  }

  private templateStatus() {
    if (this.loading) {
      return html`<cross-wui-loading-spinner size="lg" color="accent-100"></cross-wui-loading-spinner>`
    } else if (this.tagLabel && this.tagVariant) {
      return html`<cross-wui-tag variant=${this.tagVariant}>${this.tagLabel}</cross-wui-tag>`
    } else if (this.icon) {
      return html`<cross-wui-icon color="inherit" size="sm" name=${this.icon}></cross-wui-icon>`
    }

    return null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-list-wallet': WuiListWallet
  }
}
