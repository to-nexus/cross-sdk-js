import { EventsController, RouterController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

const data = [
  {
    images: ['login', 'profile', 'lock'],
    title: 'One login for all of web3',
    text: 'Log in to any app by connecting your wallet. Say goodbye to countless passwords!'
  },
  {
    images: ['defi', 'nft', 'eth'],
    title: 'A home for your digital assets',
    text: 'A wallet lets you store, send and receive digital assets like cryptocurrencies and NFTs.'
  },
  {
    images: ['browser', 'noun', 'dao'],
    title: 'Your gateway to a new web',
    text: 'With your wallet, you can explore and interact with DeFi, NFTs, DAOs, and much more.'
  }
] as const

@customElement('cross-w3m-what-is-a-wallet-view')
export class W3mWhatIsAWalletView extends LitElement {
  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex
        flexDirection="column"
        .padding=${['xxl', 'xl', 'xl', 'xl'] as const}
        alignItems="center"
        gap="xl"
      >
        <cross-w3m-help-widget .data=${data}></cross-w3m-help-widget>
        <cross-wui-button variant="main" size="md" @click=${this.onGetWallet.bind(this)}>
          <cross-wui-icon color="inherit" slot="iconLeft" name="wallet"></cross-wui-icon>
          Get a wallet
        </cross-wui-button>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private onGetWallet() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_GET_WALLET' })
    RouterController.push('GetWallet')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-what-is-a-wallet-view': W3mWhatIsAWalletView
  }
}
