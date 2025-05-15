import type { BaseError } from '@to-nexus/appkit-core'
import {
  ConnectionController,
  ConnectorController,
  EventsController,
  ModalController
} from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { W3mConnectingWidget } from '../../utils/w3m-connecting-widget/index.js'

@customElement('cro-connecting-wc-browser')
export class W3mConnectingWcBrowser extends W3mConnectingWidget {
  public constructor() {
    super()
    if (!this.wallet) {
      throw new Error('cro-connecting-wc-browser: No wallet provided')
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

      const connector = connectors.find(
        c =>
          (c.type === 'ANNOUNCED' && c.info?.rdns === this.wallet?.rdns) ||
          c.type === 'INJECTED' ||
          c.name === this.wallet?.name
      )

      if (connector) {
        await ConnectionController.connectExternal(connector, connector.chain)
      } else {
        throw new Error('cro-connecting-wc-browser: No connector found')
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
    'cro-connecting-wc-browser': W3mConnectingWcBrowser
  }
}
