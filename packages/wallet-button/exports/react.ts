/* eslint-disable consistent-return */
import { useCallback, useEffect } from 'react'

import { useSnapshot } from 'valtio'

import type { ParsedCaipAddress } from '@to-nexus/appkit-common'
import { ChainController, type Connector, ConnectorController, OptionsController } from '@to-nexus/appkit-core'

import { ApiController } from '../src/controllers/ApiController.js'
import { WalletButtonController } from '../src/controllers/WalletButtonController.js'
import { ConnectorUtil } from '../src/utils/ConnectorUtil.js'
import { ConstantsUtil } from '../src/utils/ConstantsUtil.js'
import type { SocialProvider } from '../src/utils/TypeUtil.js'
import { WalletUtil } from '../src/utils/WalletUtil.js'
import type { AppKitWalletButton, Wallet } from './index.js'

export * from './index.js'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-wallet-button': Pick<AppKitWalletButton, 'wallet'>
    }
  }
}

export function useAppKitWallet(parameters?: {
  onSuccess?: (data: ParsedCaipAddress) => void
  onError?: (error: Error) => void
}) {
  const { connectors } = useSnapshot(ConnectorController.state)
  const {
    pending: isWalletButtonConnecting,
    ready: isWalletButtonReady,
    error: walletButtonError,
    data: walletButtonData
  } = useSnapshot(WalletButtonController.state)

  const { onSuccess, onError } = parameters ?? {}

  // Prefetch wallet buttons
  // useEffect(() => {
  //   if (!isWalletButtonReady) {
  // ApiController.fetchWalletButtons()
  // }
  // }, [isWalletButtonReady])

  useEffect(
    () =>
      ChainController.subscribeKey('activeCaipAddress', val => {
        if (val) {
          WalletButtonController.setError(undefined)
          WalletButtonController.setPending(false)
        }
      }),
    []
  )

  useEffect(
    () =>
      ApiController.subscribeKey('walletButtons', val => {
        if (val.length) {
          WalletButtonController.setReady(true)
        }
      }),
    []
  )

  const handleSuccess = useCallback(
    (caipAddress: ParsedCaipAddress) => {
      WalletButtonController.setData(caipAddress)
      onSuccess?.(caipAddress)
    },
    [onSuccess]
  )

  const handleError = useCallback(
    (err: unknown) => {
      const finalError = err instanceof Error ? err : new Error('Something went wrong')
      WalletButtonController.setError(finalError)
      onError?.(finalError)
    },
    [onError]
  )

  const connect = useCallback(
    async (wallet: Wallet) => {
      try {

        WalletButtonController.setPending(true)
        WalletButtonController.setError(undefined)

        if (ConstantsUtil.Socials.some(social => social === wallet)) {
          await ConnectorUtil.connectSocial(wallet as SocialProvider).then(handleSuccess)

          return
        }

        const walletButton = WalletUtil.getWalletButton(wallet)


        const connector = walletButton
          ? ConnectorController.getConnector(walletButton.id, walletButton.rdns)
          : undefined
        if (connector) {
          await ConnectorUtil.connectExternal(connector).then(handleSuccess)

          return
        }
        // added by sonny-nexus for direct access to cross desktop wallet
        // 1. If an announced wallet (Cross desktop wallet) exists, connect to the desktop wallet
        // 2. If not, connect to the cross wallet app
        const crossWalletDesktopId = 'nexus.to.crosswallet.desktop' //rdns | name | uuid
        const currentConnectors = ConnectorController.state.connectors
        const announced = currentConnectors.filter(c => c.type === 'ANNOUNCED' && c.id === crossWalletDesktopId)
        if (announced && announced.length > 0) {
          const crossWalletConnector = announced[0];
          if (crossWalletConnector) {
            await ConnectorUtil.connectExternal(crossWalletConnector).then(handleSuccess)

            return
          }
        }
        // added by Harvey-Probe for direct access to custom wallets
        const { customWallets } = OptionsController.state
        const customWallet = customWallets?.find(w => w.id === wallet)

        await ConnectorUtil.connectWalletConnect({
          walletConnect: wallet === 'cross_wallet',
          connector: connectors.find(c => c.id === wallet) as Connector | undefined,
          wallet: customWallet
        }).then(handleSuccess)
      } catch (err) {
        handleError(err)
      } finally {
        WalletButtonController.setPending(false)
      }
    },
    [connectors, handleSuccess, handleError]
  )

  return {
    data: walletButtonData,
    error: walletButtonError,
    isReady: isWalletButtonReady,
    isPending: isWalletButtonConnecting,
    isError: Boolean(walletButtonError),
    isSuccess: Boolean(walletButtonData),
    connect
  }
}
