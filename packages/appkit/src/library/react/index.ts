import { useEffect, useState, useSyncExternalStore } from 'react'

import type { ChainNamespace } from '@to-nexus/appkit-common'
import type {
  AppKitAccountButton,
  AppKitButton,
  AppKitConnectButton,
  AppKitNetworkButton,
  W3mAccountButton,
  W3mButton,
  W3mConnectButton,
  W3mNetworkButton
} from '@to-nexus/appkit-scaffold-ui'
import { useSnapshot } from 'valtio'

import type { AppKit } from '../../../src/client.js'
import { ProviderUtil } from '../../store/ProviderUtil.js'
import type { AppKitOptions } from '../../utils/TypesUtil.js'

export type { SendTransactionArgs } from '@to-nexus/appkit-core'

type OpenOptions = {
  view:
    | 'Account'
    | 'Connect'
    | 'Networks'
    | 'ApproveTransaction'
    | 'OnRampProviders'
    | 'Swap'
    | 'WhatIsAWallet'
    | 'WhatIsANetwork'
    | 'AllWallets'
    | 'WalletSend'
  uri?: string
  namespace?: ChainNamespace
}

type ThemeModeOptions = AppKitOptions['themeMode']

type ThemeVariablesOptions = AppKitOptions['themeVariables']

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': Pick<
        AppKitButton,
        'size' | 'label' | 'loadingLabel' | 'disabled' | 'balance'
      >
      'appkit-connect-button': Pick<AppKitConnectButton, 'size' | 'label' | 'loadingLabel'>
      'appkit-account-button': Pick<AppKitAccountButton, 'disabled' | 'balance'>
      'appkit-network-button': Pick<AppKitNetworkButton, 'disabled'>
      'cross-w3m-connect-button': Pick<W3mConnectButton, 'size' | 'label' | 'loadingLabel'>
      'cross-w3m-account-button': Pick<W3mAccountButton, 'disabled' | 'balance'>
      'cross-w3m-button': Pick<
        W3mButton,
        'size' | 'label' | 'loadingLabel' | 'disabled' | 'balance'
      >
      'cross-w3m-network-button': Pick<W3mNetworkButton, 'disabled'>
    }
  }
}

let modal: AppKit | undefined = undefined

export function getAppKit(appKit: AppKit) {
  if (appKit) {
    modal = appKit
  }
}

export async function getUniversalProvider() {
  if (!modal) {
    throw new Error('Please call "createAppKit" before using "getUniversalProvider" hook')
  }
  return await modal.getUniversalProvider()
}

// -- Core Hooks ---------------------------------------------------------------
export * from '@to-nexus/appkit-core/react'

export function useAppKitProvider<T>(chainNamespace: ChainNamespace) {
  const { providers, providerIds } = useSnapshot(ProviderUtil.state)

  const walletProvider = providers[chainNamespace] as T
  const walletProviderType = providerIds[chainNamespace]

  return {
    walletProvider,
    walletProviderType
  }
}

export function useAppKitTheme() {
  if (!modal) {
    throw new Error('Please call "createAppKit" before using "useAppKitTheme" hook')
  }

  function setThemeMode(themeMode: ThemeModeOptions) {
    if (themeMode) {
      modal?.setThemeMode(themeMode)
    }
  }

  function setThemeVariables(themeVariables: ThemeVariablesOptions) {
    if (themeVariables) {
      modal?.setThemeVariables(themeVariables)
    }
  }

  const [themeMode, setInternalThemeMode] = useState(modal.getThemeMode())
  const [themeVariables, setInternalThemeVariables] = useState(modal.getThemeVariables())

  useEffect(() => {
    const unsubscribe = modal?.subscribeTheme(state => {
      setInternalThemeMode(state.themeMode)
      setInternalThemeVariables(state.themeVariables)
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return {
    themeMode,
    themeVariables,
    setThemeMode,
    setThemeVariables
  }
}

export function useAppKit() {
  if (!modal) {
    throw new Error('Please call "createAppKit" before using "useAppKit" hook')
  }

  async function connect() {
    if (modal?.getIsConnectedState()) return

    await modal?.open()
  }

  async function authenticateWalletConnect() {
    return await modal?.authenticateWalletConnect()
  }

  // async function open(options?: OpenOptions) {
  //   await modal?.open(options)
  // }

  // async function close() {
  //   await modal?.close()
  // }

  return { connect, authenticateWalletConnect }
}

export function useWalletInfo() {
  if (!modal) {
    throw new Error('Please call "createAppKit" before using "useWalletInfo" hook')
  }

  const walletInfo = useSyncExternalStore(
    modal.subscribeWalletInfo,
    modal.getWalletInfo,
    modal.getWalletInfo
  )

  return { walletInfo }
}

export function useAppKitState() {
  if (!modal) {
    throw new Error('Please call "createAppKit" before using "useAppKitState" hook')
  }

  const [state, setState] = useState(modal.getState())

  useEffect(() => {
    const unsubscribe = modal?.subscribeState(newState => {
      setState({ ...newState })
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return state
}

export function useAppKitEvents() {
  if (!modal) {
    throw new Error('Please call "createAppKit" before using "useAppKitEvents" hook')
  }

  const [event, setEvents] = useState(modal.getEvent())

  useEffect(() => {
    const unsubscribe = modal?.subscribeEvents(newEvent => {
      setEvents({ ...newEvent })
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return event
}
