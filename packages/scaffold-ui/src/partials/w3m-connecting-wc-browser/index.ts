import type { BaseError } from '@to-nexus/appkit-core'
import {
  AccountController,
  ChainController,
  ConnectionController,
  ConnectorController,
  EventsController,
  ModalController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { W3mConnectingWidget } from '../../utils/w3m-connecting-widget/index.js'

@customElement('cross-w3m-connecting-wc-browser')
export class W3mConnectingWcBrowser extends W3mConnectingWidget {
  public constructor() {
    super()

    if (!this.wallet) {
      throw new Error('cross-w3m-connecting-wc-browser: No wallet provided')
    }

    this.onConnect = this.onConnectProxy.bind(this)
    this.onAutoConnect = this.onConnectProxy.bind(this)

    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WALLET',
      properties: { name: this.wallet.name, platform: 'browser' }
    })
  }

  // -- Private ------------------------------------------- //
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

      // 1순위: ANNOUNCED 커넥터 (Cross Wallet 전용)
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
        await ConnectionController.connectExternal(connector, connector.chain)
      } else {
        throw new Error('cross-w3m-connecting-wc-browser: No connector found')
      }

      ModalController.close()

      EventsController.sendEvent({
        type: 'track',
        event: 'CONNECT_SUCCESS',
        properties: { method: 'browser', name: this.wallet?.name || 'Unknown' }
      })
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
