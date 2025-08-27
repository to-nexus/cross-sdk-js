import type { BaseError } from '@to-nexus/appkit-core'
import {
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

    console.log('🔥 [Browser Tab] 컴포넌트 생성됨')
    console.log('🔥 [Browser Tab] 생성자에서 받은 지갑:', this.wallet)
    console.log('🔥 [Browser Tab] 생성자에서 받은 커넥터:', this.connector)

    if (!this.wallet) {
      console.log('🔥 [Browser Tab] ❌ 지갑 정보가 없어서 에러 발생')
      throw new Error('cross-w3m-connecting-wc-browser: No wallet provided')
    }

    console.log('🔥 [Browser Tab] onConnect 및 onAutoConnect 바인딩')
    this.onConnect = this.onConnectProxy.bind(this)
    this.onAutoConnect = this.onConnectProxy.bind(this)

    console.log('🔥 [Browser Tab] SELECT_WALLET 이벤트 전송')
    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_WALLET',
      properties: { name: this.wallet.name, platform: 'browser' }
    })
  }

  // -- Private ------------------------------------------- //
  private async onConnectProxy() {
    try {
      console.log('🔥 [Browser Tab] onConnectProxy 시작')
      console.log('🔥 [Browser Tab] 현재 지갑:', this.wallet)
      console.log('🔥 [Browser Tab] 지갑 rdns:', this.wallet?.rdns)

      this.error = false
      const { connectors } = ConnectorController.state

      console.log('🔥 [Browser Tab] 전체 커넥터 목록:')
      connectors.forEach((c, index) => {
        console.log(`  ${index + 1}. ${c.name || 'Unknown'} (${c.type})`)
        if (c.type === 'ANNOUNCED') {
          console.log(`     - rdns: ${c.info?.rdns || 'None'}`)
        }
        console.log(`     - id: ${c.id}`)
      })

      // 1차: ANNOUNCED + rdns 매칭
      const announcedConnector = connectors.find(
        c => c.type === 'ANNOUNCED' && c.info?.rdns === this.wallet?.rdns
      )
      console.log('🔥 [Browser Tab] ANNOUNCED 매칭 결과:', announcedConnector)

      // 2차: INJECTED 커넥터
      const injectedConnector = connectors.find(c => c.type === 'INJECTED')
      console.log('🔥 [Browser Tab] INJECTED 커넥터 결과:', injectedConnector)

      // 3차: 이름 매칭
      const nameMatchConnector = connectors.find(c => c.name === this.wallet?.name)
      console.log('🔥 [Browser Tab] 이름 매칭 결과:', nameMatchConnector)

      // 최종 선택된 커넥터 - 우선순위 기반 선택
      let connector = null

      // 1순위: ANNOUNCED 커넥터 (Cross Wallet 전용)
      if (this.wallet?.rdns) {
        connector = connectors.find(
          c => c.type === 'ANNOUNCED' && c.info?.rdns === this.wallet?.rdns
        )
        if (connector) {
          console.log('🔥 [Browser Tab] ANNOUNCED 커넥터 우선 선택:', connector)
        }
      }

      // 2순위: 이름 매칭
      if (!connector) {
        connector = connectors.find(c => c.name === this.wallet?.name)
        if (connector) {
          console.log('🔥 [Browser Tab] 이름 매칭 커넥터 선택:', connector)
        }
      }

      // 3순위: INJECTED 커넥터 (마지막 수단)
      if (!connector) {
        connector = connectors.find(c => c.type === 'INJECTED')
        if (connector) {
          console.log('🔥 [Browser Tab] INJECTED 커넥터 선택 (마지막 수단):', connector)
        }
      }

      console.log('🔥 [Browser Tab] 최종 선택된 커넥터:', connector)
      console.log('🔥 [Browser Tab] 커넥터 체인:', connector?.chain)

      if (connector) {
        console.log('🔥 [Browser Tab] ConnectionController.connectExternal 호출 중...')
        await ConnectionController.connectExternal(connector, connector.chain)
        console.log('🔥 [Browser Tab] 연결 성공! 모달 닫기')
      } else {
        console.log('🔥 [Browser Tab] 커넥터를 찾을 수 없음 - 에러 발생')
        throw new Error('cross-w3m-connecting-wc-browser: No connector found')
      }

      ModalController.close()

      console.log('🔥 [Browser Tab] 성공 이벤트 전송')
      EventsController.sendEvent({
        type: 'track',
        event: 'CONNECT_SUCCESS',
        properties: { method: 'browser', name: this.wallet?.name || 'Unknown' }
      })
    } catch (error) {
      console.log('🔥 [Browser Tab] 연결 실패:', error)
      console.log('🔥 [Browser Tab] 에러 메시지:', (error as BaseError)?.message)

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
