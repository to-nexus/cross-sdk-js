/* eslint-disable max-depth */
import { ParseUtil, type ParsedCaipAddress } from '@to-nexus/appkit-common'
import {
  AccountController,
  ChainController,
  ConnectionController,
  type Connector,
  ConnectorController,
  CoreHelperUtil,
  EventsController,
  ModalController,
  OptionsController,
  RouterController,
  SIWXUtil,
  type SIWXSession,
  StorageUtil,
  type WcWallet
} from '@to-nexus/appkit-core'
import { SocialProviderEnum } from '@to-nexus/appkit-utils'

import { ConstantsUtil } from './ConstantsUtil.js'
import type { SocialProvider } from './TypeUtil.js'

interface ConnectWalletConnect {
  walletConnect: boolean
  wallet?: WcWallet
  connector?: Connector
}

export const ConnectorUtil = {
  connectWalletConnect({
    walletConnect,
    wallet,
    connector
  }: ConnectWalletConnect): Promise<ParsedCaipAddress> {
    return new Promise(async (resolve, reject) => {
      // 새로운 연결 시작 전 기존 연결 해제 (지갑에 disconnect 이벤트 전달)
      const isAlreadyConnected = Boolean(AccountController.state.address)
      if (isAlreadyConnected) {
        console.log('🔄 WalletConnect 연결 시작 전 기존 연결 해제 중...')
        try {
          await ChainController.disconnect()
          console.log('✅ 기존 연결 해제 완료')
        } catch (error) {
          console.log('⚠️ 기존 연결 해제 중 오류 발생 (계속 진행):', error)
        }
      }

      if (walletConnect) {
        ConnectorController.setActiveConnector(connector)
      }

      await ModalController.open()
      RouterController.push('ConnectingWalletConnect', { wallet })

      const unsubscribeModalController = ModalController.subscribeKey('open', val => {
        if (!val) {
          if (RouterController.state.view !== 'Connect') {
            RouterController.push('Connect')
          }
          unsubscribeModalController()
          reject(new Error('Modal closed'))
        }
      })

      const unsubscribeChainController = ChainController.subscribeKey('activeCaipAddress', val => {
        if (val) {
          ModalController.close()
          unsubscribeChainController()
          resolve(ParseUtil.parseCaipAddress(val))
        }
      })
    })
  },
  connectExternal(connector: Connector): Promise<ParsedCaipAddress> {
    return new Promise(async (resolve, reject) => {
      let isResolved = false
      let connectionStartTime = Date.now()

      // 새로운 연결 시작 전 기존 연결 해제 (지갑에 disconnect 이벤트 전달)
      const isAlreadyConnected = Boolean(AccountController.state.address)
      if (isAlreadyConnected) {
        try {
          await ChainController.disconnect()
        } catch (error) {
          // 기존 연결 해제 중 오류 발생 시 계속 진행
        }
      }

      // 연결 상태 변화 감지
      const unsubscribeChainController = ChainController.subscribeKey('activeCaipAddress', val => {
        // 연결이 시작된 후에만 성공으로 처리 (이전 연결 상태 무시)
        if (val && !isResolved && Date.now() - connectionStartTime > 100) {
          isResolved = true
          ModalController.close()
          unsubscribeChainController()
          clearTimeout(timeout)
          resolve(ParseUtil.parseCaipAddress(val))
        }
      })

      // 모달 상태 감지 (사용자가 모달을 닫으면 연결 취소로 간주)
      const unsubscribeModalController = ModalController.subscribeKey('open', isOpen => {
        // 모달이 닫히고 아직 연결되지 않았으면 사용자가 취소한 것으로 간주
        if (!isOpen && !isResolved && Date.now() - connectionStartTime > 1000) {
          isResolved = true
          unsubscribeChainController()
          unsubscribeModalController()
          clearTimeout(timeout)
          reject(new Error('Connection rejected by user'))
        }
      })

      // 타임아웃 설정 (30초)
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          unsubscribeChainController()
          unsubscribeModalController()
          reject(new Error('Connection timeout'))
        }
      }, 30000)

      try {
        await ConnectionController.connectExternal(connector, connector.chain)
        // 연결 요청이 성공적으로 전송되었지만, 실제 연결은 사용자 승인 대기 중
      } catch (error) {
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeout)
          unsubscribeChainController()
          unsubscribeModalController()

          // 에러 메시지 분석
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (
            errorMessage.includes('User rejected') ||
            errorMessage.includes('User denied') ||
            errorMessage.includes('rejected')
          ) {
            reject(new Error('Connection rejected by user'))
          } else {
            reject(new Error('Connection failed'))
          }
        }
      }
    })
  },
  connectSocial(social: SocialProvider): Promise<ParsedCaipAddress> {
    let socialWindow: Window | null | undefined = AccountController.state.socialWindow
    let socialProvider = AccountController.state.socialProvider
    let connectingSocial = false
    let popupWindow: Window | null = null

    const unsubscribeChainController = ChainController.subscribeKey('activeCaipAddress', val => {
      if (val) {
        ModalController.close()
        unsubscribeChainController()
      }
    })

    return new Promise((resolve, reject) => {
      async function handleSocialConnection(event: MessageEvent) {
        if (event.data?.resultUri) {
          if (event.origin === ConstantsUtil.SECURE_SITE_ORIGIN) {
            window.removeEventListener('message', handleSocialConnection, false)
            try {
              const authConnector = ConnectorController.getAuthConnector()

              if (authConnector && !connectingSocial) {
                if (socialWindow) {
                  socialWindow.close()
                  AccountController.setSocialWindow(undefined, ChainController.state.activeChain)
                  socialWindow = AccountController.state.socialWindow
                }
                connectingSocial = true
                const uri = event.data.resultUri as string

                if (socialProvider) {
                  EventsController.sendEvent({
                    type: 'track',
                    event: 'SOCIAL_LOGIN_REQUEST_USER_DATA',
                    properties: { provider: socialProvider }
                  })
                }
                await authConnector.provider.connectSocial(uri)

                if (socialProvider) {
                  StorageUtil.setConnectedSocialProvider(socialProvider)
                  await ConnectionController.connectExternal(authConnector, authConnector.chain)

                  const caipAddress = ChainController.state.activeCaipAddress

                  if (!caipAddress) {
                    reject(new Error('Failed to connect'))

                    return
                  }

                  resolve(ParseUtil.parseCaipAddress(caipAddress))

                  EventsController.sendEvent({
                    type: 'track',
                    event: 'SOCIAL_LOGIN_SUCCESS',
                    properties: { provider: socialProvider }
                  })
                }
              }
            } catch (err) {
              reject(new Error('Failed to connect'))
              if (socialProvider) {
                EventsController.sendEvent({
                  type: 'track',
                  event: 'SOCIAL_LOGIN_ERROR',
                  properties: { provider: socialProvider }
                })
              }
            }
          } else if (socialProvider) {
            EventsController.sendEvent({
              type: 'track',
              event: 'SOCIAL_LOGIN_ERROR',
              properties: { provider: socialProvider }
            })
          }
        }
      }

      async function connectSocial() {
        if (social) {
          AccountController.setSocialProvider(social, ChainController.state.activeChain)
          socialProvider = AccountController.state.socialProvider
          EventsController.sendEvent({
            type: 'track',
            event: 'SOCIAL_LOGIN_STARTED',
            properties: { provider: socialProvider as SocialProvider }
          })
        }

        if (socialProvider === SocialProviderEnum.Farcaster) {
          ModalController.open({ view: 'ConnectingFarcaster' })

          const unsubscribeModalController = ModalController.subscribeKey('open', val => {
            if (!val && social === 'farcaster') {
              reject(new Error('Popup closed'))
              RouterController.push('Connect')
              unsubscribeModalController()
            }
          })

          const authConnector = ConnectorController.getAuthConnector()

          if (authConnector) {
            if (!AccountController.state.farcasterUrl) {
              try {
                const { url } = await authConnector.provider.getFarcasterUri()

                AccountController.setFarcasterUrl(url, ChainController.state.activeChain)
              } catch {
                reject(new Error('Failed to connect to farcaster'))
              }
            }
          }
        } else {
          const authConnector = ConnectorController.getAuthConnector()
          popupWindow = CoreHelperUtil.returnOpenHref(
            '',
            'popupWindow',
            'width=600,height=800,scrollbars=yes'
          )

          try {
            if (authConnector && socialProvider) {
              const { uri } = await authConnector.provider.getSocialRedirectUri({
                provider: socialProvider
              })

              if (popupWindow && uri) {
                AccountController.setSocialWindow(popupWindow, ChainController.state.activeChain)
                socialWindow = AccountController.state.socialWindow
                popupWindow.location.href = uri

                const interval = setInterval(() => {
                  if (socialWindow?.closed && !connectingSocial) {
                    reject(new Error('Popup closed'))
                    clearInterval(interval)
                  }
                }, 1000)

                window.addEventListener('message', handleSocialConnection, false)
              } else {
                popupWindow?.close()
                reject(new Error('Failed to initiate social connection'))
              }
            }
          } catch {
            reject(new Error('Failed to initiate social connection'))
            popupWindow?.close()
          }
        }
      }

      connectSocial()
    })
  },

  connectCrossExtensionWallet(): Promise<ParsedCaipAddress> {
    return new Promise(async (resolve, reject) => {
      try {
        const { customWallets } = OptionsController.state
        const crossWallet = customWallets?.find(w => w.id === 'cross_wallet')
        if (!crossWallet) {
          throw new Error('ONEwallet+이 customWallets에 설정되지 않았습니다.')
        }
        if (!crossWallet.rdns) {
          throw new Error('ONEwallet+ RDNS가 설정되지 않았습니다.')
        }
        const currentConnectors = ConnectorController.state.connectors
        const crossWalletExtensionConnectors = currentConnectors.filter(c => {
          return (c.type === 'ANNOUNCED' || c.type === 'INJECTED') && c.info?.rdns === crossWallet.rdns
        })
        if (!crossWalletExtensionConnectors || crossWalletExtensionConnectors.length === 0) {
          throw new Error('ONEwallet+ 익스텐션이 설치되지 않았습니다.')
        }
        const browserConnector = crossWalletExtensionConnectors[0]
        if (browserConnector) {
          const result = await ConnectorUtil.connectExternal(browserConnector)
          resolve(result)
        } else {
          throw new Error('ONEwallet+ 커넥터를 찾을 수 없습니다.')
        }
      } catch (err) {
        reject(err)
      }
    })
  },

  /**
   * Connect Cross Extension Wallet and perform SIWE authentication in one step.
   * Similar to authenticateWalletConnect() but for extension connections.
   * 
   * @returns Promise with authentication result including sessions
   */
  async authenticateCrossExtensionWallet(): Promise<{
    authenticated: boolean
    sessions: SIWXSession[]
  }> {
    const siwx = OptionsController.state.siwx

    if (!siwx) {
      // If SIWX is not configured, just connect without authentication
      await ConnectorUtil.connectCrossExtensionWallet()
      return { authenticated: false, sessions: [] }
    }

    // Set flag to prevent auto SIWE modal during manual authentication
    console.log('🚀 Setting _isAuthenticating = true before connecting extension')
    SIWXUtil._isAuthenticating = true

    try {
      // 1. Connect the extension wallet
      console.log('🔌 Starting extension connection...')
      await ConnectorUtil.connectCrossExtensionWallet()
      console.log('✅ Extension connected')

      // 2. Wait for connection to be established
      const caipAddress = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsubscribe()
          reject(new Error('Connection timeout waiting for address'))
        }, 10000)

        const unsubscribe = AccountController.subscribeKey('address', address => {
          if (address) {
            clearTimeout(timeout)
            unsubscribe()
            resolve(ChainController.getActiveCaipAddress() || '')
          }
        })

        // Check if already connected
        const currentAddress = AccountController.state.address
        if (currentAddress) {
          clearTimeout(timeout)
          unsubscribe()
          resolve(ChainController.getActiveCaipAddress() || '')
        }
      })

      if (!caipAddress) {
        throw new Error('Failed to get CAIP address after connection')
      }

      // 3. Get address and network info
      const address = CoreHelperUtil.getPlainAddress(caipAddress as any)
      const network = ChainController.getActiveCaipNetwork()

      if (!address || !network) {
        throw new Error('Failed to get address or network information')
      }

      // 4. Create SIWE message
      const siwxMessage = await siwx.createMessage({
        chainId: network.caipNetworkId,
        accountAddress: address
      })

      const message = siwxMessage.toString()

      // 5. Sign the message directly using the connection client
      const client = ConnectionController._getClient()
      if (!client) {
        throw new Error('No connection client available')
      }

      const signature = await client.signMessage({ message })

      if (!signature) {
        throw new Error('Failed to get signature')
      }

      // 6. Create and store session
      // Use the siwxMessage directly as it already contains all required Data fields
      const session: SIWXSession = {
        data: {
          accountAddress: siwxMessage.accountAddress,
          chainId: siwxMessage.chainId,
          domain: siwxMessage.domain,
          uri: siwxMessage.uri,
          version: siwxMessage.version,
          nonce: siwxMessage.nonce,
          issuedAt: siwxMessage.issuedAt,
          expirationTime: siwxMessage.expirationTime,
          statement: siwxMessage.statement,
          requestId: siwxMessage.requestId,
          resources: siwxMessage.resources,
          notBefore: siwxMessage.notBefore
        },
        message,
        signature,
        cacao: undefined
      }

      await siwx.addSession(session)

      // Verify session was saved before SDK's auto initializeIfEnabled() runs
      // This prevents duplicate SIWE modal from appearing
      let savedSessions = await siwx.getSessions(network.caipNetworkId, address)
      if (savedSessions.length === 0) {
        console.warn('⚠️ Session not found immediately after saving, waiting...')
        // Give a small delay for session to be fully persisted
        await new Promise(resolve => setTimeout(resolve, 100))
        // Re-check after delay
        savedSessions = await siwx.getSessions(network.caipNetworkId, address)
        console.log('🔄 Re-checked sessions after delay:', savedSessions.length)
      }

      // Delay flag clearing to ensure initializeIfEnabled sees the flag
      // Use setTimeout to clear flag after current call stack
      setTimeout(() => {
        console.log('🏁 Clearing _isAuthenticating flag (delayed)')
        SIWXUtil._isAuthenticating = false
      }, 200)

      return {
        authenticated: true,
        sessions: [session]
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      // Clear flag after failed authentication
      SIWXUtil._isAuthenticating = false
      // Re-throw to let caller handle the error
      throw error
    }
  },

  isInstalledCrossExtensionWallet(): boolean {
    const { customWallets } = OptionsController.state
    const crossWallet = customWallets?.find(w => w.id === 'cross_wallet')
    if (!crossWallet || !crossWallet.rdns) {
      return false
    }
    const { connectors } = ConnectorController.state
    const crossWalletExtensionConnectors = connectors.filter(c => {
      return (c.type === 'ANNOUNCED' || c.type === 'INJECTED') && c.info?.rdns === crossWallet.rdns
    })
    return crossWalletExtensionConnectors && crossWalletExtensionConnectors.length > 0
  }
}
