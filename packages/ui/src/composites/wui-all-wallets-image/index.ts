import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import { resetStyles } from '../../utils/ThemeUtil.js'
import type { IWalletImage } from '../../utils/TypeUtil.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import '../wui-icon-box/index.js'
import '../wui-wallet-image/index.js'
import styles from './styles.js'

const TOTAL_IMAGES = 4

@customElement('cross-wui-all-wallets-image')
export class WuiAllWalletsImage extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property({ type: Array }) public walletImages: IWalletImage[] = []

  // -- Render -------------------------------------------- //
  public override render() {
    const isPlaceholders = this.walletImages.length < TOTAL_IMAGES

    return html`${this.walletImages
        .slice(0, TOTAL_IMAGES)
        .map(
          ({ src, walletName }) => html`
            <cross-wui-wallet-image
              size="inherit"
              imageSrc=${src}
              name=${ifDefined(walletName)}
            ></cross-wui-wallet-image>
          `
        )}
      ${isPlaceholders
        ? [...Array(TOTAL_IMAGES - this.walletImages.length)].map(
            () => html` <cross-wui-wallet-image size="inherit" name=""></cross-wui-wallet-image>`
          )
        : null}
      <cross-wui-flex>
        <cross-wui-icon-box
          size="xxs"
          iconSize="xxs"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></cross-wui-icon-box>
      </cross-wui-flex>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-wui-all-wallets-image': WuiAllWalletsImage
  }
}
