import type { WcWallet } from '@to-nexus/appkit-core'
import {
  AssetUtil,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  OptionsController,
  RouterController,
  StorageUtil
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('cross-w3m-connect-custom-widget')
export class W3mConnectCustomWidget extends LitElement {
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property() public tabIdx?: number = undefined

  @state() private connectors = ConnectorController.state.connectors
  @state() private loading = false

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => (this.connectors = val))
    )
    if (CoreHelperUtil.isTelegram() && CoreHelperUtil.isIos()) {
      this.loading = !ConnectionController.state.wcUri
      this.unsubscribe.push(
        ConnectionController.subscribeKey('wcUri', val => (this.loading = !val))
      )
    }
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const { customWallets } = OptionsController.state

    // 🔍 디버그 포인트 4
    console.log('🎯 CustomWidget Debug:', {
      customWallets,
      customWalletsLength: customWallets?.length
    })

    if (!customWallets?.length) {
      console.log('❌ CustomWallets 없음')
      this.style.cssText = `display: none`

      return null
    }

    const wallets = this.filterOutDuplicateWallets(customWallets)

    console.log('✅ CustomWallets 표시:', wallets)

    return html`<wui-flex flexDirection="column" gap="xs">
      ${wallets.map(
        wallet => html`
          <wui-list-wallet
            imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
            name=${wallet.name ?? 'Unknown'}
            @click=${() => this.onConnectWallet(wallet)}
            data-testid=${`wallet-selector-${wallet.id}`}
            tabIdx=${ifDefined(this.tabIdx)}
            ?loading=${this.loading}
          >
          </wui-list-wallet>
        `
      )}
    </wui-flex>`
  }

  // -- Private Methods ----------------------------------- //
  private filterOutDuplicateWallets(wallets: WcWallet[]) {
    const recent = StorageUtil.getRecentWallets()

    const connectorRDNSs = this.connectors
      .map(connector => connector.info?.rdns)
      .filter(Boolean) as string[]

    const recentRDNSs = recent.map(wallet => wallet.rdns).filter(Boolean) as string[]
    const allRDNSs = connectorRDNSs.concat(recentRDNSs)
    if (allRDNSs.includes('io.metamask.mobile') && CoreHelperUtil.isMobile()) {
      const index = allRDNSs.indexOf('io.metamask.mobile')
      allRDNSs[index] = 'io.metamask'
    }

    // 🔍 디버그 포인트 5
    console.log('🔍 FilterDuplicates Debug:', {
      wallets: wallets.map(w => ({ id: w.id, name: w.name, rdns: w.rdns })),
      connectorRDNSs,
      recentRDNSs,
      allRDNSs
    })

    // CROSS Wallet만 사용하므로 필터링 비활성화
    const filtered = wallets // 필터링 없이 모든 customWallets 표시

    console.log(
      '🔍 Filtered Result (no filtering):',
      filtered.map(w => ({ id: w.id, name: w.name, rdns: w.rdns }))
    )

    return filtered
  }

  private onConnectWallet(wallet: WcWallet) {
    if (this.loading) {
      return
    }
    RouterController.push('ConnectingWalletConnect', { wallet })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connect-custom-widget': W3mConnectCustomWidget
  }
}
