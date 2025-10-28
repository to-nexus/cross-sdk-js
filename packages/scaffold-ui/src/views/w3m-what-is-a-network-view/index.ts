import { CoreHelperUtil } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

const data = [
  {
    images: ['network', 'layers', 'system'],
    title: 'The system’s nuts and bolts',
    text: 'A network is what brings the blockchain to life, as this technical infrastructure allows apps to access the ledger and smart contract services.'
  },
  {
    images: ['noun', 'defiAlt', 'dao'],
    title: 'Designed for different uses',
    text: 'Each network is designed differently, and may therefore suit certain apps and experiences.'
  }
] as const

@customElement('cross-w3m-what-is-a-network-view')
export class W3mWhatIsANetworkView extends LitElement {
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
        <cross-wui-button
          variant="main"
          size="md"
          @click=${() => {
            CoreHelperUtil.openHref('https://ethereum.org/en/developers/docs/networks/', '_blank')
          }}
        >
          Learn more
          <cross-wui-icon color="inherit" slot="iconRight" name="externalLink"></cross-wui-icon>
        </cross-wui-button>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-what-is-a-network-view': W3mWhatIsANetworkView
  }
}
