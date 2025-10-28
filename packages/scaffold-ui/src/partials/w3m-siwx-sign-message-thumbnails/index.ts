import { AccountController, OptionsController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

import styles from './styles.js'

@customElement('cross-w3m-siwx-sign-message-thumbnails')
export class W3mSIWXSignMessageThumbnails extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private readonly dappImageUrl = OptionsController.state.metadata?.icons

  private readonly walletImageUrl = AccountController.state.connectedWalletInfo?.icon

  public override firstUpdated() {
    const visuals = this.shadowRoot?.querySelectorAll('cross-wui-visual-thumbnail')

    if (visuals?.[0]) {
      this.createAnimation(visuals[0] as HTMLElement, 'translate(18px)')
    }
    if (visuals?.[1]) {
      this.createAnimation(visuals[1] as HTMLElement, 'translate(-18px)')
    }
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-visual-thumbnail
        ?borderRadiusFull=${true}
        .imageSrc=${this.dappImageUrl?.[0]}
      ></cross-wui-visual-thumbnail>
      <cross-wui-visual-thumbnail .imageSrc=${this.walletImageUrl}></cross-wui-visual-thumbnail>
    `
  }

  // -- Private ------------------------------------------- //
  private createAnimation(element: HTMLElement, translation: string) {
    element.animate([{ transform: 'translateX(0px)' }, { transform: translation }], {
      duration: 1600,
      easing: 'cubic-bezier(0.56, 0, 0.48, 1)',
      direction: 'alternate',
      iterations: Infinity
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-siwx-sign-message-thumbnails': W3mSIWXSignMessageThumbnails
  }
}
