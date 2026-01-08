import { useState, useEffect } from 'react'
import { subscribe } from 'valtio/vanilla'

import type { ChainNamespace, CaipNetwork } from '@to-nexus/appkit-common'
import { ChainController } from '../src/controllers/ChainController.js'
import { ConnectionController } from '../src/controllers/ConnectionController.js'
import { ConnectorController } from '../src/controllers/ConnectorController.js'
import { CoreHelperUtil } from '../src/utils/CoreHelperUtil.js'
import type { UseAppKitAccountReturn, UseAppKitNetworkReturn, SocialProvider } from '../src/utils/TypeUtil.js'

// -- Hooks ------------------------------------------------------------
export function useAppKitNetworkCore(): Pick<
  UseAppKitNetworkReturn,
  'caipNetwork' | 'chainId' | 'caipNetworkId'
> {
  const [activeCaipNetwork, setActiveCaipNetwork] = useState<CaipNetwork | undefined>(
    ChainController.state.activeCaipNetwork
  )

  useEffect(() => {
    const unsubscribe = subscribe(ChainController.state, () => {
      setActiveCaipNetwork(ChainController.state.activeCaipNetwork)
    })
    return unsubscribe
  }, [])

  return {
    caipNetwork: activeCaipNetwork,
    chainId: activeCaipNetwork?.id,
    caipNetworkId: activeCaipNetwork?.caipNetworkId
  }
}

function getAccountState(namespace?: ChainNamespace): UseAppKitAccountReturn {
  const state = ChainController.state
  const chainNamespace = namespace || state.activeChain

  if (!chainNamespace) {
    return {
      allAccounts: [],
      address: undefined,
      caipAddress: undefined,
      status: undefined,
      isConnected: false,
      embeddedWalletInfo: undefined,
      balance: undefined,
      balanceSymbol: undefined,
      balanceLoading: undefined,
      tokenBalance: undefined
    }
  }

  const chainAccountState = state.chains.get(chainNamespace)?.accountState
  const authConnector = ConnectorController.getAuthConnector(chainNamespace)

  return {
    allAccounts: chainAccountState?.allAccounts || [],
    caipAddress: chainAccountState?.caipAddress,
    address: CoreHelperUtil.getPlainAddress(chainAccountState?.caipAddress),
    isConnected: Boolean(chainAccountState?.caipAddress),
    status: chainAccountState?.status,
    embeddedWalletInfo: authConnector
      ? {
          user: chainAccountState?.user,
          authProvider: (chainAccountState?.socialProvider || 'email') as SocialProvider | 'email',
          accountType: chainAccountState?.preferredAccountType,
          isSmartAccountDeployed: Boolean(chainAccountState?.smartAccountDeployed)
        }
      : undefined,
    balance: chainAccountState?.balance,
    balanceSymbol: chainAccountState?.balanceSymbol,
    balanceLoading: chainAccountState?.balanceLoading,
    tokenBalance: chainAccountState?.tokenBalance
  }
}

export function useAppKitAccount(options?: { namespace?: ChainNamespace }): UseAppKitAccountReturn {
  const [accountState, setAccountState] = useState<UseAppKitAccountReturn>(() => 
    getAccountState(options?.namespace)
  )

  useEffect(() => {
    const unsubscribe = subscribe(ChainController.state, () => {
      setAccountState(getAccountState(options?.namespace))
    })
    return unsubscribe
  }, [options?.namespace])

  return accountState
}

export function useDisconnect() {
  async function disconnect() {
    await ConnectionController.disconnect()
  }

  return { disconnect }
}