/**
 * CROSS Wallet 익스텐션 감지를 위한 공통 유틸리티
 * scaffold-ui와 appkit에서 공통으로 사용 가능
 */

// ConnectorController import가 필요하지만 순환 의존성을 피하기 위해 인터페이스로 정의
interface ConnectorInfo {
  rdns?: string
}

interface Connector {
  type: string
  info?: ConnectorInfo
}

interface ConnectorState {
  connectors: Connector[]
}

// 전역 ConnectorController에 접근하는 함수
function getConnectorState(): ConnectorState | null {
  try {
    // 런타임에 ConnectorController가 있는지 확인
    if (typeof window !== 'undefined' && (window as any).__APPKIT_CONNECTOR_CONTROLLER__) {
      return (window as any).__APPKIT_CONNECTOR_CONTROLLER__.state
    }
    return null
  } catch {
    return null
  }
}

export const CrossWalletUtil = {
  /**
   * CROSS Wallet 익스텐션이 설치되어 있는지 확인
   *
   * @param rdns - 지갑의 RDNS (기본값: 'nexus.to.crosswallet.desktop')
   * @param connectorState - ConnectorController.state (선택적, 없으면 전역에서 찾기 시도)
   * @returns 익스텐션 설치 여부
   */
  isExtensionInstalled(
    rdns: string = 'nexus.to.crosswallet.desktop',
    connectorState?: ConnectorState
  ): boolean {
    // 1순위: ANNOUNCED 커넥터에서 정확한 RDNS로 찾기
    const state = connectorState || getConnectorState()
    if (state) {
      const announced = state.connectors.filter(
        c => c.type === 'ANNOUNCED' && c.info?.rdns === rdns
      )

      if (announced && announced.length > 0) {
        return true
      }
    }

    // 2순위: window에서 Cross Wallet 전용 체크
    if (typeof window !== 'undefined') {
      // Cross Wallet의 정확한 RDNS 체크
      if (rdns === 'nexus.to.crosswallet.desktop') {
        const ethereum = (window as any).ethereum

        if (!ethereum) {
          return false
        }

        // 1. RDNS 기반 직접 체크
        const crossWallet = ethereum[rdns]
        if (crossWallet) {
          return true
        }

        // 2. ethereum providers 배열에서 Cross Wallet 찾기
        if (ethereum.providers && Array.isArray(ethereum.providers)) {
          const foundInProviders = ethereum.providers.some((provider: any) => {
            // provider에 RDNS 속성이 있는지 확인
            if (provider && provider[rdns]) {
              return true
            }
            // provider._metamask 등 다른 속성으로도 확인
            if (provider && typeof provider === 'object') {
              return Object.prototype.hasOwnProperty.call(provider, rdns)
            }
            return false
          })

          if (foundInProviders) {
            return true
          }
        }

        // 3. EIP-6963 이벤트 기반 체크 (추가 안전장치)
        if (ethereum.isMetaMask === false && ethereum[rdns]) {
          return true
        }

        // 4. 일반적인 지갑 감지 방식들
        if (ethereum.isCrossWallet || ethereum._crossWallet) {
          return true
        }
      }
    }

    return false
  },

  /**
   * 디버깅을 위한 상세한 익스텐션 정보 반환
   *
   * @param rdns - 지갑의 RDNS
   * @param connectorState - ConnectorController.state (선택적)
   * @returns 디버깅 정보 객체
   */
  getExtensionDebugInfo(
    rdns: string = 'nexus.to.crosswallet.desktop',
    connectorState?: ConnectorState
  ) {
    const debugInfo = {
      rdns,
      isInstalled: false,
      detectionMethod: 'none' as
        | 'announced'
        | 'rdns'
        | 'providers'
        | 'eip6963'
        | 'general'
        | 'none',
      ethereum: {
        exists: false,
        hasRdnsProperty: false,
        providersCount: 0,
        keys: [] as string[]
      },
      announced: {
        count: 0,
        connectors: [] as any[]
      }
    }

    // ANNOUNCED 커넥터 체크
    const state = connectorState || getConnectorState()
    if (state) {
      const announced = state.connectors.filter(
        c => c.type === 'ANNOUNCED' && c.info?.rdns === rdns
      )

      debugInfo.announced.count = announced.length
      debugInfo.announced.connectors = announced

      if (announced.length > 0) {
        debugInfo.isInstalled = true
        debugInfo.detectionMethod = 'announced'
        return debugInfo
      }
    }

    // Window 체크
    if (typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum

      debugInfo.ethereum.exists = !!ethereum

      if (ethereum) {
        debugInfo.ethereum.hasRdnsProperty = !!ethereum[rdns]
        debugInfo.ethereum.providersCount = ethereum.providers?.length || 0
        debugInfo.ethereum.keys = Object.keys(ethereum)

        // RDNS 직접 체크
        if (ethereum[rdns]) {
          debugInfo.isInstalled = true
          debugInfo.detectionMethod = 'rdns'
          return debugInfo
        }

        // Providers 배열 체크
        if (ethereum.providers && Array.isArray(ethereum.providers)) {
          const foundInProviders = ethereum.providers.some((provider: any) => {
            return (
              provider && (provider[rdns] || Object.prototype.hasOwnProperty.call(provider, rdns))
            )
          })

          if (foundInProviders) {
            debugInfo.isInstalled = true
            debugInfo.detectionMethod = 'providers'
            return debugInfo
          }
        }

        // EIP-6963 체크
        if (ethereum.isMetaMask === false && ethereum[rdns]) {
          debugInfo.isInstalled = true
          debugInfo.detectionMethod = 'eip6963'
          return debugInfo
        }

        // 일반적인 속성 체크
        if (ethereum.isCrossWallet || ethereum._crossWallet) {
          debugInfo.isInstalled = true
          debugInfo.detectionMethod = 'general'
          return debugInfo
        }
      }
    }

    return debugInfo
  },

  /**
   * ConnectorController 상태를 전역에 등록하는 헬퍼 함수
   * AppKit에서 초기화 시 호출
   */
  registerConnectorState(connectorController: any) {
    if (typeof window !== 'undefined') {
      ;(window as any).__APPKIT_CONNECTOR_CONTROLLER__ = connectorController
    }
  }
}
