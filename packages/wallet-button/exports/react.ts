/* eslint-disable consistent-return */
import { useCallback, useEffect } from 'react'

import type { ParsedCaipAddress } from '@to-nexus/appkit-common'
import {
  ChainController,
  type Connector,
  ConnectorController,
  OptionsController,
  RouterController
} from '@to-nexus/appkit-core'
import { useSnapshot } from 'valtio'

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

        // added by Harvey-Probe for direct access to custom wallets
        // console.log('커스텀 지갑 직접 접근 시작')
        const { customWallets } = OptionsController.state
        // console.log('customWallets:', customWallets)
        const customWallet = customWallets?.find(w => w.id === wallet)
        // console.log('찾은 customWallet:', customWallet)

        // CROSS Wallet 특별 처리: w3modal에서 Browser/QR 탭 선택하게 하기
        if (customWallet && wallet === 'cross_wallet') {
          // console.log('🎯 CROSS Wallet 감지됨 - w3modal 열기:', wallet)

          await ConnectorUtil.connectWalletConnect({
            walletConnect: wallet === 'cross_wallet',
            connector: connectors.find(c => c.id === wallet) as Connector | undefined,
            wallet: customWallet
          }).then(handleSuccess)
          return
        }

        // 다른 브라우저 익스텐션의 경우 직접 연결 시도
        if (customWallet?.rdns && wallet !== 'cross_wallet') {
          // console.log('🔍 다른 브라우저 확장 프로그램 감지됨, rdns:', customWallet.rdns)
          const currentConnectors = ConnectorController.state.connectors
          const announced = currentConnectors.filter(
            c => c.type === 'ANNOUNCED' && c.id === customWallet.rdns
          )

          if (announced && announced.length > 0) {
            const browserConnector = announced[0]
            if (browserConnector) {
              // console.log('🚀 브라우저 커넥터로 직접 연결 시도 중...')
              await ConnectorUtil.connectExternal(browserConnector).then(handleSuccess)
              // console.log('✅ 브라우저 커넥터 연결 성공!')
              return
            }
          }

          throw new Error(
            `${customWallet.name} extension not found. Please install the ${customWallet.name} browser extension.`
          )
        }

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

  // CROSS Wallet 전용 연결 함수들
  const connectCrossWallet = useCallback(async () => {
    connect('cross_wallet')
  }, [connect])

  const connectCrossExtensionWallet = useCallback(async () => {
    try {
      WalletButtonController.setPending(true)
      WalletButtonController.setError(undefined)

      const { customWallets } = OptionsController.state
      const crossWallet = customWallets?.find(w => w.id === 'cross_wallet')

      if (!crossWallet) {
        throw new Error('CROSS Wallet이 customWallets에 설정되지 않았습니다.')
      }

      if (!crossWallet.rdns) {
        throw new Error('CROSS Wallet RDNS가 설정되지 않았습니다.')
      }

      // 익스텐션 설치 확인
      const currentConnectors = ConnectorController.state.connectors
      const announced = currentConnectors.filter(
        c => c.type === 'ANNOUNCED' && c.info?.rdns === crossWallet.rdns
      )

      if (!announced || announced.length === 0) {
        throw new Error('CROSS Wallet 익스텐션이 설치되지 않았습니다.')
      }

      const browserConnector = announced[0]
      if (browserConnector) {
        await ConnectorUtil.connectExternal(browserConnector).then(handleSuccess)
      } else {
        throw new Error('CROSS Wallet 커넥터를 찾을 수 없습니다.')
      }
    } catch (err) {
      handleError(err)
    } finally {
      WalletButtonController.setPending(false)
    }
  }, [handleSuccess, handleError])

  const isInstalledCrossExtensionWallet = useCallback(() => {
    const { customWallets } = OptionsController.state
    const crossWallet = customWallets?.find(w => w.id === 'cross_wallet')

    if (!crossWallet || !crossWallet.rdns) {
      return false
    }

    // ANNOUNCED 커넥터에서 정확한 RDNS로 찾기
    const { connectors } = ConnectorController.state
    const announced = connectors.filter(
      c => c.type === 'ANNOUNCED' && c.info?.rdns === crossWallet.rdns
    )

    return announced && announced.length > 0
  }, [])

  return {
    data: walletButtonData,
    error: walletButtonError,
    isReady: isWalletButtonReady,
    isPending: isWalletButtonConnecting,
    isError: Boolean(walletButtonError),
    isSuccess: Boolean(walletButtonData),
    connect,
    connectCrossWallet,
    connectCrossExtensionWallet,
    isInstalledCrossExtensionWallet
  }
}
