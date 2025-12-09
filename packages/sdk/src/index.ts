import { createAppKit } from '@to-nexus/appkit'
import { EthersAdapter } from '@to-nexus/appkit-adapter-ethers'
import { ConstantsUtil as CommonConstantsUtil } from '@to-nexus/appkit-common'
import {
  AccountController,
  ApiController,
  type ChainAdapter,
  ChainController,
  ConnectionController,
  ConstantsUtil,
  CoreHelperUtil,
  OptionsController,
  type SIWXConfig,
  SendController,
  type ThemeMode,
  createDefaultSIWXConfig
} from '@to-nexus/appkit-core'
import type { CustomWallet } from '@to-nexus/appkit-core'
import { ConnectorUtil, createAppKitWalletButton } from '@to-nexus/appkit-wallet-button'
import {
  bscMainnet,
  bscTestnet,
  crossMainnet,
  crossTestnet,
  etherMainnet,
  etherTestnet,
  kaiaMainnet,
  kaiaTestnet,
  networkController,
  roninMainnet,
  roninTestnet
} from '@to-nexus/appkit/networks'
import UniversalProvider from '@to-nexus/universal-provider'

import { SDK_VERSION } from './constants.js'

export type {
  SendTransactionArgs,
  WriteContractArgs,
  AssetFilterType,
  ThemeMode,
  SignTypedDataV4Args,
  TypedDataDomain,
  TypedDataTypes,
  TypedDataField,
  ChainAdapter,
  CreateSIWXConfigOptions,
  SIWXConfig,
  SIWXMessage,
  SIWXSession
} from '@to-nexus/appkit-core'

const ethersAdapter = new EthersAdapter()

const CROSS_WALLET_WEBAPP_LINK = (() =>
  (CommonConstantsUtil as any).getCrossWalletWebappLink?.() ||
  'https://cross-wallet.crosstoken.io/wc')()

export type Metadata = {
  name: string
  description: string
  url: string
  icons: string[]
}

type SupportedNetworks =
  | typeof crossMainnet
  | typeof crossTestnet
  | typeof bscMainnet
  | typeof bscTestnet
  | typeof kaiaMainnet
  | typeof kaiaTestnet
  | typeof etherMainnet
  | typeof etherTestnet
  | typeof roninMainnet

const defaultMetadata: Metadata = {
  name: 'Cross SDK',
  description: 'Cross SDK for HTML',
  url: 'https://to.nexus',
  icons: ['https://contents.crosstoken.io/img/sample_app_circle_icon.png']
}

export type CrossSdkParams = {
  projectId: string
  redirectUrl?: string
  metadata?: Metadata
  themeMode?: ThemeMode
  defaultNetwork?: SupportedNetworks
  adapters?: ChainAdapter[]
  mobileLink?: string
  siwx?: SIWXConfig
}

// 싱글톤 인스턴스 및 초기화 파라미터 저장
let sdkInstance: ReturnType<typeof createAppKit> | null = null
let cachedMobileLink: string | undefined = undefined
let cachedSiwx: SIWXConfig | undefined = undefined

const initCrossSdkWithParams = (params: CrossSdkParams) => {
  // 이미 초기화된 경우 기존 인스턴스 반환
  if (sdkInstance) {
    return sdkInstance
  }

  const {
    projectId,
    redirectUrl,
    metadata,
    themeMode,
    defaultNetwork,
    adapters,
    mobileLink,
    siwx
  } = params

  // 파라미터 캐시 저장
  cachedMobileLink = mobileLink
  cachedSiwx = siwx

  sdkInstance = initCrossSdk(
    projectId,
    redirectUrl,
    metadata,
    themeMode,
    defaultNetwork,
    adapters,
    mobileLink,
    siwx
  )

  return sdkInstance
}

// Create modal
const initCrossSdk = (
  projectId: string,
  redirectUrl?: string,
  metadata?: Metadata,
  themeMode?: ThemeMode,
  defaultNetwork?: SupportedNetworks,
  adapters?: ChainAdapter[],
  mobileLink?: string,
  siwx?: SIWXConfig
) => {
  const mergedMetadata = {
    ...defaultMetadata,
    ...metadata,
    redirect: {
      universal: redirectUrl
    }
  }

  // Mobile_link를 미리 계산 (한 번만 평가)
  const resolvedMobileLink =
    mobileLink ||
    cachedMobileLink ||
    (CommonConstantsUtil as any).getCrossWalletWebappLink?.() ||
    CROSS_WALLET_WEBAPP_LINK

  // SIWX 설정도 캐시에서 복원
  const resolvedSiwx = siwx || cachedSiwx

  return createAppKit({
    adapters: adapters && adapters.length > 0 ? adapters : [ethersAdapter],
    networks: [
      ...networkController.getNetworks(),
      // 타입 호환성을 위해 튜플로 변환이 필요할 수 있으나, createAppKit이 배열을 받으므로 spread로 처리
    ] as [any, ...any[]], 
    defaultNetwork,
    metadata: mergedMetadata,
    projectId,
    themeMode: themeMode || 'light',
    siwx: resolvedSiwx,
    features: {
      swaps: false,
      onramp: false,
      receive: false,
      send: false,
      email: false,
      emailShowWallets: false,
      socials: false,
      history: false,
      analytics: false,
      legalCheckbox: false
    },
    enableCoinbase: false,
    customWallets: [
      {
        id: 'cross_wallet',
        name: 'CROSSx Wallet',
        image_url: 'https://contents.crosstoken.io/wallet/token/images/CROSSx.svg',
        mobile_link: resolvedMobileLink,
        app_store: 'https://apps.apple.com/us/app/crossx-games/id6741250674',
        play_store: 'https://play.google.com/store/apps/details?id=com.nexus.crosswallet',
        chrome_store:
          'https://chromewebstore.google.com/detail/crossx/nninbdadmocnokibpaaohnoepbnpdgcg',
        rdns: 'nexus.to.crosswallet.desktop',
        injected: [
          {
            injected_id: 'nexus.to.crosswallet.desktop'
          }
        ]
      } as CustomWallet & { chrome_store?: string }
    ],
    allWallets: 'HIDE'
  })
}

export const useAppKitWallet = () => {
  const walletButton = createAppKitWalletButton()

  return walletButton
}

export const sdkVersion = SDK_VERSION

export {
  initCrossSdkWithParams,
  initCrossSdk,
  ConnectionController,
  SendController,
  AccountController,
  ApiController,
  ChainController,
  CoreHelperUtil,
  createDefaultSIWXConfig,
  OptionsController,
  crossMainnet,
  crossTestnet,
  bscMainnet,
  bscTestnet,
  kaiaMainnet,
  kaiaTestnet,
  etherMainnet,
  etherTestnet,
  roninMainnet,
  roninTestnet,
  UniversalProvider,
  ConstantsUtil,
  ConnectorUtil
}
