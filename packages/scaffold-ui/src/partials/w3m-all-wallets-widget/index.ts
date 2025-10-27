import {
  ApiController,
  ConnectorController,
  CoreHelperUtil,
  EventsController,
  OptionsController,
  RouterController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('cross-w3m-all-wallets-widget')
export class W3mAllWalletsWidget extends LitElement {
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property() public tabIdx?: number = undefined
  @state() private connectors = ConnectorController.state.connectors
  @state() private count = ApiController.state.count

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => (this.connectors = val)),
      ApiController.subscribeKey('count', val => (this.count = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const wcConnector = this.connectors.find(
      c => c.id === 'walletConnect' || c.type === 'WALLET_CONNECT'
    )
    const { allWallets } = OptionsController.state

    // 🔍 디버그 포인트 3
    console.log('📱 AllWalletsWidget Debug:', {
      wcConnector,
      allWallets,
      connectors: this.connectors,
      count: this.count,
      connectorsDetail: this.connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
    })

    if (!wcConnector || allWallets === 'HIDE') {
      console.log('❌ All Wallets 숨김:', { wcConnector: !!wcConnector, allWallets })
      return null
    }

    if (allWallets === 'ONLY_MOBILE' && !CoreHelperUtil.isMobile()) {
      return null
    }

    const featuredCount = ApiController.state.featured.length
    const rawCount = this.count + featuredCount
    const roundedCount = rawCount < 10 ? rawCount : Math.floor(rawCount / 10) * 10
    const tagLabel = roundedCount < rawCount ? `${roundedCount}+` : `${roundedCount}`

    return html`
      <cross-wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${tagLabel}
        tagVariant="shade"
        data-testid="all-wallets"
        tabIdx=${ifDefined(this.tabIdx)}
      ></cross-wui-list-wallet>
    `
  }

  // -- Private ------------------------------------------- //
  private onAllWallets() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_ALL_WALLETS' })
    RouterController.push('AllWallets')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-all-wallets-widget': W3mAllWalletsWidget
  }
}
