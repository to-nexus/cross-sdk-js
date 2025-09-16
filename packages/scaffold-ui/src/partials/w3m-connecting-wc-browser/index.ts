import type { BaseError } from '@to-nexus/appkit-core'
import {
  AccountController,
  ChainController,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  EventsController,
  ModalController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { html } from 'lit'
import { state } from 'lit/decorators.js'

import { W3mConnectingWidget } from '../../utils/w3m-connecting-widget/index.js'

@customElement('cross-w3m-connecting-wc-browser')
export class W3mConnectingWcBrowser extends W3mConnectingWidget {
  // -- State ------------------------------------------- //
  @state() private isCrossWalletInstalled = false

  public constructor() {
    super()

    if (!this.wallet) {
      throw new Error('cross-w3m-connecting-wc-browser: No wallet provided')
    }

    // Cross Wallet 설치 여부 확인
    this.checkCrossWalletInstallation()

    this.onConnect = this.onConnectProxy.bind(this)
    this.onAutoConnect = this.onConnectProxy.bind(this)

    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WALLET',
      properties: { name: this.wallet.name, platform: 'browser' }
    })
  }

  // -- Render -------------------------------------------- //
  public override render() {
    // Cross Wallet이 설치되어 있지 않으면 스토어 링크 표시
    if (!this.isCrossWalletInstalled && this.isCrossWallet()) {
      return this.renderStoreLinks()
    }

    return super.render()
  }

  // -- Private ------------------------------------------- //
  private isCrossWallet(): boolean {
    return (
      this.wallet?.id === 'cross_wallet' || this.wallet?.rdns === 'nexus.to.crosswallet.desktop'
    )
  }

  private checkCrossWalletInstallation() {
    if (!this.isCrossWallet() || !this.wallet?.rdns) {
      this.isCrossWalletInstalled = true
      return
    }

    // 1순위: ANNOUNCED 커넥터에서 정확한 RDNS로 찾기
    const { connectors } = ConnectorController.state
    const announced = connectors.filter(
      c => c.type === 'ANNOUNCED' && c.info?.rdns === this.wallet?.rdns
    )

    if (announced && announced.length > 0) {
      this.isCrossWalletInstalled = true
      return
    }

    // 2순위: window에서 Cross Wallet 전용 체크
    if (typeof window !== 'undefined') {
      const rdns = this.wallet.rdns

      // Cross Wallet의 정확한 RDNS 체크
      if (rdns === 'nexus.to.crosswallet.desktop') {
        const ethereum = (window as any).ethereum

        // 디버깅을 위한 로그
        console.log('Cross Wallet Detection Debug:', {
          hasEthereum: !!ethereum,
          hasRdnsProperty: !!(ethereum && ethereum[rdns]),
          rdns,
          ethereumKeys: ethereum ? Object.keys(ethereum) : [],
          providers: ethereum?.providers ? ethereum.providers.length : 0
        })

        // 1. RDNS 기반 직접 체크
        const crossWallet = ethereum && ethereum[rdns]
        if (crossWallet) {
          console.log('Cross Wallet found via RDNS:', crossWallet)
          this.isCrossWalletInstalled = true
          return
        }

        // 2. ethereum providers 배열에서 Cross Wallet 찾기
        if (ethereum && ethereum.providers && Array.isArray(ethereum.providers)) {
          const crossProvider = ethereum.providers.find((provider: any) => {
            const hasRdns = provider.rdns === rdns
            const hasName = provider._metadata?.name?.includes('Cross Wallet')
            const isCross = provider.isCrossWallet

            console.log('Provider check:', {
              rdns: provider.rdns,
              name: provider._metadata?.name,
              isCrossWallet: provider.isCrossWallet,
              matches: hasRdns || hasName || isCross
            })

            return hasRdns || hasName || isCross
          })

          if (crossProvider) {
            console.log('Cross Wallet found in providers:', crossProvider)
            this.isCrossWalletInstalled = true
            return
          }
        }

        // 3. 글로벌 스코프에서 Cross Wallet 찾기
        if ((window as any)[rdns]) {
          console.log('Cross Wallet found in global scope')
          this.isCrossWalletInstalled = true
          return
        }

        // Cross Wallet이 실제로 설치되지 않음을 확인
        console.log('Cross Wallet not found - will show install links')
      }
    }

    // Cross Wallet이 설치되지 않음
    this.isCrossWalletInstalled = false
  }

  private renderStoreLinks() {
    const isChrome = CoreHelperUtil.isChrome()
    const chromeStoreUrl = this.wallet?.chrome_store

    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['3xl', 'xl', 'xl', 'xl'] as const}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${this.wallet?.image_url || ''}></wui-wallet-image>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text variant="paragraph-500" color="fg-100"> Cross Wallet not installed </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">
            Install Cross Wallet to continue with browser connection
          </wui-text>
        </wui-flex>

        ${isChrome && chromeStoreUrl
          ? html`
              <wui-button
                variant="accent"
                size="md"
                @click=${() => this.openChromeStore()}
                data-testid="cross-w3m-install-wallet-button"
              >
                <wui-icon color="inherit" slot="iconLeft" name="externalLink"></wui-icon>
                Install from Chrome Store
              </wui-button>
            `
          : html`
              <wui-text align="center" variant="small-500" color="fg-200">
                Please install Cross Wallet extension for your browser
              </wui-text>
            `}
      </wui-flex>
    `
  }

  private openChromeStore() {
    if (this.wallet?.chrome_store) {
      window.open(this.wallet.chrome_store, '_blank', 'noopener,noreferrer')
    }
  }

  private async onConnectProxy() {
    try {
      this.error = false
      const { connectors } = ConnectorController.state

      // 새로운 연결 시작 전 기존 연결 해제 (지갑에 disconnect 이벤트 전달)
      const isAlreadyConnected = Boolean(AccountController.state.address)
      if (isAlreadyConnected) {
        try {
          await ChainController.disconnect()
        } catch (error) {
          // 기존 연결 해제 중 오류 발생 시 계속 진행
        }
      }

      // 최종 선택된 커넥터 - 우선순위 기반 선택
      let connector = null

      // 1순위: ANNOUNCED 커넥터 (CROSS Wallet 전용)
      if (this.wallet?.rdns) {
        connector = connectors.find(
          c => c.type === 'ANNOUNCED' && c.info?.rdns === this.wallet?.rdns
        )
      }

      // 2순위: 이름 매칭
      if (!connector) {
        connector = connectors.find(c => c.name === this.wallet?.name)
      }

      // 3순위: INJECTED 커넥터 (마지막 수단)
      if (!connector) {
        connector = connectors.find(c => c.type === 'INJECTED')
      }

      if (connector) {
        if (this.isCrossWalletInstalled) {
          await ConnectionController.connectExternal(connector, connector.chain)

          ModalController.close()

          EventsController.sendEvent({
            type: 'track',
            event: 'CONNECT_SUCCESS',
            properties: { method: 'browser', name: this.wallet?.name || 'Unknown' }
          })
        } else {
          // Cross Wallet이 설치되지 않았으면 에러 발생시키지 않고 현재 화면 유지
          console.log('Cross Wallet not installed - staying on install screen')
          return
        }
      } else {
        throw new Error('cross-w3m-connecting-wc-browser: No connector found')
      }
    } catch (error) {
      EventsController.sendEvent({
        type: 'track',
        event: 'CONNECT_ERROR',
        properties: { message: (error as BaseError)?.message ?? 'Unknown' }
      })
      this.error = true
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-wc-browser': W3mConnectingWcBrowser
  }
}
