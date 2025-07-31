import { ConnectionController, type Connector, ConnectorController, OptionsController } from '@to-nexus/appkit-core'

import { ApiController } from './controllers/ApiController.js'
import { WalletButtonController } from './controllers/WalletButtonController.js'
import { ConnectorUtil } from './utils/ConnectorUtil.js'
import { ConstantsUtil } from './utils/ConstantsUtil.js'
import type { SocialProvider, Wallet } from './utils/TypeUtil.js'
import { WalletUtil } from './utils/WalletUtil.js'

export class AppKitWalletButton {
  constructor() {
    // if (!this.isReady()) {
    //   ApiController.fetchWalletButtons()
    // }
  }

  public isReady() {
    return WalletButtonController.state.ready
  }

  public subscribeIsReady(callback: ({ isReady }: { isReady: boolean }) => void) {
    ApiController.subscribeKey('walletButtons', val => {
      if (val.length) {
        callback({ isReady: true })
      } else {
        callback({ isReady: false })
      }
    })
  }

  async disconnect() {
    WalletButtonController.setPending(true)
    WalletButtonController.setError(undefined)
    await ConnectionController.disconnect()
    WalletButtonController.setPending(false)
  }

  async connect(wallet: Wallet) {
    try {

      WalletButtonController.setPending(true)
      WalletButtonController.setError(undefined)



      if (ConstantsUtil.Socials.some(social => social === wallet)) {
        const result = await ConnectorUtil.connectSocial(wallet as SocialProvider)
        this.handleSuccess(result)
        return result
      }

      const walletButton = WalletUtil.getWalletButton(wallet)


      const connector = walletButton
        ? ConnectorController.getConnector(walletButton.id, walletButton.rdns)
        : undefined

      if (connector) {
        const result = await ConnectorUtil.connectExternal(connector)
        this.handleSuccess(result)

        return result
      }
      // added by sonny-nexus for direct access to cross desktop wallet
      // 1. If an announced wallet (Cross desktop wallet) exists, connect to the desktop wallet
      // 2. If not, connect to the cross wallet app
      const crossWalletDesktopId = 'nexus.to.crosswallet.desktop' //rdns | name | uuid
      const currentConnectors = ConnectorController.state.connectors
      const announced = currentConnectors?.filter(c => c.type === 'ANNOUNCED' && c.id === crossWalletDesktopId)

      if (announced && announced.length > 0) {
        const crossWalletConnector = announced[0];
        if (crossWalletConnector) {
          const result = await ConnectorUtil.connectExternal(crossWalletConnector);
          this.handleSuccess(result)

          return result
        }
      }
      // added by Harvey-Probe for direct access to custom wallets
      const { customWallets } = OptionsController.state
      const customWallet = customWallets?.find(w => w.id === wallet)

      const result = await ConnectorUtil.connectWalletConnect({
        walletConnect: wallet === 'cross_wallet',
        connector: currentConnectors.find((c: Connector) => c.id === wallet),
        wallet: customWallet
      })
      this.handleSuccess(result)
      return result
    } catch (err) {
      this.handleError(err)
      throw err
    } finally {
      WalletButtonController.setPending(false)
    }
  }

  private handleSuccess(result: any) {
    console.log('Connection successful:', result)
    // 여기에 성공 시 추가 로직을 구현할 수 있습니다
  }

  private handleError(err: any) {
    console.error('Connection failed:', err)
    WalletButtonController.setError(err)
    // 여기에 에러 처리 로직을 구현할 수 있습니다
  }
}
